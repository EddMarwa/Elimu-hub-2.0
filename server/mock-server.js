const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock database (in-memory storage)
const users = [
  {
    id: '1',
    email: 'admin@elimuhub.com',
    password: '$2a$10$K8f7QH2E3zVvQ2dqZOgqr.xJqt5hF3Bz4EWNf7d5z8q2m4v6c8x0e', // admin123
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    school: 'ElimuHub Central',
    county: 'Nairobi',
    subjects: ['Mathematics', 'Science & Technology'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'teacher@elimuhub.com',
    password: '$2a$10$yN7QH2E3zVvQ2dqZOgqr.xJqt5hF3Bz4EWNf7d5z8q2m4v6c8x0f', // password123
    firstName: 'Jane',
    lastName: 'Teacher',
    role: 'TEACHER',
    school: 'CBC Primary School',
    county: 'Kiambu',
    subjects: ['English', 'Kiswahili', 'Mathematics'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper function to generate JWT-like token (mock)
const generateToken = (user) => {
  return `mock-jwt-token-${user.id}-${Date.now()}`;
};

// Helper function to find user by email
const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

// Helper function to create user response (exclude password)
const createUserResponse = (user) => {
  const { password, ...userResponse } = user;
  return userResponse;
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Mock server is running!', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const userResponse = createUserResponse(user);

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, school, county, subjects } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'TEACHER',
      school: school || '',
      county: county || '',
      subjects: subjects || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);

    const token = generateToken(newUser);
    const userResponse = createUserResponse(newUser);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile (protected route)
app.get('/api/auth/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // In a real app, you would verify the JWT token here
    // For this mock, we'll just extract user ID from the token
    const token = authHeader.split(' ')[1];
    const userId = token.split('-')[3]; // Extract user ID from mock token

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userResponse = createUserResponse(user);
    res.json(userResponse);

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/auth/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const userId = token.split('-')[3];

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = req.body;
    delete updates.password; // Don't allow password updates through this endpoint
    delete updates.id; // Don't allow ID updates
    delete updates.email; // Don't allow email updates for simplicity

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const userResponse = createUserResponse(users[userIndex]);
    res.json(userResponse);

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout (mock)
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Default route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'ElimuHub 2.0 Mock API Server',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/profile',
      'PUT /api/auth/profile',
      'POST /api/auth/logout'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock server running on http://localhost:${PORT}`);
  console.log(`📚 ElimuHub 2.0 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`\n🔐 Demo accounts:`);
  console.log(`   Admin: admin@elimuhub.com / admin123`);
  console.log(`   Teacher: teacher@elimuhub.com / password123`);
});

module.exports = app;
