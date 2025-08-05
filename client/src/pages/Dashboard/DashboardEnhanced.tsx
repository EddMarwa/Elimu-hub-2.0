import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  Tooltip,
} from '@mui/material';
import {
  Assignment,
  Description,
  School,
  TrendingUp,
  Add,
  MoreVert,
  Dashboard as DashboardIcon,
  Group,
  Analytics,
  Notifications,
  Schedule,
  StarBorder,
  CheckCircle,
  PendingActions,
  SupervisorAccount,
  AdminPanelSettings,
  Psychology,
  MenuBook,
  Refresh,
  Settings,
  ExitToApp,
  Person,
  AccessTime,
  CalendarToday,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  lessonPlans: number;
  schemesOfWork: number;
  documents: number;
  collaborations: number;
  aiInteractions: number;
  weeklyProgress: number;
}

interface RecentActivity {
  id: string;
  type: 'lesson_plan' | 'scheme' | 'document' | 'collaboration' | 'ai_interaction';
  title: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface QuickTip {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const DashboardEnhanced: React.FC = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [stats, setStats] = useState<DashboardStats>({
    lessonPlans: 0,
    schemesOfWork: 0,
    documents: 0,
    collaborations: 0,
    aiInteractions: 0,
    weeklyProgress: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getGreetingIcon = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "🌅";
    if (hour < 17) return "☀️";
    return "🌙";
  };

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Simulate loading stats with animation
    const loadStats = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        lessonPlans: 28,
        schemesOfWork: 12,
        documents: 18,
        collaborations: 7,
        aiInteractions: 45,
        weeklyProgress: 85,
      });
      setLoading(false);
    };

    loadStats();

    // Simulate recent activity with AI interactions
    setRecentActivity([
      { 
        id: '1', 
        type: 'ai_interaction', 
        title: 'Generated Math lesson plan using Elimu Hub AI', 
        timestamp: '30 minutes ago', 
        status: 'completed' 
      },
      { 
        id: '2', 
        type: 'lesson_plan', 
        title: 'Mathematics - Fractions Grade 5', 
        timestamp: '2 hours ago', 
        status: 'completed' 
      },
      { 
        id: '3', 
        type: 'scheme', 
        title: 'Science Term 1 Scheme', 
        timestamp: '1 day ago', 
        status: 'in_progress' 
      },
      { 
        id: '4', 
        type: 'ai_interaction', 
        title: 'Asked Elimu Hub AI for teaching strategies', 
        timestamp: '1 day ago', 
        status: 'completed' 
      },
      { 
        id: '5', 
        type: 'document', 
        title: 'CBC Guidelines Document', 
        timestamp: '2 days ago', 
        status: 'pending' 
      },
    ]);

    return () => clearInterval(timeInterval);
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleMenuClose();
  };

  const handleRefresh = () => {
    window.location.reload();
    handleMenuClose();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson_plan':
        return <Assignment color="primary" />;
      case 'scheme':
        return <Description color="warning" />;
      case 'document':
        return <MenuBook color="info" />;
      case 'collaboration':
        return <Group color="success" />;
      case 'ai_interaction':
        return <Psychology color="secondary" />;
      default:
        return <StarBorder />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'in_progress':
        return <PendingActions color="warning" />;
      case 'pending':
        return <Schedule color="action" />;
      default:
        return <StarBorder />;
    }
  };

  const statsCards = [
    { 
      title: 'Lesson Plans', 
      value: stats.lessonPlans, 
      icon: <Assignment />, 
      color: '#1e3a8a',
      change: '+12%'
    },
    { 
      title: 'Schemes of Work', 
      value: stats.schemesOfWork, 
      icon: <Description />, 
      color: '#f59e0b',
      change: '+8%'
    },
    { 
      title: 'AI Interactions', 
      value: stats.aiInteractions, 
      icon: <Psychology />, 
      color: '#10b981',
      change: '+25%'
    },
    { 
      title: 'Collaborations', 
      value: stats.collaborations, 
      icon: <Group />, 
      color: '#8b5cf6',
      change: '+5%'
    },
  ];

  const quickActions = [
    { 
      title: 'Elimu Hub AI', 
      icon: <Psychology />, 
      path: '/ai-assistant', 
      color: '#10b981',
      description: 'Chat with AI assistant'
    },
    { 
      title: 'Create Lesson Plan', 
      icon: <Assignment />, 
      path: '/lesson-plan-generator', 
      color: '#1e3a8a',
      description: 'Generate CBC-aligned lessons'
    },
    { 
      title: 'New Scheme of Work', 
      icon: <Description />, 
      path: '/scheme-editor', 
      color: '#f59e0b',
      description: 'Build comprehensive schemes'
    },
    { 
      title: 'Browse Library', 
      icon: <MenuBook />, 
      path: '/lesson-plans', 
      color: '#8b5cf6',
      description: 'Access teaching materials'
    },
  ];

  const adminActions = user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(user.role) ? [
    { 
      title: 'User Management', 
      icon: <SupervisorAccount />, 
      path: '/admin/users',
      description: 'Manage user accounts'
    },
    { 
      title: 'System Settings', 
      icon: <AdminPanelSettings />, 
      path: '/admin/settings',
      description: 'Configure system settings',
      adminOnly: true
    },
    { 
      title: 'Analytics Dashboard', 
      icon: <Analytics />, 
      path: '/admin/analytics',
      description: 'View system analytics'
    },
  ].filter(action => !action.adminOnly || user.role === 'SUPER_ADMIN') : [];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Enhanced Welcome Header */}
        <Fade in={true} timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              color: 'white',
              borderRadius: 3,
              p: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '200px',
                height: '200px',
                background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: '50%',
                transform: 'translate(50%, -50%)',
              }
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    background: 'linear-gradient(45deg, #f59e0b, #fbbf24)',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    border: '3px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {user?.firstName?.charAt(0) || 'U'}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      fontSize: { xs: '1.75rem', md: '2.125rem' }
                    }}
                  >
                    {getGreetingIcon()} {getTimeBasedGreeting()}, {user?.firstName || 'Teacher'}!
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.9,
                      mb: 2,
                      fontSize: { xs: '1rem', md: '1.1rem' }
                    }}
                  >
                    Ready to inspire and educate today? Let's make learning amazing!
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip
                      icon={<CalendarToday sx={{ fontSize: 16 }} />}
                      label={currentTime.toLocaleDateString()}
                      size="small"
                      sx={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                    <Chip
                      icon={<AccessTime sx={{ fontSize: 16 }} />}
                      label={currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      size="small"
                      sx={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                    {user?.role && (
                      <Chip
                        label={`${user.role.replace('_', ' ')}`}
                        size="small"
                        sx={{
                          background: 'rgba(251, 191, 36, 0.2)',
                          color: '#fbbf24',
                          fontWeight: 'bold',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item>
                <Tooltip title="More options">
                  <IconButton
                    onClick={handleMenuClick}
                    sx={{ 
                      color: 'white',
                      background: 'rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.2)',
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
        </Fade>

        {/* Enhanced Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Fade in={!loading} timeout={1000 + (index * 200)}>
                <Card sx={{ 
                  height: '100%', 
                  background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}CC 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                  },
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}>
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {loading ? '...' : stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {stat.title}
                        </Typography>
                      </Box>
                      <Box sx={{ opacity: 0.8 }}>
                        {React.cloneElement(stat.icon, { sx: { fontSize: 40 } })}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {stat.change} this month
                      </Typography>
                    </Box>
                  </CardContent>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      zIndex: 0,
                    }}
                  />
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Enhanced Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1e3a8a' }}>
            ⚡ Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Fade in={true} timeout={1200 + (index * 150)}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      background: 'white',
                      border: `2px solid ${action.color}15`,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 40px ${action.color}25`,
                        border: `2px solid ${action.color}30`,
                      },
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => navigate(action.path)}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: action.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                          color: 'white',
                        }}
                      >
                        {React.cloneElement(action.icon, { sx: { fontSize: 28 } })}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: action.color }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Admin Actions */}
        {adminActions.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1e3a8a' }}>
              👑 Admin Actions
            </Typography>
            <Grid container spacing={2}>
              {adminActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={() => navigate(action.path)}
                    sx={{
                      borderColor: '#1e3a8a',
                      color: '#1e3a8a',
                      py: 2,
                      fontWeight: 'bold',
                      borderRadius: 2,
                      background: 'white',
                      '&:hover': {
                        background: '#1e3a8a',
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(30, 58, 138, 0.25)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {action.title}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {action.description}
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Content Grid */}
        <Grid container spacing={3}>
          {/* Recent Activity */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: 3, height: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                  📋 Recent Activity
                </Typography>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={handleRefresh}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        '&:hover': {
                          bgcolor: '#f8fafc',
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {activity.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {activity.timestamp}
                          </Typography>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(activity.status)}
                        <Chip
                          label={activity.status.replace('_', ' ')}
                          size="small"
                          color={
                            activity.status === 'completed' ? 'success' : 
                            activity.status === 'in_progress' ? 'warning' : 'default'
                          }
                        />
                      </Box>
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Weekly Progress */}
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1e3a8a' }}>
                📊 Weekly Progress
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Overall Progress
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {stats.weeklyProgress}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.weeklyProgress} 
                  sx={{ 
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                      borderRadius: 4,
                    }
                  }} 
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Lesson Plans Created
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={75} 
                  sx={{ 
                    mt: 1,
                    height: 6,
                    borderRadius: 3,
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                      borderRadius: 3,
                    }
                  }} 
                />
                <Typography variant="caption">3 of 4 completed</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary">
                  AI Interactions
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={90} 
                  sx={{ 
                    mt: 1,
                    height: 6,
                    borderRadius: 3,
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                      borderRadius: 3,
                    }
                  }} 
                />
                <Typography variant="caption">45 of 50 daily interactions</Typography>
              </Box>
            </Paper>

            {/* Tips & Suggestions */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1e3a8a' }}>
                💡 Tips & Suggestions
              </Typography>
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #e0f2fe' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1e3a8a' }}>
                  🤖 Try Elimu Hub AI
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use our AI assistant to generate lesson plans, get teaching tips, and create educational content faster.
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #dcfce7' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#15803d' }}>
                  📚 Explore Library
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Browse our extensive collection of CBC-aligned teaching resources and materials.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Enhanced Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 200,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            }
          }}
        >
          <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Profile Settings" />
          </MenuItem>
          <MenuItem onClick={() => { navigate('/notifications'); handleMenuClose(); }}>
            <ListItemIcon>
              <Notifications fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Notifications" />
          </MenuItem>
          <MenuItem onClick={handleRefresh}>
            <ListItemIcon>
              <Refresh fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Refresh Dashboard" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <ExitToApp fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};

export default DashboardEnhanced;
