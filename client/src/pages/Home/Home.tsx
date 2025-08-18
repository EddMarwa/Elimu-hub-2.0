import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  School,
  MenuBook,
  Assignment,
  Group,
  TrendingUp,
  Security,
  Menu as MenuIcon,
} from '@mui/icons-material';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <MenuBook sx={{ fontSize: 40 }} />,
              title: 'Scheme of Work Generator',
        description: 'Create comprehensive schemes of work aligned with CBC curriculum using AI assistance.',
    },
    {
      icon: <Assignment sx={{ fontSize: 40 }} />,
      title: 'Schemes of Work',
      description: 'Design and manage complete schemes of work for different subjects and grades.',
    },
    {
      icon: <School sx={{ fontSize: 40 }} />,
      title: 'Educational Resources',
      description: 'Access a vast library of educational materials and teaching resources.',
    },
    {
      icon: <Group sx={{ fontSize: 40 }} />,
      title: 'Collaboration Tools',
      description: 'Work together with other educators to share and improve teaching materials.',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Progress Tracking',
      description: 'Monitor student progress and educational outcomes effectively.',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure Platform',
      description: 'Role-based access control ensures data security and proper permissions.',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        color: 'white',
        overflowX: 'hidden',
      }}
    >
      {/* Navigation Bar */}
      <AppBar 
        position="static" 
        sx={{ 
          background: 'transparent',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <School sx={{ mr: 2, fontSize: 32, color: '#fbbf24' }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '1.2rem', md: '1.5rem' },
              }}
            >
              Elimu Hub 2.0
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                background: 'linear-gradient(45deg, #f59e0b, #fbbf24)',
                color: 'white',
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(45deg, #d97706, #f59e0b)',
                },
              }}
            >
              Sign Up
            </Button>
          </Box>
          {/* Mobile menu button */}
          <IconButton
            sx={{ display: { xs: 'block', md: 'none' }, color: 'white' }}
            onClick={() => {/* Add mobile menu logic */}}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Box textAlign="center" mb={{ xs: 6, md: 10 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.2rem', sm: '2.5rem', md: '4rem', lg: '5rem' },
              fontWeight: 'bold',
              mb: 3,
              background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
            }}
          >
            🎓 Elimu Hub 2.0
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.8rem', lg: '2.2rem' },
              mb: 4,
              opacity: 0.9,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.4,
            }}
          >
            Empowering Kenyan Educators with AI-Powered Teaching Tools
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '0.95rem', sm: '1rem', md: '1.2rem' },
              mb: 6,
              opacity: 0.8,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Create schemes of work, manage educational resources, and enhance educational 
            outcomes with our comprehensive platform designed for the CBC curriculum.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                background: 'linear-gradient(45deg, #f59e0b, #fbbf24)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: { xs: '1rem', md: '1.2rem' },
                px: { xs: 3, md: 4 },
                py: { xs: 1.5, md: 2 },
                borderRadius: 2,
                '&:hover': {
                  background: 'linear-gradient(45deg, #d97706, #f59e0b)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'white',
                fontSize: { xs: '1rem', md: '1.2rem' },
                px: { xs: 3, md: 4 },
                py: { xs: 1.5, md: 2 },
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'white',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Sign In
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Box mb={{ xs: 6, md: 10 }}>
          <Typography
            variant="h2"
            textAlign="center"
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
              fontWeight: 'bold',
              mb: 6,
              color: '#fbbf24',
            }}
          >
            🚀 Powerful Features
          </Typography>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
                    <Box sx={{ color: '#fbbf24', mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        mb: 2,
                        color: '#fbbf24',
                        fontSize: { xs: '1.1rem', md: '1.3rem' },
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        lineHeight: 1.6,
                        fontSize: { xs: '0.9rem', md: '1rem' },
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box
          textAlign="center"
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            p: { xs: 3, sm: 4, md: 6 },
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            mb: { xs: 4, md: 8 },
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '1.2rem', sm: '1.8rem', md: '2.5rem' },
              fontWeight: 'bold',
              mb: 3,
              color: '#fbbf24',
            }}
          >
            Ready to Transform Your Teaching?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.9,
              maxWidth: '600px',
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            Join thousands of Kenyan educators who are already using Elimu Hub 2.0 
            to create better learning experiences.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              background: 'linear-gradient(45deg, #10b981, #34d399)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              px: { xs: 3, md: 6 },
              py: { xs: 1.5, md: 2.5 },
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(45deg, #059669, #10b981)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Start Your Journey Today
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          textAlign: 'center',
          py: { xs: 3, md: 4 },
          opacity: 0.8,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="body1" sx={{ mb: 1, fontSize: { xs: '0.9rem', md: '1rem' } }}>
          🌟 Your modern educational platform for CBC curriculum
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' }, opacity: 0.7 }}
        >
          Powered by AI • Built for Kenyan Educators • Designed for Excellence
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;
