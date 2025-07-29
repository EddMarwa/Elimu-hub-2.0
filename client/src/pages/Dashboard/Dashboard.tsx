import React from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Avatar,
  Paper
} from '@mui/material';
import { 
  Upload as UploadIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Book as BookIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Upload Document',
      description: 'Upload CBC curriculum documents for processing',
      icon: <UploadIcon fontSize="large" />,
      color: '#1976d2',
      route: '/upload',
      action: 'Upload'
    },
    {
      title: 'Search Reference',
      description: 'Find relevant curriculum content and resources',
      icon: <SearchIcon fontSize="large" />,
      color: '#2e7d32',
      route: '/reference',
      action: 'Search'
    },
    {
      title: 'Generate Lesson Plan',
      description: 'Create CBC-compliant lesson plans',
      icon: <AssignmentIcon fontSize="large" />,
      color: '#ed6c02',
      route: '/lesson-plan-generator',
      action: 'Generate'
    },
    {
      title: 'Create Scheme of Work',
      description: 'Build comprehensive schemes of work',
      icon: <BookIcon fontSize="large" />,
      color: '#9c27b0',
      route: '/scheme-of-work-editor',
      action: 'Create'
    }
  ];

  const recentActivity = [
    { action: 'Uploaded Mathematics Grade 4 Teachers Guide', time: '2 hours ago' },
    { action: 'Generated Lesson Plan for Science - Plants', time: '5 hours ago' },
    { action: 'Created Scheme of Work for English Term 1', time: '1 day ago' },
    { action: 'Searched for Assessment Rubrics', time: '2 days ago' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Welcome back, {user?.firstName}!
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                {user?.role} • {user?.school} • {user?.county} County
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip 
                  label={`${user?.subjects ? (typeof user.subjects === 'string' ? JSON.parse(user.subjects).length : user.subjects.length) : 0} Subjects`} 
                  size="small" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} md={6} lg={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => navigate(action.route)}
            >
              <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                <Box 
                  sx={{ 
                    color: action.color, 
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                <Button 
                  variant="contained" 
                  sx={{ bgcolor: action.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(action.route);
                  }}
                >
                  {action.action}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Recent Activity
            </Typography>
            {recentActivity.map((activity, index) => (
              <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < recentActivity.length - 1 ? '1px solid #eee' : 'none' }}>
                <Typography variant="body1">{activity.action}</Typography>
                <Typography variant="caption" color="text.secondary">{activity.time}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              System Stats
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Documents Processed</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h4" sx={{ mr: 1 }}>24</Typography>
                <Chip label="+12% this month" size="small" color="success" />
              </Box>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Lesson Plans Created</Typography>
              <Typography variant="h4">47</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Schemes Generated</Typography>
              <Typography variant="h4">12</Typography>
            </Box>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              CBC Compliance
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Content Alignment Score
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={92} 
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
                color="success"
              />
              <Typography variant="body2" align="right">92%</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;