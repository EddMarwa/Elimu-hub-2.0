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
  Upload,
  MenuBook,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  getTimeBasedGreeting, 
  getGreetingIcon, 
  formatUserName, 
  getCurrentDate,
  getCurrentTime 
} from '../../utils/greetings';

interface DashboardStats {
  lessonPlans: number;
  schemesOfWork: number;
  documents: number;
  collaborations: number;
}

interface RecentActivity {
  id: string;
  type: 'lesson_plan' | 'scheme' | 'document' | 'collaboration';
  title: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'pending';
}

const DashboardNew: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [stats, setStats] = useState<DashboardStats>({
    lessonPlans: 0,
    schemesOfWork: 0,
    documents: 0,
    collaborations: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000);

    // Simulate loading stats
    setStats({
      lessonPlans: 24,
      schemesOfWork: 8,
      documents: 15,
      collaborations: 5,
    });

    // Simulate recent activity
    setRecentActivity([
      { id: '1', type: 'lesson_plan', title: 'Mathematics - Fractions Grade 5', timestamp: '2 hours ago', status: 'completed' },
      { id: '2', type: 'scheme', title: 'Science Term 1 Scheme', timestamp: '1 day ago', status: 'in_progress' },
      { id: '3', type: 'document', title: 'CBC Guidelines Document', timestamp: '2 days ago', status: 'pending' },
      { id: '4', type: 'lesson_plan', title: 'English - Reading Comprehension', timestamp: '3 days ago', status: 'completed' },
    ]);

    return () => clearInterval(timeInterval);
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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

  const quickActions = [
    { title: 'Create Lesson Plan', icon: <Assignment />, path: '/lesson-plan-generator', color: '#1e3a8a', hoverColor: '#3b82f6' },
    { title: 'New Scheme of Work', icon: <Description />, path: '/scheme-editor', color: '#f59e0b', hoverColor: '#fbbf24' },
    { title: 'Upload Document', icon: <Upload />, path: '/upload', color: '#10b981', hoverColor: '#34d399' },
    { title: 'Library', icon: <MenuBook />, path: '/lesson-plans', color: '#8b5cf6', hoverColor: '#a78bfa' },
  ];

  const adminActions = [
    { title: 'User Management', icon: <SupervisorAccount />, path: '/admin/users', roles: ['admin', 'super_admin'] },
    { title: 'System Settings', icon: <AdminPanelSettings />, path: '/admin/settings', roles: ['super_admin'] },
    { title: 'Analytics Dashboard', icon: <Analytics />, path: '/admin/analytics', roles: ['admin', 'super_admin'] },
  ];

  const filteredAdminActions = adminActions.filter(action => 
    user?.role && action.roles.includes(user.role)
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Enhanced Welcome Header with Time-based Greeting */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            color: 'white',
            borderRadius: 3,
            p: { xs: 3, md: 4 },
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
                  width: { xs: 56, md: 72 }, 
                  height: { xs: 56, md: 72 }, 
                  background: 'linear-gradient(45deg, #f59e0b, #fbbf24)',
                  fontSize: { xs: '1.2rem', md: '1.8rem' },
                  fontWeight: 'bold',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
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
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {getGreetingIcon()} {getTimeBasedGreeting()}, {formatUserName(user?.firstName, user?.lastName)}!
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.9,
                    mb: 1,
                    fontSize: { xs: '0.9rem', md: '1.1rem' },
                  }}
                >
                  Welcome back to your educational dashboard
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ opacity: 0.8, fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                    📅 {getCurrentDate()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                    🕐 {currentTime}
                  </Typography>
                  {user?.role && (
                    <Chip
                      label={user.role.replace('_', ' ')}
                      size="small"
                      sx={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Grid>
            <Grid item>
              <IconButton
                onClick={handleMenuClick}
                sx={{ 
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <MoreVert />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
              color: 'white',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: 'transform 0.3s ease',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fbbf24' }}>
                      {stats.lessonPlans}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Lesson Plans
                    </Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', 
              color: 'white',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: 'transform 0.3s ease',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.schemesOfWork}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Schemes of Work
                    </Typography>
                  </Box>
                  <Description sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', 
              color: 'white',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: 'transform 0.3s ease',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.documents}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Documents
                    </Typography>
                  </Box>
                  <School sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', 
              color: 'white',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: 'transform 0.3s ease',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.collaborations}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Collaborations
                    </Typography>
                  </Box>
                  <Group sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1e3a8a' }}>
            ⚡ Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={action.icon}
                  onClick={() => navigate(action.path)}
                  sx={{
                    background: `linear-gradient(135deg, ${action.color} 0%, ${action.hoverColor} 100%)`,
                    color: 'white',
                    py: 2,
                    fontWeight: 'bold',
                    borderRadius: 2,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${action.hoverColor} 0%, ${action.color} 100%)`,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {action.title}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Admin Actions (if user has admin role) */}
        {filteredAdminActions.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1e3a8a' }}>
              👑 Admin Actions
            </Typography>
            <Grid container spacing={2}>
              {filteredAdminActions.map((action, index) => (
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
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                        color: 'white',
                        borderColor: '#1e3a8a',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {action.title}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Recent Activity */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1e3a8a' }}>
                📋 Recent Activity
              </Typography>
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getStatusIcon(activity.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={activity.timestamp}
                      />
                      <Chip
                        label={activity.status.replace('_', ' ')}
                        size="small"
                        color={activity.status === 'completed' ? 'success' : activity.status === 'in_progress' ? 'warning' : 'default'}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1e3a8a' }}>
                📊 This Week
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Lesson Plans Created
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={75} 
                  sx={{ 
                    mt: 1,
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    }
                  }} 
                />
                <Typography variant="caption">3 of 4 completed</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Documents Uploaded
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={50} 
                  sx={{ 
                    mt: 1,
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    }
                  }} 
                />
                <Typography variant="caption">2 of 4 completed</Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1e3a8a' }}>
                🎯 Quick Tips
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                💡 Use the AI lesson plan generator to create CBC-aligned content quickly.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                📚 Upload your existing materials to build a comprehensive resource library.
              </Typography>
              <Typography variant="body2">
                🤝 Collaborate with other teachers to share best practices.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
            Profile Settings
          </MenuItem>
          <MenuItem onClick={() => { navigate('/notifications'); handleMenuClose(); }}>
            Notifications
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose}>
            Logout
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};

export default DashboardNew;
