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
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Snackbar
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
  Upload as UploadIcon,
  FileUpload as FileUploadIcon,
  AdminPanelSettings as AdminIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { schemeFilesAPI } from '../../services/api';

interface SchemeFile {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  term: string;
  strand?: string;
  subStrand?: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  downloads: number;
  isPublic: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface SchemeStats {
  totalFiles: number;
  totalDownloads: number;
  recentUploads: SchemeFile[];
  topSubjects: Array<{
    subject: string;
    _count: { subject: number };
  }>;
}

const SchemesOfWorkDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schemeFiles, setSchemeFiles] = useState<SchemeFile[]>([]);
  const [recentFiles, setRecentFiles] = useState<SchemeFile[]>([]);
  const [popularFiles, setPopularFiles] = useState<SchemeFile[]>([]);
  const [stats, setStats] = useState<SchemeStats>({
    totalFiles: 0,
    totalDownloads: 0,
    recentUploads: [],
    topSubjects: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '',
    term: '',
    strand: '',
    subStrand: '',
    isPublic: true
  });
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchSchemeData();
  }, []);

  const fetchSchemeData = async () => {
    try {
      setLoading(true);
      const [filesResponse, recentResponse, popularResponse, statsResponse] = await Promise.all([
        schemeFilesAPI.getAll({ page: 1, limit: 10, sortBy: 'newest' }),
        schemeFilesAPI.getAll({ page: 1, limit: 5, sortBy: 'newest' }),
        schemeFilesAPI.getAll({ page: 1, limit: 5, sortBy: 'downloads' }),
        isAdmin ? schemeFilesAPI.getStats() : Promise.resolve({ data: { data: { totalFiles: 0, totalDownloads: 0, recentUploads: [], topSubjects: [] } } })
      ]);

      if (filesResponse.data.success) {
        setSchemeFiles(filesResponse.data.data);
      }

      if (recentResponse.data.success) {
        setRecentFiles(recentResponse.data.data);
      }

      if (popularResponse.data.success) {
        setPopularFiles(popularResponse.data.data);
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

    } catch (err: any) {
      setError('Failed to load scheme data');
      console.error('Error fetching scheme data:', err);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadForm.title || !uploadForm.subject || !uploadForm.grade || !uploadForm.term) {
      setSnackbar({ open: true, message: 'Please fill in all required fields and select a file', severity: 'error' });
      return;
    }

    try {
      setUploading(true);
      await schemeFilesAPI.upload(selectedFile, uploadForm);
      setSnackbar({ open: true, message: 'Scheme file uploaded successfully!', severity: 'success' });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({
        title: '',
        description: '',
        subject: '',
        grade: '',
        term: '',
        strand: '',
        subStrand: '',
        isPublic: true
      });
      fetchSchemeData(); // Refresh data
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to upload file', severity: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await schemeFilesAPI.download(fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Download started!', severity: 'success' });
      fetchSchemeData(); // Refresh to update download count
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Failed to download file', severity: 'error' });
    }
  };

  const renderSchemeFileItem = (schemeFile: SchemeFile, showActions: boolean = true) => (
    <ListItem key={schemeFile.id} sx={{ px: 0 }}>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: getSubjectColor(schemeFile.subject) }}>
          <DescriptionIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {schemeFile.title}
            </Typography>
            <Chip 
              label={schemeFile.grade} 
              size="small" 
              sx={{ bgcolor: getSubjectColor(schemeFile.subject), color: 'white' }}
            />
            {schemeFile.isPublic ? (
              <Chip label="Public" size="small" icon={<PublicIcon />} color="success" />
            ) : (
              <Chip label="Private" size="small" icon={<LockIcon />} color="warning" />
            )}
          </Box>
        }
        secondary={
          <Box>
            {schemeFile.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {schemeFile.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {schemeFile.subject}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Term {schemeFile.term}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(schemeFile.createdAt)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <DownloadIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption">
                  {schemeFile.downloads}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(schemeFile.fileSize)}
              </Typography>
            </Box>
          </Box>
        }
      />
      {showActions && (
        <ListItemSecondaryAction>
          <IconButton 
            size="small"
            onClick={() => handleDownload(schemeFile.id, schemeFile.originalName)}
            color="primary"
          >
            <DownloadIcon />
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
        <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <AssessmentIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Schemes of Work
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                {isAdmin ? 'Upload and manage scheme files for teachers' : 'Download scheme files uploaded by administrators'}
              </Typography>
            </Box>
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              >
                Upload Scheme
              </Button>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
              {stats.totalFiles}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Schemes
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
              {stats.totalDownloads}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Downloads
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              {recentFiles.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recent Uploads
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: '#ed6c02', fontWeight: 'bold' }}>
              {stats.topSubjects.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Subjects Covered
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
              placeholder="Search schemes..."
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
          <Grid item xs={12} md={2}>
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
                <MenuItem value="CRE">CRE</MenuItem>
                <MenuItem value="IRE">IRE</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
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
              <InputLabel>Term</InputLabel>
              <Select
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                label="Term"
              >
                <MenuItem value="">All Terms</MenuItem>
                <MenuItem value="1">Term 1</MenuItem>
                <MenuItem value="2">Term 2</MenuItem>
                <MenuItem value="3">Term 3</MenuItem>
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
                <MenuItem value="title">Title A-Z</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Scheme Files */}
        <Grid item xs={12} lg={8}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Recent Scheme Files
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {recentFiles.length > 0 ? (
                <List>
                  {recentFiles.map((schemeFile, index) => (
                    <React.Fragment key={schemeFile.id}>
                      {renderSchemeFileItem(schemeFile)}
                      {index < recentFiles.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No scheme files yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {isAdmin ? 'Start uploading scheme files for teachers to download' : 'No scheme files have been uploaded yet'}
                  </Typography>
                  {isAdmin && (
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      Upload Scheme File
                    </Button>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Popular Scheme Files */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Popular Downloads
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {popularFiles.length > 0 ? (
                <List>
                  {popularFiles.map((schemeFile, index) => (
                    <React.Fragment key={schemeFile.id}>
                      {renderSchemeFileItem(schemeFile)}
                      {index < popularFiles.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No popular downloads yet
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Quick Stats */}
          {isAdmin && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Upload Statistics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Top Subject</Typography>
                <Typography variant="h6" sx={{ color: getSubjectColor(stats.topSubjects[0]?.subject || '') }}>
                  {stats.topSubjects[0]?.subject || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Recent Uploads</Typography>
                <Typography variant="h6" sx={{ color: '#1976d2' }}>
                  {stats.recentUploads.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Downloads</Typography>
                <Typography variant="h6" sx={{ color: '#2e7d32' }}>
                  {stats.totalDownloads}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Quick Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {isAdmin ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                    fullWidth
                  >
                    Upload New Scheme
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
                    onClick={() => navigate('/scheme-files')}
                    fullWidth
                  >
                    Browse All Schemes
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

          {/* Top Subjects */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Top Subjects
            </Typography>
            {stats.topSubjects.length > 0 ? (
              <List dense>
                {stats.topSubjects.map((subject, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getSubjectColor(subject.subject), width: 32, height: 32 }}>
                        <SubjectIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={subject.subject}
                      secondary={`${subject._count.subject} files`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No subject data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Scheme File</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<FileUploadIcon />}
                fullWidth
                sx={{ py: 3 }}
              >
                {selectedFile ? selectedFile.name : 'Choose File'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title *"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subject *"
                value={uploadForm.subject}
                onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grade *"
                value={uploadForm.grade}
                onChange={(e) => setUploadForm({ ...uploadForm, grade: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Term *"
                value={uploadForm.term}
                onChange={(e) => setUploadForm({ ...uploadForm, term: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Strand"
                value={uploadForm.strand}
                onChange={(e) => setUploadForm({ ...uploadForm, strand: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sub-Strand"
                value={uploadForm.subStrand}
                onChange={(e) => setUploadForm({ ...uploadForm, subStrand: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={uploadForm.isPublic}
                    onChange={(e) => setUploadForm({ ...uploadForm, isPublic: e.target.checked })}
                  />
                }
                label="Make this file public for all teachers"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleFileUpload} 
            variant="contained" 
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      {isAdmin && (
        <Fab
          color="primary"
          aria-label="upload"
          sx={{ position: 'fixed', bottom: 16, right: 16, bgcolor: '#9c27b0' }}
          onClick={() => setUploadDialogOpen(true)}
        >
          <UploadIcon />
        </Fab>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SchemesOfWorkDashboard;
