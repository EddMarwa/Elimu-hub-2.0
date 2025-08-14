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
  Menu,
  MenuItem as MenuItemComponent,
  Badge,
  Avatar,
  Rating,
  Collapse,
  FormControlLabel,
  Switch,
  LinearProgress,
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
  LibraryBooks,
  VideoLibrary,
  Audiotrack,
  Image,
  PictureAsPdf,
  InsertDriveFile,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { libraryAPI, SERVER_BASE_ORIGIN } from '../../services/api';
import { toast } from 'react-toastify';

interface LibrarySection {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subfolders?: LibrarySubfolder[];
  _count?: {
    files: number;
  };
}

interface LibrarySubfolder {
  id: string;
  name: string;
  sectionId: string;
  metadata?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    files: number;
  };
}

interface LibraryFile {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileType: 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOCUMENT';
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  sectionId: string;
  subfolderId?: string;
  uploadedBy: string;
  approvedBy?: string;
  metadata?: string;
  description?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
  uploader?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  section?: {
    id: string;
    name: string;
  };
  subfolder?: {
    id: string;
    name: string;
  };
}

const Library: React.FC = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<LibrarySection[]>([]);
  const [currentSection, setCurrentSection] = useState<LibrarySection | null>(null);
  const [currentSubfolder, setCurrentSubfolder] = useState<LibrarySubfolder | null>(null);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [subfolderDialogOpen, setSubfolderDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  
  // Selected items
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileForApproval, setSelectedFileForApproval] = useState<LibraryFile | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Menu states
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<LibraryFile | null>(null);

  const fileTypes = ['PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'DOCUMENT'];
  const statuses = ['PENDING', 'APPROVED', 'DECLINED'];

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    if (currentSection || currentSubfolder) {
      loadFiles();
    }
  }, [currentSection, currentSubfolder, searchTerm, filterType, filterStatus, sortBy]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await libraryAPI.getSections();
      setSections(response.data || []);
    } catch (error) {
      toast.error('Failed to load library sections');
      console.error('Error loading sections:', error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (currentSection) params.sectionId = currentSection.id;
      if (currentSubfolder) params.subfolderId = currentSubfolder.id;
      if (searchTerm) params.q = searchTerm;
      if (filterType) params.tags = filterType;
      if (filterStatus) params.status = filterStatus;
      
      const response = await libraryAPI.getFiles(params, user ? { userId: user.id, role: user.role } : undefined);
      setFiles(response.data?.files || []);
    } catch (error) {
      toast.error('Failed to load files');
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !currentSection || !user) return;
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sectionId', currentSection.id);
      if (currentSubfolder) formData.append('subfolderId', currentSubfolder.id);
      formData.append('description', selectedFile.name.replace(/\.[^/.]+$/, ''));
      formData.append('tags', JSON.stringify([filterType].filter(Boolean)));
      
      await libraryAPI.uploadFile(formData, (progress) => setUploadProgress(progress), { userId: user.id, role: user.role });
      toast.success('File uploaded successfully');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      loadFiles();
    } catch (error) {
      toast.error('Failed to upload file');
      console.error('Error uploading file:', error);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim() || !user) return;
    
    try {
      await libraryAPI.createSection({
        name: newSectionName,
        description: newSectionDescription,
      }, { userId: user.id, role: user.role });
      toast.success('Section created successfully');
      setSectionDialogOpen(false);
      setNewSectionName('');
      setNewSectionDescription('');
      loadSections();
    } catch (error) {
      toast.error('Failed to create section');
      console.error('Error creating section:', error);
    }
  };

  const handleCreateSubfolder = async () => {
    if (!newSubfolderName.trim() || !currentSection || !user) return;
    
    try {
      await libraryAPI.createSubfolder({
        name: newSubfolderName,
        sectionId: currentSection.id,
      }, { userId: user.id, role: user.role });
      toast.success('Subfolder created successfully');
      setSubfolderDialogOpen(false);
      setNewSubfolderName('');
      loadSections();
    } catch (error) {
      toast.error('Failed to create subfolder');
      console.error('Error creating subfolder:', error);
    }
  };

  const handleApproveFile = async (file: LibraryFile) => {
    if (!user) return;
    
    try {
      await libraryAPI.approveFile(file.id, { userId: user.id, role: user.role });
      toast.success('File approved successfully');
      setApprovalDialogOpen(false);
      setSelectedFileForApproval(null);
      loadFiles();
    } catch (error) {
      toast.error('Failed to approve file');
      console.error('Error approving file:', error);
    }
  };

  const handleDeclineFile = async (file: LibraryFile) => {
    if (!user) return;
    
    try {
      await libraryAPI.declineFile(file.id, { userId: user.id, role: user.role });
      toast.success('File declined successfully');
      setApprovalDialogOpen(false);
      setSelectedFileForApproval(null);
      loadFiles();
    } catch (error) {
      toast.error('Failed to decline file');
      console.error('Error declining file:', error);
    }
  };

  const handleDeleteFile = async (file: LibraryFile) => {
    if (!window.confirm('Are you sure you want to delete this file?') || !user) return;
    
    try {
      await libraryAPI.deleteFile(file.id, { userId: user.id, role: user.role });
      toast.success('File deleted successfully');
      loadFiles();
    } catch (error) {
      toast.error('Failed to delete file');
      console.error('Error deleting file:', error);
    }
  };

  const handleSectionClick = (section: LibrarySection) => {
    setCurrentSection(section);
    setCurrentSubfolder(null);
  };

  const handleSubfolderClick = (subfolder: LibrarySubfolder) => {
    setCurrentSubfolder(subfolder);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: LibraryFile) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(file);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'PDF':
        return <PictureAsPdf color="error" />;
      case 'VIDEO':
        return <VideoLibrary color="primary" />;
      case 'AUDIO':
        return <Audiotrack color="secondary" />;
      case 'IMAGE':
        return <Image color="success" />;
      default:
        return <InsertDriveFile color="action" />;
    }
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'PDF':
        return 'error';
      case 'VIDEO':
        return 'primary';
      case 'AUDIO':
        return 'secondary';
      case 'IMAGE':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'DECLINED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBreadcrumbPath = () => {
    const path = [];
    if (currentSection) {
      path.push({ name: currentSection.name, id: currentSection.id, type: 'section' });
    }
    if (currentSubfolder) {
      path.push({ name: currentSubfolder.name, id: currentSubfolder.id, type: 'subfolder' });
    }
    return path;
  };

  if (loading && (!sections || sections.length === 0)) {
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
          <LibraryBooks sx={{ mr: 1, verticalAlign: 'middle' }} />
          Resource Library
        </Typography>
        
        {user?.role === 'ADMIN' && (
          <Box>
            <Tooltip title="Create Section">
              <IconButton 
                color="primary" 
                onClick={() => setSectionDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                <CreateNewFolder />
              </IconButton>
            </Tooltip>
            {currentSection && (
              <Tooltip title="Create Subfolder">
                <IconButton 
                  color="primary" 
                  onClick={() => setSubfolderDialogOpen(true)}
                  sx={{ mr: 1 }}
                >
                  <Add />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Upload File">
              <Fab 
                color="primary" 
                size="medium"
                onClick={() => setUploadDialogOpen(true)}
                disabled={!currentSection}
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
          onClick={() => {
            setCurrentSection(null);
            setCurrentSubfolder(null);
          }}
          sx={{ cursor: 'pointer' }}
        >
          Home
        </Link>
        {getBreadcrumbPath().map((item) => (
          <Link
            key={item.id}
            component="button"
            variant="body1"
            onClick={() => {
              if (item.type === 'section') {
                setCurrentSection(sections.find(s => s.id === item.id) || null);
                setCurrentSubfolder(null);
              } else if (item.type === 'subfolder') {
                const section = sections.find(s => s.subfolders?.some(sub => sub.id === item.id));
                if (section) {
                  setCurrentSection(section);
                  setCurrentSubfolder(section.subfolders?.find(sub => sub.id === item.id) || null);
                }
              }
            }}
            sx={{ cursor: 'pointer' }}
          >
            {item.name}
          </Link>
        ))}
      </Breadcrumbs>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>File Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="File Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {fileTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
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
                <MenuItem value="name">Name A-Z</MenuItem>
                <MenuItem value="size">File Size</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Sections and Subfolders */}
      {!currentSection && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Library Sections
          </Typography>
          <Grid container spacing={2}>
            {sections.map((section) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={section.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => handleSectionClick(section)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Folder color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" noWrap>
                        {section.name}
                      </Typography>
                    </Box>
                    {section.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {section.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {section._count?.files || 0} files
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Subfolders */}
      {currentSection && !currentSubfolder && currentSection.subfolders && Array.isArray(currentSection.subfolders) && currentSection.subfolders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Subfolders in {currentSection.name}
          </Typography>
          <Grid container spacing={2}>
            {currentSection.subfolders.map((subfolder) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={subfolder.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => handleSubfolderClick(subfolder)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Folder color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="h6" noWrap>
                        {subfolder.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {subfolder._count?.files || 0} files
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Files */}
      {(currentSection || currentSubfolder) && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Files {currentSubfolder ? `in ${currentSubfolder.name}` : currentSection ? `in ${currentSection.name}` : ''}
          </Typography>
          
          {(!files || files.length === 0) ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No files found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentSection 
                  ? 'This section is empty. Upload some files to get started.'
                  : 'No files match your current filters.'
                }
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {files.map((file) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        {getFileIcon(file.fileType)}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, file)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                      
                      <Typography variant="h6" noWrap sx={{ mt: 1 }}>
                        {file.originalName}
                      </Typography>
                      
                      {file.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {file.description}
                        </Typography>
                      )}
                      
                      <Box display="flex" gap={1} sx={{ mb: 1 }}>
                        <Chip 
                          label={file.fileType} 
                          size="small" 
                          color={getFileTypeColor(file.fileType) as any}
                        />
                        <Chip 
                          label={file.status} 
                          size="small" 
                          color={getStatusColor(file.status) as any}
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <CloudDownload fontSize="small" />
                          <Typography variant="caption">
                            {formatFileSize(file.fileSize)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AccessTime fontSize="small" />
                          <Typography variant="caption">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {file.uploader && (
                        <Box display="flex" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
                          <Person fontSize="small" />
                          <Typography variant="caption">
                            {file.uploader.firstName} {file.uploader.lastName}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        component="a"
                        href={`${SERVER_BASE_ORIGIN}/uploads/library/${file.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Download />}
                        component="a"
                        href={`${SERVER_BASE_ORIGIN}/uploads/library/${file.filename}`}
                        download
                      >
                        Download
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="File"
            type="file"
            inputProps={{ accept: '*/*' }}
            onChange={(e) => setSelectedFile((e.target as HTMLInputElement).files?.[0] || null)}
            sx={{ mt: 1 }}
          />
          {uploadProgress > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Upload Progress: {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFileUpload} variant="contained" disabled={!selectedFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Section Dialog */}
      <Dialog open={sectionDialogOpen} onClose={() => setSectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Section</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Section Name"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            sx={{ mt: 1 }}
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={newSectionDescription}
            onChange={(e) => setNewSectionDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSection} variant="contained" disabled={!newSectionName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Subfolder Dialog */}
      <Dialog open={subfolderDialogOpen} onClose={() => setSubfolderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Subfolder</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Subfolder Name"
            value={newSubfolderName}
            onChange={(e) => setNewSubfolderName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubfolderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSubfolder} variant="contained" disabled={!newSubfolderName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>File Approval</DialogTitle>
        <DialogContent>
          {selectedFileForApproval && (
            <Box>
              <Typography variant="body1" paragraph>
                File: {selectedFileForApproval.originalName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Uploaded by: {selectedFileForApproval.uploader?.firstName} {selectedFileForApproval.uploader?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {formatFileSize(selectedFileForApproval.fileSize)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          {selectedFileForApproval && (
            <>
              <Button 
                onClick={() => handleDeclineFile(selectedFileForApproval)} 
                color="error"
              >
                Decline
              </Button>
              <Button 
                onClick={() => handleApproveFile(selectedFileForApproval)} 
                variant="contained"
                color="success"
              >
                Approve
              </Button>
            </>
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
            window.open(`${SERVER_BASE_ORIGIN}/uploads/library/${menuItem.filename}`, '_blank');
          }
          handleMenuClose();
        }}>
          <Visibility sx={{ mr: 1 }} /> View
        </MenuItemComponent>
        <MenuItemComponent onClick={() => {
          if (menuItem) {
            const link = document.createElement('a');
            link.href = `${SERVER_BASE_ORIGIN}/uploads/library/${menuItem.filename}`;
            link.download = menuItem.originalName;
            link.click();
          }
          handleMenuClose();
        }}>
          <Download sx={{ mr: 1 }} /> Download
        </MenuItemComponent>
        {user?.role === 'ADMIN' && menuItem?.status === 'PENDING' && (
          <MenuItemComponent onClick={() => {
            if (menuItem) {
              setSelectedFileForApproval(menuItem);
              setApprovalDialogOpen(true);
            }
            handleMenuClose();
          }}>
            <Edit sx={{ mr: 1 }} /> Review
          </MenuItemComponent>
        )}
        {user?.role === 'ADMIN' && (
          <>
            <Divider />
            <MenuItemComponent onClick={() => {
              if (menuItem) handleDeleteFile(menuItem);
              handleMenuClose();
            }}>
              <Delete sx={{ mr: 1 }} /> Delete
            </MenuItemComponent>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default Library;
