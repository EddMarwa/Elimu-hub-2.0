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
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  
  const [stats, setStats] = useState<DashboardStats>({
    lessonPlans: 0,
    schemesOfWork: 0,
    documents: 0,
    collaborations: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
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
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
    { title: 'Create Lesson Plan', icon: <Assignment />, path: '/lesson-plan-generator', color: 'primary' },
    { title: 'New Scheme of Work', icon: <Description />, path: '/scheme-editor', color: 'secondary' },
    { title: 'Upload Document', icon: <School />, path: '/upload', color: 'success' },
    { title: 'View Analytics', icon: <Analytics />, path: '/analytics', color: 'info' },
  ];

  const adminActions = [
    { title: 'User Management', icon: <SupervisorAccount />, path: '/admin/users', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { title: 'System Settings', icon: <AdminPanelSettings />, path: '/admin/settings', roles: ['SUPER_ADMIN'] },
    { title: 'Analytics Dashboard', icon: <Analytics />, path: '/admin/analytics', roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  const filteredAdminActions = adminActions.filter(action => 
    user?.role && action.roles.includes(user.role)
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {getGreeting()}, {user?.firstName}!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Welcome back to your ElimuHub dashboard
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip 
                label={user?.role?.replace('_', ' ')} 
                color="primary" 
                variant="outlined"
                size="small"
              />
              {user?.school && (
                <Chip 
                  label={user.school} 
                  color="secondary" 
                  variant="outlined"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </Grid>
          <Grid item>
            <IconButton onClick={handleMenuClick}>
              <MoreVert />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={() => navigate('/profile')}>Profile Settings</MenuItem>
              <MenuItem onClick={() => navigate('/help')}>Help & Support</MenuItem>
              <MenuItem onClick={handleMenuClose}>Feedback</MenuItem>
            </Menu>
          </Grid>
        </Grid>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.lessonPlans}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Lesson Plans
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.schemesOfWork}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Schemes of Work
                  </Typography>
                </Box>
                <Description sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.documents}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Documents
                  </Typography>
                </Box>
                <School sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.collaborations}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Collaborations
                  </Typography>
                </Box>
                <Group sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={() => navigate(action.path)}
                      sx={{
                        height: 80,
                        flexDirection: 'column',
                        gap: 1,
                        borderColor: `${action.color}.main`,
                        color: `${action.color}.main`,
                        '&:hover': {
                          bgcolor: `${action.color}.light`,
                          color: 'white',
                        },
                      }}
                    >
                      {action.title}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Admin Actions (if applicable) */}
          {filteredAdminActions.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" color="error">
                  Admin Panel
                </Typography>
                <Grid container spacing={2}>
                  {filteredAdminActions.map((action, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        startIcon={action.icon}
                        onClick={() => navigate(action.path)}
                        sx={{ height: 60, flexDirection: 'column', gap: 0.5 }}
                      >
                        {action.title}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Recent Activity
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
                        color={
                          activity.status === 'completed' ? 'success' :
                          activity.status === 'in_progress' ? 'warning' : 'default'
                        }
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Progress Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                This Month's Progress
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Lesson Plans Created</Typography>
                  <Typography variant="body2" fontWeight="bold">8/10</Typography>
                </Box>
                <LinearProgress variant="determinate" value={80} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Schemes Completed</Typography>
                  <Typography variant="body2" fontWeight="bold">3/5</Typography>
                </Box>
                <LinearProgress variant="determinate" value={60} color="secondary" sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Documents Processed</Typography>
                  <Typography variant="body2" fontWeight="bold">12/15</Typography>
                </Box>
                <LinearProgress variant="determinate" value={80} color="success" sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                Notifications
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="New CBC guideline available"
                    secondary="2 hours ago"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Colleague shared a scheme"
                    secondary="1 day ago"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Monthly report ready"
                    secondary="3 days ago"
                  />
                </ListItem>
              </List>
              <Button size="small" color="primary" sx={{ mt: 1 }}>
                View All Notifications
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardNew;
