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
  Breadcrumbs,
  Link,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem as MenuItemComponent,
  Badge,
  Avatar,
  Rating,
  Collapse,
} from '@mui/material';
import {
  Folder,
  Description,
  Download,
  Visibility,
  Add,
  CreateNewFolder,
  Upload,
  MoreVert,
  Star,
  StarBorder,
  Comment,
  Share,
  Delete,
  Edit,
  Search,
  FilterList,
  Sort,
  CloudDownload,
  FileCopy,
  Grade,
  Subject,
  AccessTime,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { lessonPlansAPI } from '../../services/api';
import { toast } from 'react-toastify';
import CommentDialog from '../../components/LessonPlans/CommentDialog';
import ShareDialog from '../../components/LessonPlans/ShareDialog';

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

interface Comment {
  id: string;
  content: string;
  rating: number;
  userId: string;
  lessonPlanId: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

const LessonPlans: React.FC = () => {
  const { user } = useAuth();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Selected items
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  
  // Menu states
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<LessonPlan | null>(null);

  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Kiswahili', 'Creative Arts', 'Physical Education'];

  useEffect(() => {
    loadLessonPlans();
    loadFolders();
  }, [currentFolder, searchTerm, filterGrade, filterSubject, sortBy]);

  const loadLessonPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentFolder) params.append('folderId', currentFolder);
      if (searchTerm) params.append('q', searchTerm);
      if (filterGrade) params.append('grade', filterGrade);
      if (filterSubject) params.append('subject', filterSubject);
      params.append('sortBy', sortBy);
      
      const response = await lessonPlansAPI.getLessonPlans(params.toString());
      setLessonPlans(response.data.data);
    } catch (error) {
      toast.error('Failed to load lesson plans');
      console.error('Error loading lesson plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await lessonPlansAPI.getFolders();
      setFolders(response.data.data);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', selectedFile.name.replace(/\.[^/.]+$/, ''));
      formData.append('description', 'Uploaded lesson plan');
      formData.append('grade', filterGrade || 'Grade 1');
      formData.append('subject', filterSubject || 'Mathematics');
      formData.append('tags', JSON.stringify([]));
      if (currentFolder) formData.append('folderId', currentFolder);
      
      await lessonPlansAPI.uploadLessonPlan(formData);
      toast.success('Lesson plan uploaded successfully');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      loadLessonPlans();
    } catch (error) {
      toast.error('Failed to upload lesson plan');
      console.error('Error uploading lesson plan:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await lessonPlansAPI.createFolder({
        name: newFolderName,
        description: newFolderDescription,
        parentId: currentFolder || undefined,
      });
      toast.success('Folder created successfully');
      setFolderDialogOpen(false);
      setNewFolderName('');
      setNewFolderDescription('');
      loadFolders();
    } catch (error) {
      toast.error('Failed to create folder');
      console.error('Error creating folder:', error);
    }
  };

  const handleDownload = async (lessonPlan: LessonPlan) => {
    try {
      const response = await lessonPlansAPI.downloadLessonPlan(lessonPlan.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', lessonPlan.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Update download count
      setLessonPlans(prev => prev.map(lp => 
        lp.id === lessonPlan.id 
          ? { ...lp, downloads: (lp.downloads || 0) + 1 }
          : lp
      ));
    } catch (error) {
      toast.error('Failed to download lesson plan');
      console.error('Error downloading lesson plan:', error);
    }
  };

  const handleDelete = async (lessonPlan: LessonPlan) => {
    if (!window.confirm('Are you sure you want to delete this lesson plan?')) return;
    
    try {
      await lessonPlansAPI.deleteLessonPlan(lessonPlan.id);
      toast.success('Lesson plan deleted successfully');
      loadLessonPlans();
    } catch (error) {
      toast.error('Failed to delete lesson plan');
      console.error('Error deleting lesson plan:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, lessonPlan: LessonPlan) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(lessonPlan);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <Description color="error" />;
    if (fileType.includes('word')) return <Description color="primary" />;
    if (fileType.includes('powerpoint')) return <Description color="warning" />;
    return <Description />;
  };

  const getBreadcrumbPath = () => {
    const path = [];
    let current = folders.find(f => f.id === currentFolder);
    while (current) {
      path.unshift(current);
      current = folders.find(f => f.id === current?.parentId);
    }
    return path;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lesson Plan Library
        </Typography>
        
        {user?.role === 'ADMIN' && (
          <Box>
            <Tooltip title="Create Folder">
              <IconButton 
                color="primary" 
                onClick={() => setFolderDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                <CreateNewFolder />
              </IconButton>
            </Tooltip>
            <Tooltip title="Upload Lesson Plan">
              <Fab 
                color="primary" 
                size="medium"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload />
              </Fab>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => setCurrentFolder(null)}
          sx={{ cursor: 'pointer' }}
        >
          Home
        </Link>
        {getBreadcrumbPath().map((folder) => (
          <Link
            key={folder.id}
            component="button"
            variant="body1"
            onClick={() => setCurrentFolder(folder.id)}
            sx={{ cursor: 'pointer' }}
          >
            {folder.name}
          </Link>
        ))}
      </Breadcrumbs>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search lesson plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
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
                {grades.map((grade) => (
                  <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
                {subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                ))}
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
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="title">Title A-Z</MenuItem>
                <MenuItem value="downloads">Most Downloaded</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Folders */}
      {currentFolder === null && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Folders
          </Typography>
          <Grid container spacing={2}>
            {folders
              .filter(f => !f.parentId)
              .map((folder) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 3 }
                    }}
                    onClick={() => setCurrentFolder(folder.id)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        <Folder color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" noWrap>
                          {folder.name}
                        </Typography>
                      </Box>
                      {folder.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {folder.description}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {folder.lessonPlanCount || 0} lesson plans
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      )}

      {/* Lesson Plans */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Lesson Plans {currentFolder && `in ${folders.find(f => f.id === currentFolder)?.name}`}
        </Typography>
        
        {lessonPlans.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No lesson plans found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentFolder 
                ? 'This folder is empty. Upload some lesson plans to get started.'
                : 'No lesson plans match your current filters.'
              }
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {lessonPlans.map((lessonPlan) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={lessonPlan.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      {getFileIcon(lessonPlan.fileType)}
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, lessonPlan)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="h6" noWrap sx={{ mt: 1 }}>
                      {lessonPlan.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {lessonPlan.description}
                    </Typography>
                    
                    <Box display="flex" gap={1} sx={{ mb: 1 }}>
                      <Chip label={lessonPlan.grade} size="small" />
                      <Chip label={lessonPlan.subject} size="small" variant="outlined" />
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                      <Rating 
                        value={lessonPlan.rating || 0} 
                        readOnly 
                        size="small"
                        precision={0.5}
                      />
                      <Typography variant="caption" color="text.secondary">
                        ({lessonPlan.reviewCount || 0})
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <CloudDownload fontSize="small" />
                        <Typography variant="caption">
                          {lessonPlan.downloads || 0}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <AccessTime fontSize="small" />
                        <Typography variant="caption">
                          {new Date(lessonPlan.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {lessonPlan.user && (
                      <Box display="flex" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
                        <Person fontSize="small" />
                        <Typography variant="caption">
                          {lessonPlan.user.firstName} {lessonPlan.user.lastName}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => {
                        setSelectedLessonPlan(lessonPlan);
                        setViewDialogOpen(true);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownload(lessonPlan)}
                    >
                      Download
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Comment />}
                      onClick={() => {
                        setSelectedLessonPlan(lessonPlan);
                        setCommentDialogOpen(true);
                      }}
                    >
                      Review
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Lesson Plan</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="File"
            type="file"
            inputProps={{ accept: '.pdf,.docx,.pptx,.jpg,.jpeg,.png' }}
            onChange={(e) => setSelectedFile((e.target as HTMLInputElement).files?.[0] || null)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFileUpload} variant="contained" disabled={!selectedFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            sx={{ mt: 1 }}
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={newFolderDescription}
            onChange={(e) => setNewFolderDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Lesson Plan Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedLessonPlan?.title}
        </DialogTitle>
        <DialogContent>
          {selectedLessonPlan && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedLessonPlan.description}
              </Typography>
              
              <Box display="flex" gap={1} sx={{ mb: 2 }}>
                <Chip label={selectedLessonPlan.grade} />
                <Chip label={selectedLessonPlan.subject} variant="outlined" />
              </Box>
              
              <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                <Rating value={selectedLessonPlan.rating || 0} readOnly precision={0.5} />
                <Typography variant="body2">
                  {selectedLessonPlan.reviewCount || 0} reviews
                </Typography>
                <Typography variant="body2">
                  {selectedLessonPlan.downloads || 0} downloads
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Uploaded on {new Date(selectedLessonPlan.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedLessonPlan && (
            <Button 
              onClick={() => handleDownload(selectedLessonPlan)} 
              variant="contained"
              startIcon={<Download />}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

             {/* Menu */}
       <Menu
         anchorEl={menuAnchor}
         open={Boolean(menuAnchor)}
         onClose={handleMenuClose}
       >
         <MenuItemComponent onClick={() => {
           if (menuItem) {
             setSelectedLessonPlan(menuItem);
             setViewDialogOpen(true);
           }
           handleMenuClose();
         }}>
           <Visibility sx={{ mr: 1 }} /> View
         </MenuItemComponent>
         <MenuItemComponent onClick={() => {
           if (menuItem) handleDownload(menuItem);
           handleMenuClose();
         }}>
           <Download sx={{ mr: 1 }} /> Download
         </MenuItemComponent>
         <MenuItemComponent onClick={() => {
           if (menuItem) {
             setSelectedLessonPlan(menuItem);
             setCommentDialogOpen(true);
           }
           handleMenuClose();
         }}>
           <Comment sx={{ mr: 1 }} /> Review
         </MenuItemComponent>
         <MenuItemComponent onClick={() => {
           if (menuItem) {
             setSelectedLessonPlan(menuItem);
             setShareDialogOpen(true);
           }
           handleMenuClose();
         }}>
           <Share sx={{ mr: 1 }} /> Share
         </MenuItemComponent>
         {user?.role === 'ADMIN' && (
           <>
             <Divider />
             <MenuItemComponent onClick={() => {
               if (menuItem) handleDelete(menuItem);
               handleMenuClose();
             }}>
               <Delete sx={{ mr: 1 }} /> Delete
             </MenuItemComponent>
           </>
         )}
       </Menu>

       {/* Comment Dialog */}
       <CommentDialog
         open={commentDialogOpen}
         onClose={() => setCommentDialogOpen(false)}
         lessonPlanId={selectedLessonPlan?.id || ''}
         lessonPlanTitle={selectedLessonPlan?.title || ''}
       />

       {/* Share Dialog */}
       <ShareDialog
         open={shareDialogOpen}
         onClose={() => setShareDialogOpen(false)}
         lessonPlanId={selectedLessonPlan?.id || ''}
         lessonPlanTitle={selectedLessonPlan?.title || ''}
       />
     </Box>
   );
 };

export default LessonPlans;
