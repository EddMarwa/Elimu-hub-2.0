import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress,
  Breadcrumbs,
  Link,
  Divider,
  Tooltip,
  Menu,
  MenuItem as MenuItemComponent,
} from '@mui/material';
import {
  Search,
  Add,
  Upload,
  CreateNewFolder,
  Folder,
  Description,
  PictureAsPdf,
  Article,
  TableView,
  Image,
  VideoLibrary,
  Audiotrack,
  MoreVert,
  Download,
  Visibility,
  Edit,
  Delete,
  Share,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
  FilterList,
  Sort,
  CloudUpload,
  CloudDownload,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface Document {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  status: 'draft' | 'published' | 'archived' | 'pending_review';
  isPublic: boolean;
  isBookmarked: boolean;
  rating: number;
  downloadCount: number;
  viewCount: number;
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

const Documents: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<Document | null>(null);

  const categories = [
    'Curriculum', 'Assessment', 'Policy', 'Guidelines', 'Research', 'Templates', 'Resources'
  ];

  const statuses = [
    { value: 'draft', label: 'Draft', color: 'default' },
    { value: 'published', label: 'Published', color: 'success' },
    { value: 'archived', label: 'Archived', color: 'warning' },
    { value: 'pending_review', label: 'Pending Review', color: 'info' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'downloads', label: 'Most Downloaded' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  useEffect(() => {
    loadDocuments();
    loadFolders();
  }, [currentFolder]);

  useEffect(() => {
    filterDocuments();
  }, [searchTerm, selectedCategory, selectedStatus, sortBy, documents]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDocuments: Document[] = [
        {
          id: '1',
          title: 'CBC Mathematics Grade 4 Curriculum Guide',
          description: 'Comprehensive curriculum guide for Mathematics in Grade 4',
          fileName: 'cbc_math_grade4.pdf',
          fileType: 'pdf',
          fileSize: 2.5,
          category: 'Curriculum',
          tags: ['mathematics', 'grade4', 'cbc', 'curriculum'],
          uploadedBy: 'John Doe',
          uploadedAt: '2024-01-15',
          lastModified: '2024-01-20',
          status: 'published',
          isPublic: true,
          isBookmarked: false,
          rating: 4.8,
          downloadCount: 1250,
          viewCount: 3200
        },
        {
          id: '2',
          title: 'Assessment Rubrics for Creative Arts',
          description: 'Standardized assessment rubrics for evaluating creative arts projects',
          fileName: 'creative_arts_rubrics.docx',
          fileType: 'docx',
          fileSize: 1.8,
          category: 'Assessment',
          tags: ['assessment', 'creative-arts', 'rubrics'],
          uploadedBy: 'Jane Smith',
          uploadedAt: '2024-01-20',
          lastModified: '2024-01-25',
          status: 'published',
          isPublic: true,
          isBookmarked: true,
          rating: 4.6,
          downloadCount: 890,
          viewCount: 2100
        },
        {
          id: '3',
          title: 'Teacher Professional Development Policy',
          description: 'Policy document for teacher professional development programs',
          fileName: 'teacher_dev_policy.pdf',
          fileType: 'pdf',
          fileSize: 3.2,
          category: 'Policy',
          tags: ['policy', 'teacher-development', 'professional-development'],
          uploadedBy: 'Admin Team',
          uploadedAt: '2024-01-10',
          lastModified: '2024-01-15',
          status: 'published',
          isPublic: true,
          isBookmarked: false,
          rating: 4.7,
          downloadCount: 1100,
          viewCount: 2800
        },
        {
          id: '4',
          title: 'Lesson Plan Template - Science',
          description: 'Standardized lesson plan template for Science subjects',
          fileName: 'science_lesson_template.docx',
          fileType: 'docx',
          fileSize: 0.9,
          category: 'Templates',
          tags: ['template', 'lesson-plan', 'science'],
          uploadedBy: 'Curriculum Team',
          uploadedAt: '2024-02-01',
          lastModified: '2024-02-01',
          status: 'draft',
          isPublic: false,
          isBookmarked: false,
          rating: 4.5,
          downloadCount: 450,
          viewCount: 1200
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const mockFolders: Folder[] = [
        {
          id: '1',
          name: 'Curriculum Documents',
          description: 'Official curriculum guides and standards',
          documentCount: 25,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'Assessment Tools',
          description: 'Assessment rubrics and evaluation tools',
          documentCount: 18,
          createdAt: '2024-01-05',
          updatedAt: '2024-01-20'
        },
        {
          id: '3',
          name: 'Policy Documents',
          description: 'Educational policies and regulations',
          documentCount: 12,
          createdAt: '2024-01-10',
          updatedAt: '2024-01-18'
        },
        {
          id: '4',
          name: 'Teacher Resources',
          description: 'Teaching materials and resources',
          documentCount: 32,
          createdAt: '2024-01-12',
          updatedAt: '2024-01-25'
        }
      ];
      
      setFolders(mockFolders);
    } catch (error) {
      toast.error('Failed to load folders');
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(doc => doc.status === selectedStatus);
    }

    // Sort documents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        case 'oldest':
          return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'downloads':
          return b.downloadCount - a.downloadCount;
        case 'views':
          return b.viewCount - a.viewCount;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    setFilteredDocuments(filtered);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload process
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      toast.success('Document uploaded successfully!');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      loadDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentAction = (document: Document, action: string) => {
    switch (action) {
      case 'view':
        setSelectedDocument(document);
        setViewDialogOpen(true);
        break;
      case 'download':
        toast.success(`Downloading ${document.title}`);
        break;
      case 'bookmark':
        setDocuments(prev => prev.map(doc =>
          doc.id === document.id ? { ...doc, isBookmarked: !doc.isBookmarked } : doc
        ));
        toast.success(document.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
        break;
      case 'share':
        toast.info('Share functionality coming soon');
        break;
      case 'edit':
        toast.info('Edit functionality coming soon');
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this document?')) {
          setDocuments(prev => prev.filter(doc => doc.id !== document.id));
          toast.success('Document deleted successfully');
        }
        break;
    }
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <PictureAsPdf color="error" />;
      case 'docx':
        return <Article color="primary" />;
      case 'xlsx':
        return <TableView color="success" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image color="info" />;
      case 'mp4':
      case 'avi':
        return <VideoLibrary color="warning" />;
      case 'mp3':
      case 'wav':
        return <Audiotrack color="secondary" />;
      default:
        return <Description />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj?.color || 'default';
  };

  const formatFileSize = (size: number) => {
    return `${size} MB`;
  };

  const getBreadcrumbPath = () => {
    if (!currentFolder) return [];
    const folder = folders.find(f => f.id === currentFolder);
    return folder ? [folder] : [];
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, px: { xs: 0.5, sm: 2, md: 3 }, overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          Curriculum Documents
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and organize educational documents, curriculum guides, and teaching resources
        </Typography>
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
          <Typography key={folder.id} color="text.primary">
            {folder.name}
          </Typography>
        ))}
      </Breadcrumbs>

      {/* Search and Filters */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStatus('');
                setSortBy('newest');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Folders */}
      {!currentFolder && (
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
            <Typography variant="h6" fontWeight="bold">
              Document Folders
            </Typography>
            {user?.role === 'ADMIN' && (
              <Button
                variant="outlined"
                startIcon={<CreateNewFolder />}
                onClick={() => setFolderDialogOpen(true)}
              >
                Create Folder
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            {folders.map((folder) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => setCurrentFolder(folder.id)}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Folder color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {folder.name}
                    </Typography>
                    {folder.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {folder.description}
                      </Typography>
                    )}
                    <Chip
                      label={`${folder.documentCount} documents`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Documents List */}
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
          <Typography variant="h6" fontWeight="bold">
            Documents {currentFolder && `in ${folders.find(f => f.id === currentFolder)?.name}`}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Document
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredDocuments.length === 0 ? (
          <Alert severity="info">
            No documents found matching your criteria. Try adjusting your search or filters.
          </Alert>
        ) : (
          <List>
            {filteredDocuments.map((document, index) => (
              <React.Fragment key={document.id}>
                <ListItem sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 2,
                  '&:hover': { bgcolor: 'action.hover' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                }}>
                  <ListItemIcon>
                    {getFileIcon(document.fileType)}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {document.title}
                        </Typography>
                        <Chip
                          label={document.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(document.status) as any}
                        />
                        {document.isBookmarked && (
                          <Bookmark color="primary" fontSize="small" />
                        )}
                        {!document.isPublic && (
                          <Chip label="Private" size="small" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {document.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Chip label={document.category} size="small" color="primary" />
                          {document.tags.slice(0, 3).map((tag, tagIndex) => (
                            <Chip
                              key={tagIndex}
                              label={tag}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">
                            By {document.uploadedBy}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(document.fileSize)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(document.lastModified).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star fontSize="small" color="primary" />
                            <Typography variant="caption">{document.rating}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {document.downloadCount} downloads
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {document.viewCount} views
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleDocumentAction(document, 'bookmark')}
                        color={document.isBookmarked ? 'primary' : 'default'}
                      >
                        {document.isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                      </IconButton>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handleDocumentAction(document, 'view')}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Download />}
                        onClick={() => handleDocumentAction(document, 'download')}
                      >
                        Download
                      </Button>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setMenuItem(document);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredDocuments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              hidden
              id="document-upload-input"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4,.mp3"
            />
            <label htmlFor="document-upload-input">
              <Button variant="outlined" component="span" fullWidth sx={{ mb: 2 }}>
                {selectedFile ? selectedFile.name : 'Choose File'}
              </Button>
            </label>
          </Box>
          
          {selectedFile && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Selected file: {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
          )}
          
          {uploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Upload Progress: {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleFileUpload} 
            variant="contained" 
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document View Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedDocument?.title}
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedDocument.description}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>File Name:</strong> {selectedDocument.fileName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>File Type:</strong> {selectedDocument.fileType.toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>File Size:</strong> {formatFileSize(selectedDocument.fileSize)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Category:</strong> {selectedDocument.category}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Uploaded By:</strong> {selectedDocument.uploadedBy}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Modified:</strong> {new Date(selectedDocument.lastModified).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Status:</strong> {selectedDocument.status.replace('_', ' ')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Rating:</strong> {selectedDocument.rating}/5
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>Tags:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedDocument.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedDocument && (
            <Button 
              variant="contained" 
              startIcon={<Download />}
              onClick={() => handleDocumentAction(selectedDocument, 'download')}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Document Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setMenuItem(null);
        }}
      >
        <MenuItemComponent onClick={() => {
          if (menuItem) handleDocumentAction(menuItem, 'view');
        }}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItemComponent>
        <MenuItemComponent onClick={() => {
          if (menuItem) handleDocumentAction(menuItem, 'download');
        }}>
          <Download sx={{ mr: 1 }} /> Download
        </MenuItemComponent>
        <MenuItemComponent onClick={() => {
          if (menuItem) handleDocumentAction(menuItem, 'share');
        }}>
          <Share sx={{ mr: 1 }} /> Share
        </MenuItemComponent>
        <MenuItemComponent onClick={() => {
          if (menuItem) handleDocumentAction(menuItem, 'edit');
        }}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItemComponent>
        <Divider />
        <MenuItemComponent onClick={() => {
          if (menuItem) handleDocumentAction(menuItem, 'delete');
        }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItemComponent>
      </Menu>
    </Container>
  );
};

export default Documents;