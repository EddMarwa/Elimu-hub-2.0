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

  useEffect(() => {
    // Simulate loading stats
    const loadStats = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        lessonPlans: 24,
        schemesOfWork: 8,
        documents: 15,
        collaborations: 5,
        aiInteractions: 32,
        weeklyProgress: 75,
      });
      setLoading(false);
    };

    loadStats();

    // Simulate recent activity
    setRecentActivity([
      { 
        id: '1', 
        type: 'lesson_plan', 
        title: 'Mathematics - Fractions Grade 5', 
        timestamp: '2 hours ago', 
        status: 'completed' 
      },
      { 
        id: '2', 
        type: 'scheme', 
        title: 'Science Term 1 Scheme', 
        timestamp: '1 day ago', 
        status: 'in_progress' 
      },
      { 
        id: '3', 
        type: 'document', 
        title: 'CBC Guidelines Document', 
        timestamp: '2 days ago', 
        status: 'pending' 
      },
    ]);
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Welcome Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: 'white',
          borderRadius: 3,
          p: 3,
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
              }}
            >
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Welcome back, {user?.firstName || 'Teacher'}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Ready to create amazing educational content today?
            </Typography>
          </Grid>
          <Grid item>
            <IconButton
              onClick={handleMenuClick}
              sx={{ color: 'white' }}
            >
              <MoreVert />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                    {loading ? '...' : stats.lessonPlans}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lesson Plans
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, color: '#1e3a8a' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f59e0b' }}>
                    {loading ? '...' : stats.schemesOfWork}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Schemes of Work
                  </Typography>
                </Box>
                <Description sx={{ fontSize: 40, color: '#f59e0b' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                    {loading ? '...' : stats.documents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Documents
                  </Typography>
                </Box>
                <MenuBook sx={{ fontSize: 40, color: '#10b981' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                    {loading ? '...' : stats.collaborations}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Collaborations
                  </Typography>
                </Box>
                <Group sx={{ fontSize: 40, color: '#8b5cf6' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Assignment />}
              onClick={() => navigate('/lesson-plan-generator')}
              sx={{ py: 2 }}
            >
              Create Lesson Plan
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Description />}
              onClick={() => navigate('/scheme-editor')}
              sx={{ py: 2 }}
            >
              New Scheme of Work
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Psychology />}
              onClick={() => navigate('/ai-assistant')}
              sx={{ py: 2 }}
            >
              AI Assistant
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<MenuBook />}
              onClick={() => navigate('/lesson-plans')}
              sx={{ py: 2 }}
            >
              Browse Library
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      {activity.type === 'lesson_plan' && <Assignment color="primary" />}
                      {activity.type === 'scheme' && <Description color="warning" />}
                      {activity.type === 'document' && <MenuBook color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={activity.timestamp}
                    />
                    <Chip
                      label={activity.status}
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
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Progress */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Weekly Progress
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Overall Progress
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.weeklyProgress} 
                sx={{ mt: 1, height: 8, borderRadius: 4 }} 
              />
              <Typography variant="caption">
                {stats.weeklyProgress}% completed
              </Typography>
            </Box>
          </Paper>

          {/* Tips */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Tips & Suggestions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try using the AI Assistant to generate lesson plans faster and more efficiently.
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
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => logout()}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default DashboardEnhanced;
