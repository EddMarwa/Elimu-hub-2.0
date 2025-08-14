import React, { useState, useEffect } from 'react';
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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Upload as UploadIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Book as BookIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as VisibilityIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { lessonPlansAPI } from '../../services/api';

interface LessonPlan {
  id: string;
  title: string;
  description: string;
  grade: string;
  subject: string;
  tags: string[];
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  rating?: number;
  reviewCount?: number;
  downloads?: number;
  isPublic?: boolean;
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  lessonPlanCount?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentLessonPlans, setRecentLessonPlans] = useState<LessonPlan[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLessonPlanData();
  }, []);

  const fetchLessonPlanData = async () => {
    try {
      setLoading(true);
      const [lessonPlansResponse, foldersResponse] = await Promise.all([
        lessonPlansAPI.getLessonPlans('?page=1&pageSize=5&sortBy=newest'),
        lessonPlansAPI.getFolders()
      ]);

      if (lessonPlansResponse.data.success) {
        setRecentLessonPlans(lessonPlansResponse.data.data);
      }

      if (foldersResponse.data.success) {
        setFolders(foldersResponse.data.data);
      }
    } catch (err: any) {
      setError('Failed to load lesson plan data');
      console.error('Error fetching lesson plan data:', err);
    } finally {
      setLoading(false);
    }
  };

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
      title: 'Create Scheme of Work',
      description: 'Build comprehensive schemes of work',
      icon: <BookIcon fontSize="large" />,
      color: '#9c27b0',
      route: '/scheme-of-work-editor',
      action: 'Create'
    },
    {
      title: 'Lesson Plans',
      description: 'Manage and create lesson plans',
      icon: <DescriptionIcon fontSize="large" />,
      color: '#ff9800',
      route: '/lesson-plans',
      action: 'Manage'
    }
  ];

  const recentActivity = [
    { action: 'Uploaded Mathematics Grade 4 Teachers Guide', time: '2 hours ago' },
    { action: 'Created Scheme of Work for English Term 1', time: '1 day ago' },
    { action: 'Searched for Assessment Rubrics', time: '2 days ago' }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'Mathematics': '#1976d2',
      'English': '#2e7d32',
      'Science': '#ed6c02',
      'Social Studies': '#9c27b0',
      'Kiswahili': '#d32f2f',
      'CRE': '#7b1fa2',
      'IRE': '#388e3c',
      'Physical Education': '#f57c00',
      'Arts and Craft': '#c2185b',
      'Music': '#0288d1'
    };
    return colors[subject] || '#666';
  };

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

      {/* Lesson Plans Section */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Lesson Plans
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Recent Lesson Plans */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Lesson Plans
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/lesson-plans')}
                  size="small"
                >
                  View All
                </Button>
              </Box>
              
              {recentLessonPlans.length > 0 ? (
                <List>
                  {recentLessonPlans.map((lessonPlan, index) => (
                    <React.Fragment key={lessonPlan.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getSubjectColor(lessonPlan.subject) }}>
                            <DescriptionIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {lessonPlan.title}
                              </Typography>
                              <Chip 
                                label={lessonPlan.grade} 
                                size="small" 
                                sx={{ bgcolor: getSubjectColor(lessonPlan.subject), color: 'white' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {lessonPlan.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {lessonPlan.subject}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(lessonPlan.createdAt)}
                                </Typography>
                                {lessonPlan.rating && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <StarIcon sx={{ fontSize: 14, color: '#ffc107' }} />
                                    <Typography variant="caption">
                                      {lessonPlan.rating.toFixed(1)}
                                    </Typography>
                                  </Box>
                                )}
                                {lessonPlan.downloads && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <DownloadIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption">
                                      {lessonPlan.downloads}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            size="small"
                            onClick={() => navigate(`/lesson-plans/${lessonPlan.id}`)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < recentLessonPlans.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No lesson plans yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Start creating lesson plans to organize your teaching resources
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/lesson-plans')}
                  >
                    Create Lesson Plan
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Lesson Plan Stats and Folders */}
          <Grid item xs={12} lg={4}>
            {/* Lesson Plan Stats */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Lesson Plan Stats
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Total Lesson Plans</Typography>
                <Typography variant="h4" sx={{ color: '#ff9800' }}>
                  {recentLessonPlans.length > 0 ? recentLessonPlans.length + '+' : '0'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">This Month</Typography>
                <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                  {Math.floor(recentLessonPlans.length * 0.6)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Folders</Typography>
                <Typography variant="h4" sx={{ color: '#1976d2' }}>
                  {folders.length}
                </Typography>
              </Box>
            </Paper>

            {/* Recent Folders */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Folders
                </Typography>
                <IconButton 
                  size="small"
                  onClick={() => navigate('/lesson-plans')}
                >
                  <CreateNewFolderIcon />
                </IconButton>
              </Box>
              
              {folders.length > 0 ? (
                <List dense>
                  {folders.slice(0, 3).map((folder) => (
                    <ListItem key={folder.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#1976d2' }}>
                          <FolderIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={folder.name}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {folder.lessonPlanCount || 0} lesson plans
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              • {formatDate(folder.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <FolderIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No folders yet
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Schemes of Work Section */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Schemes of Work
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Schemes Overview */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Recent Scheme Files
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/schemes-of-work')}
                size="small"
              >
                View All
              </Button>
            </Box>
            
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' 
                  ? 'No scheme files uploaded yet' 
                  : 'No scheme files available yet'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
                  ? 'Start uploading scheme files for teachers to download'
                  : 'Administrators will upload scheme files for you to download'
                }
              </Typography>
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => navigate('/schemes-of-work')}
                  sx={{ bgcolor: '#9c27b0' }}
                >
                  Upload Scheme File
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Schemes Stats and Actions */}
        <Grid item xs={12} lg={4}>
          {/* Schemes Stats */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Scheme Files Stats
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Total Files</Typography>
              <Typography variant="h4" sx={{ color: '#9c27b0' }}>
                0
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Total Downloads</Typography>
              <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                0
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Subjects Covered</Typography>
              <Typography variant="h4" sx={{ color: '#1976d2' }}>
                0
              </Typography>
            </Box>
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => navigate('/schemes-of-work')}
                    fullWidth
                  >
                    Upload Scheme File
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate('/scheme-of-work-generator')}
                    fullWidth
                  >
                    Generate Scheme
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => navigate('/schemes-of-work')}
                    fullWidth
                  >
                    Browse Schemes
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate('/scheme-of-work-generator')}
                    fullWidth
                  >
                    Create Custom Scheme
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
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