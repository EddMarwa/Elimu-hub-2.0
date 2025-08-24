import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  useTheme,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { 
  School, 
  Visibility, 
  VisibilityOff, 
  Login as LoginIcon,
  Email,
  Lock
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { toast } from 'react-toastify';

const LoginNew: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      const redirectPath = getRoleBasedRedirect(user.role);
      navigate(redirectPath);
    }
  }, [user, navigate]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const getRoleBasedRedirect = (userRole: UserRole): string => {
    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        return '/admin/settings'; // Super Admin goes to system settings
      case UserRole.ADMIN:
        return '/admin/users'; // Admin goes to user management
      case UserRole.TEACHER:
      default:
        return '/dashboard'; // Teachers go to main dashboard
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back! Login successful.');
      
      // Wait a moment for the auth context to update with user data
      setTimeout(() => {
        if (user) {
          const redirectPath = getRoleBasedRedirect(user.role);
          navigate(redirectPath);
        } else {
          navigate('/dashboard'); // Fallback
        }
      }, 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Teacher', email: 'teacher@elimuhub.com', password: 'teacher123' },
    { role: 'Admin', email: 'admin@elimuhub.com', password: 'admin123' },
    { role: 'Super Admin', email: 'superadmin@elimuhub.com', password: 'superadmin123' },
  ];

  const handleDemoLogin = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 2, md: 4 },
        px: { xs: 1, md: 0 },
      }}
    >
      <Container maxWidth="lg" sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: { xs: '100vh', md: '80vh' },
        p: 0,
      }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center" sx={{ minHeight: { xs: 'auto', md: '70vh' } }}>
          {/* Welcome Section */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ color: 'white', pr: { md: 4 }, textAlign: { xs: 'center', md: 'left' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <School sx={{ fontSize: 48, mr: 2, color: 'secondary.main' }} />
                <Typography variant="h3" fontWeight="bold">
                  ElimuHub 2.0
                </Typography>
              </Box>
              <Typography variant="h5" gutterBottom sx={{ opacity: 0.9 }}>
                Welcome to Kenya's Premier CBC Education Platform
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, mb: 4, lineHeight: 1.6 }}>
                Generate CBC-compliant schemes of work and educational content 
                with AI-powered tools designed specifically for Kenyan teachers.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} />
                  <Typography variant="body2">AI-Powered Content Generation</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} />
                  <Typography variant="body2">CBC Curriculum Compliance</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} />
                  <Typography variant="body2">Collaborative Workspace</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Login Form */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Card elevation={12} sx={{ maxWidth: 480, width: '100%', mx: 'auto', my: { xs: 4, md: 0 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <Typography variant="h4" gutterBottom textAlign="center" fontWeight="bold" color="primary">
                  Sign In
                </Typography>
                <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mb: 3 }}>
                  Enter your credentials to access your account
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                    autoComplete="email"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    sx={{ mb: 3 }}
                    autoComplete="current-password"
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
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                    sx={{ mb: 2, py: 1.5 }}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link component={RouterLink} to="/register" color="primary" fontWeight="bold">
                      Sign up here
                    </Link>
                  </Typography>
                </Box>
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Demo Accounts
                  </Typography>
                </Divider>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {demoCredentials.map((cred) => (
                    <Button
                      key={cred.role}
                      variant="outlined"
                      size="small"
                      onClick={() => handleDemoLogin(cred.email, cred.password)}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      <Box sx={{ textAlign: 'left', width: '100%' }}>
                        <Typography variant="caption" fontWeight="bold">
                          {cred.role} Demo
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {cred.email}
                        </Typography>
                      </Box>
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginNew;
