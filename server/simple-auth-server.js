const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Demo users (in-memory storage)
const demoUsers = [
  {
    id: '1',
    email: 'admin@elimuhub.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    school: 'ElimuHub System',
    county: 'Nairobi',
    subjects: ['Mathematics', 'Science', 'English']
  },
  {
    id: '2',
    email: 'teacher@elimuhub.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    firstName: 'John',
    lastName: 'Doe',
    role: 'TEACHER',
    school: 'Sample Primary School',
    county: 'Nairobi',
    subjects: ['Mathematics', 'Science']
  },
  {
    id: '3',
    email: 'demo@elimuhub.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    firstName: 'Demo',
    lastName: 'Teacher',
    role: 'TEACHER',
    school: 'Demo School',
    county: 'Mombasa',
    subjects: ['English', 'Social Studies']
  }
];

const JWT_SECRET = 'elimuhub-demo-secret-key-2024';

// Helper function to find user by email
function findUserByEmail(email) {
  return demoUsers.find(user => user.email === email);
}

// Helper function to validate password
async function validatePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Demo Auth Server Running' });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'ElimuHub 2.0 Demo API',
    version: '1.0.0',
    message: 'Demo accounts available for testing',
    endpoints: {
      auth: '/api/auth',
      health: '/health'
    }
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Validate password
    const isValidPassword = await validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const { password: _, ...userData } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Registration disabled in demo mode. Use existing demo accounts.'
  });
});

app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = demoUsers.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { password: _, ...userData } = user;
    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Demo accounts info
app.get('/api/demo-accounts', (req, res) => {
  const accounts = demoUsers.map(user => ({
    email: user.email,
    password: 'password123',
    role: user.role,
    name: `${user.firstName} ${user.lastName}`
  }));
  
  res.json({
    success: true,
    message: 'Demo accounts for testing',
    data: accounts
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Demo Auth Server running on port', PORT);
  console.log('📚 ElimuHub 2.0 Demo API ready!');
  console.log('🔗 Health check: http://localhost:' + PORT + '/health');
  console.log('👥 Demo accounts available at: http://localhost:' + PORT + '/api/demo-accounts');
  console.log('');
  console.log('📧 Demo Login Credentials:');
  console.log('   Admin: admin@elimuhub.com / password123');
  console.log('   Teacher: teacher@elimuhub.com / password123');
  console.log('   Demo: demo@elimuhub.com / password123');
});
