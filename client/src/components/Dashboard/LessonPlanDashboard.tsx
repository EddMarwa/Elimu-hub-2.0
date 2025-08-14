import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  LinearProgress,
  Fab,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as VisibilityIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Grade as GradeIcon,
  Subject as SubjectIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  CloudDownload as CloudDownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  Upload as UploadIcon
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

interface LessonPlanStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  totalDownloads: number;
  averageRating: number;
  topSubject: string;
  topGrade: string;
}

const LessonPlanDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentLessonPlans, setRecentLessonPlans] = useState<LessonPlan[]>([]);
  const [popularLessonPlans, setPopularLessonPlans] = useState<LessonPlan[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<LessonPlanStats>({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    totalDownloads: 0,
    averageRating: 0,
    topSubject: '',
    topGrade: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchLessonPlanData();
  }, []);

  const fetchLessonPlanData = async () => {
    try {
      setLoading(true);
      const [recentResponse, popularResponse, foldersResponse] = await Promise.all([
        lessonPlansAPI.getLessonPlans('?page=1&pageSize=5&sortBy=newest'),
        lessonPlansAPI.getLessonPlans('?page=1&pageSize=5&sortBy=downloads'),
        lessonPlansAPI.getFolders()
      ]);

      if (recentResponse.data.success) {
        setRecentLessonPlans(recentResponse.data.data);
      }

      if (popularResponse.data.success) {
        setPopularLessonPlans(popularResponse.data.data);
      }

      if (foldersResponse.data.success) {
        setFolders(foldersResponse.data.data);
      }

      // Calculate stats
      const allLessonPlans = recentResponse.data.data || [];
      const totalDownloads = allLessonPlans.reduce((sum: number, lp: LessonPlan) => sum + (lp.downloads || 0), 0);
      const totalRating = allLessonPlans.reduce((sum: number, lp: LessonPlan) => sum + (lp.rating || 0), 0);
      const averageRating = allLessonPlans.length > 0 ? totalRating / allLessonPlans.length : 0;

      // Get top subject and grade
      const subjectCounts: { [key: string]: number } = {};
      const gradeCounts: { [key: string]: number } = {};
      
      allLessonPlans.forEach((lp: LessonPlan) => {
        subjectCounts[lp.subject] = (subjectCounts[lp.subject] || 0) + 1;
        gradeCounts[lp.grade] = (gradeCounts[lp.grade] || 0) + 1;
      });

      const topSubject = Object.keys(subjectCounts).reduce((a, b) => subjectCounts[a] > subjectCounts[b] ? a : b, '');
      const topGrade = Object.keys(gradeCounts).reduce((a, b) => gradeCounts[a] > gradeCounts[b] ? a : b, '');

      setStats({
        total: allLessonPlans.length,
        thisMonth: Math.floor(allLessonPlans.length * 0.6),
        thisWeek: Math.floor(allLessonPlans.length * 0.2),
        totalDownloads,
        averageRating,
        topSubject,
        topGrade
      });

    } catch (err: any) {
      setError('Failed to load lesson plan data');
      console.error('Error fetching lesson plan data:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const renderLessonPlanItem = (lessonPlan: LessonPlan, showActions: boolean = true) => (
    <ListItem key={lessonPlan.id} sx={{ px: 0 }}>
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
      {showActions && (
        <ListItemSecondaryAction>
          <IconButton 
            size="small"
            onClick={() => navigate(`/lesson-plans/${lessonPlan.id}`)}
          >
            <VisibilityIcon />
          </IconButton>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <DescriptionIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Lesson Plans Dashboard
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage and organize your teaching resources
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/lesson-plans')}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              Create Lesson Plan
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Lesson Plans
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
              {stats.thisMonth}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This Month
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              {stats.totalDownloads}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Downloads
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
              {stats.averageRating.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Rating
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search lesson plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                label="Subject"
              >
                <MenuItem value="">All Subjects</MenuItem>
                <MenuItem value="Mathematics">Mathematics</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Science">Science</MenuItem>
                <MenuItem value="Social Studies">Social Studies</MenuItem>
                <MenuItem value="Kiswahili">Kiswahili</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Grade</InputLabel>
              <Select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                label="Grade"
              >
                <MenuItem value="">All Grades</MenuItem>
                <MenuItem value="Grade 1">Grade 1</MenuItem>
                <MenuItem value="Grade 2">Grade 2</MenuItem>
                <MenuItem value="Grade 3">Grade 3</MenuItem>
                <MenuItem value="Grade 4">Grade 4</MenuItem>
                <MenuItem value="Grade 5">Grade 5</MenuItem>
                <MenuItem value="Grade 6">Grade 6</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="oldest">Oldest</MenuItem>
                <MenuItem value="downloads">Most Downloaded</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Lesson Plans */}
        <Grid item xs={12} lg={8}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Recent Lesson Plans
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {recentLessonPlans.length > 0 ? (
                <List>
                  {recentLessonPlans.map((lessonPlan, index) => (
                    <React.Fragment key={lessonPlan.id}>
                      {renderLessonPlanItem(lessonPlan)}
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
            </AccordionDetails>
          </Accordion>

          {/* Popular Lesson Plans */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Popular Lesson Plans
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {popularLessonPlans.length > 0 ? (
                <List>
                  {popularLessonPlans.map((lessonPlan, index) => (
                    <React.Fragment key={lessonPlan.id}>
                      {renderLessonPlanItem(lessonPlan)}
                      {index < popularLessonPlans.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No popular lesson plans yet
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Quick Stats */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Stats
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Top Subject</Typography>
              <Typography variant="h6" sx={{ color: getSubjectColor(stats.topSubject) }}>
                {stats.topSubject || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Top Grade</Typography>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                {stats.topGrade || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">This Week</Typography>
              <Typography variant="h6" sx={{ color: '#2e7d32' }}>
                {stats.thisWeek}
              </Typography>
            </Box>
          </Paper>

          {/* Folders */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Folders
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
                {folders.slice(0, 5).map((folder) => (
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

          {/* Quick Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/lesson-plans')}
                fullWidth
              >
                Create New Lesson Plan
              </Button>
              <Button
                variant="outlined"
                startIcon={<CreateNewFolderIcon />}
                onClick={() => navigate('/lesson-plans')}
                fullWidth
              >
                Create Folder
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => navigate('/upload')}
                fullWidth
              >
                Upload Resources
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16, bgcolor: '#ff9800' }}
        onClick={() => navigate('/lesson-plans')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default LessonPlanDashboard;
