import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
  Avatar,
  Fade,
  Slide
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  School,
  Person
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate inputs
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      // Call login function from AuthContext
      await login(formData.email, formData.password);
      
      setSuccess('Login successful! Redirecting...');
      
      // Small delay to show success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      type: 'Admin',
      email: 'admin@elimuhub.com',
      password: 'admin123',
      icon: <Person />,
      color: '#1976d2'
    },
    {
      type: 'Teacher',
      email: 'teacher@elimuhub.com', 
      password: 'password123',
      icon: <School />,
      color: '#2e7d32'
    }
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setFormData({ email, password });
    setError('');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          margin: -3,
          padding: 3
        }}
      >
        <Slide direction="down" in={true} timeout={800}>
          <Paper 
            elevation={24} 
            sx={{ 
              padding: 4, 
              width: '100%',
              maxWidth: 480,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Header */}
            <Fade in={true} timeout={1000}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    mx: 'auto',
                    mb: 2,
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    fontSize: '2rem'
                  }}
                >
                  📚
                </Avatar>
                <Typography 
                  component="h1" 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  ElimuHub 2.0
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Welcome Back!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to access your CBC lesson plans and resources
                </Typography>
              </Box>
            </Fade>

            {/* Demo Accounts */}
            <Fade in={true} timeout={1200}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Quick Demo Access:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {demoAccounts.map((account) => (
                    <Button
                      key={account.type}
                      variant="outlined"
                      size="small"
                      startIcon={account.icon}
                      onClick={() => fillDemoAccount(account.email, account.password)}
                      sx={{
                        flex: 1,
                        borderColor: account.color,
                        color: account.color,
                        '&:hover': {
                          backgroundColor: account.color,
                          color: 'white'
                        }
                      }}
                    >
                      {account.type}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Fade>

            <Divider sx={{ mb: 3 }} />

            {/* Login Form */}
            <Fade in={true} timeout={1400}>
              <Box component="form" onSubmit={handleSubmit}>
                {/* Alerts */}
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}

                {/* Email Field */}
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  margin="normal"
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                />

                {/* Password Field */}
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  margin="normal"
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a6fd8, #6b4190)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                    },
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      Signing In...
                    </Box>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                {/* Footer Links */}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate('/register')}
                      sx={{ 
                        color: '#667eea',
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Sign Up
                    </Button>
                  </Typography>
                </Box>
              </Box>
            </Fade>
          </Paper>
        </Slide>

        {/* Footer */}
        <Fade in={true} timeout={1600}>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 3, 
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center'
            }}
          >
            © 2025 ElimuHub 2.0 - Empowering Kenyan Teachers with CBC Resources
          </Typography>
        </Fade>
      </Box>
    </Container>
  );
};

export default Login;