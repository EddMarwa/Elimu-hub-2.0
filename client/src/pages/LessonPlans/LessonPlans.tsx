import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Badge,
  Fab,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Folder,
  Article,
  VideoLibrary,
  AudioFile,
  Image,
  PictureAsPdf,
  Upload,
  MoreVert,
  Add,
  Home,
  NavigateNext,
  Download,
  Visibility,
  Delete,
  Edit,
  CloudUpload,
  Check,
  Close,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { libraryAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { UserRole } from '../../types';

interface LibrarySection {
  id: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  _count?: {
    files: number;
  };
  subfolders?: LibrarySubfolder[];
}

interface LibrarySubfolder {
  id: string;
  name: string;
  sectionId?: string;
  metadata?: any;
  order?: number;
  _count?: {
    files: number;
  };
}

interface LibraryFile {
  id: string;
  filename: string;
  originalName: string;
  fileType: 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOCUMENT';
  fileSize: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  description?: string;
  tags?: string[];
  createdAt: string;
  uploader: {
    firstName: string;
    lastName: string;
    email: string;
  };
  section: {
    id: string;
    name: string;
  };
  subfolder?: {
    id: string;
    name: string;
  };
}

const LessonPlans: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<LibrarySection[]>([]);
  const [currentSection, setCurrentSection] = useState<LibrarySection | null>(null);
  const [currentSubfolder, setCurrentSubfolder] = useState<LibrarySubfolder | null>(null);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [subfolderDialogOpen, setSubfolderDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Admin states
  const [pendingFiles, setPendingFiles] = useState<LibraryFile[]>([]);
  const [stats, setStats] = useState<any>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    loadSections();
    if (isAdmin) {
      loadPendingFiles();
      loadStats();
    }
  }, [isAdmin]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await libraryAPI.getSections();
      setSections(response.data);
    } catch (error) {
      toast.error('Failed to load library sections');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (sectionId: string, subfolderId?: string) => {
    try {
      setLoading(true);
      const response = await libraryAPI.getFiles({ sectionId, subfolderId });
      setFiles(response.data);
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingFiles = async () => {
    try {
      const response = await libraryAPI.getFiles({ status: 'PENDING' });
      setPendingFiles(response.data);
    } catch (error) {
      console.error('Failed to load pending files:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await libraryAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSectionClick = (section: LibrarySection) => {
    setCurrentSection(section);
    setCurrentSubfolder(null);
    if (!section.subfolders || section.subfolders.length === 0) {
      loadFiles(section.id);
    }
  };

  const handleSubfolderClick = (subfolder: LibrarySubfolder) => {
    setCurrentSubfolder(subfolder);
    loadFiles(currentSection!.id, subfolder.id);
  };

  const handleFileUpload = async (sectionId: string, subfolderId?: string) => {
    if (!selectedFile || !user) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sectionId', sectionId);
      if (subfolderId) formData.append('subfolderId', subfolderId);
      if (document.getElementById('file-description')) {
        formData.append('description', (document.getElementById('file-description') as HTMLInputElement).value);
      }

      await libraryAPI.uploadFile(formData, (progress) => {
        setUploadProgress(progress);
      });

      toast.success(isAdmin ? 'File uploaded and approved!' : 'File uploaded successfully! Awaiting admin approval.');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Reload current view
      if (currentSection) {
        loadFiles(currentSection.id, currentSubfolder?.id);
      }
      if (isAdmin) {
        loadPendingFiles();
        loadStats();
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleApproveFile = async (fileId: string) => {
    try {
      await libraryAPI.approveFile(fileId);
      toast.success('File approved successfully');
      loadPendingFiles();
      loadStats();
    } catch (error) {
      toast.error('Failed to approve file');
    }
  };

  const handleDeclineFile = async (fileId: string) => {
    try {
      await libraryAPI.declineFile(fileId);
      toast.success('File declined successfully');
      loadPendingFiles();
      loadStats();
    } catch (error) {
      toast.error('Failed to decline file');
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'PDF': return <PictureAsPdf color="error" />;
      case 'VIDEO': return <VideoLibrary color="primary" />;
      case 'AUDIO': return <AudioFile color="secondary" />;
      case 'IMAGE': return <Image color="success" />;
      default: return <Article />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderBreadcrumbs = () => (
    <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
      <Link
        component="button"
        variant="body1"
        onClick={() => {
          setCurrentSection(null);
          setCurrentSubfolder(null);
          setFiles([]);
        }}
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <Home sx={{ mr: 0.5 }} fontSize="inherit" />
        Library
      </Link>
      {currentSection && (
        <Link
          component="button"
          variant="body1"
          onClick={() => {
            setCurrentSubfolder(null);
            if (!currentSection.subfolders || currentSection.subfolders.length === 0) {
              loadFiles(currentSection.id);
            }
          }}
        >
          {currentSection.name}
        </Link>
      )}
      {currentSubfolder && (
        <Typography color="text.primary">{currentSubfolder.name}</Typography>
      )}
    </Breadcrumbs>
  );

  const renderSections = () => (
    <Grid container spacing={3}>
      {sections.map((section) => (
        <Grid item xs={12} sm={6} md={4} key={section.id}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
              transition: 'all 0.3s ease',
            }}
            onClick={() => handleSectionClick(section)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Folder color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{section.name}</Typography>
              </Box>
              {section.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {section.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={`${section._count?.files || 0} files`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {section.subfolders && section.subfolders.length > 0 && (
                  <Chip
                    label={`${section.subfolders.length} folders`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
      {isAdmin && (
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: 'pointer',
              border: '2px dashed',
              borderColor: 'primary.main',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => setSectionDialogOpen(true)}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Add color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6" color="primary">
                Add New Section
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderSubfolders = () => (
    <Grid container spacing={2}>
      {currentSection?.subfolders?.map((subfolder) => (
        <Grid item xs={12} sm={6} md={3} key={subfolder.id}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.02)' },
              transition: 'transform 0.2s ease',
            }}
            onClick={() => handleSubfolderClick(subfolder)}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Folder color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="subtitle1">{subfolder.name}</Typography>
              <Chip
                label={`${subfolder._count?.files || 0} files`}
                size="small"
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
      {isAdmin && (
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: 'pointer',
              border: '1px dashed',
              borderColor: 'secondary.main',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => setSubfolderDialogOpen(true)}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Add color="secondary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="body2" color="secondary">
                Add Subfolder
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderFiles = () => (
    <Grid container spacing={2}>
      {files.map((file) => (
        <Grid item xs={12} sm={6} md={4} key={file.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                {getFileIcon(file.fileType)}
                <Box sx={{ ml: 1, flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {file.originalName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.fileSize)}
                  </Typography>
                </Box>
                <Chip
                  label={file.status}
                  size="small"
                  color={file.status === 'APPROVED' ? 'success' : file.status === 'PENDING' ? 'warning' : 'error'}
                  variant="outlined"
                />
              </Box>
              {file.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {file.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Uploaded by {file.uploader.firstName} {file.uploader.lastName}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" startIcon={<Visibility />}>
                View
              </Button>
              <Button size="small" startIcon={<Download />}>
                Download
              </Button>
              {(isAdmin || file.uploader.email === user?.email) && (
                <IconButton size="small" color="error">
                  <Delete />
                </IconButton>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderAdminPanel = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <AdminPanelSettings sx={{ mr: 1 }} />
        Admin Panel
      </Typography>
      
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{stats.totalUploads}</Typography>
                <Typography variant="caption">Total Files</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">{stats.pendingDocuments}</Typography>
                <Typography variant="caption">Pending</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">{stats.approvedDocuments}</Typography>
                <Typography variant="caption">Approved</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">{stats.totalUsers}</Typography>
                <Typography variant="caption">Total Users</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {pendingFiles.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Pending Approvals ({pendingFiles.length})
          </Typography>
          <Grid container spacing={2}>
            {pendingFiles.slice(0, 6).map((file) => (
              <Grid item xs={12} sm={6} md={4} key={file.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getFileIcon(file.fileType)}
                      <Typography variant="subtitle2" sx={{ ml: 1 }} noWrap>
                        {file.originalName}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {file.uploader.firstName} {file.uploader.lastName}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Check />}
                      color="success"
                      onClick={() => handleApproveFile(file.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Close />}
                      color="error"
                      onClick={() => handleDeclineFile(file.id)}
                    >
                      Decline
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Paper>
  );

  if (loading && sections.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          📚 Library
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Access and manage educational resources including documents, videos, audio files, and images.
        </Typography>
      </Box>

      {isAdmin && renderAdminPanel()}

      {renderBreadcrumbs()}

      {!currentSection && renderSections()}
      {currentSection && !currentSubfolder && currentSection.subfolders && currentSection.subfolders.length > 0 && renderSubfolders()}
      {((currentSection && currentSubfolder) || (currentSection && (!currentSection.subfolders || currentSection.subfolders.length === 0))) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {currentSubfolder ? currentSubfolder.name : currentSection?.name} Files
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialogOpen(true)}
              disabled={!user}
            >
              Upload File
            </Button>
          </Box>
          {renderFiles()}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              hidden
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input">
              <Button variant="outlined" component="span" fullWidth sx={{ mb: 2 }}>
                {selectedFile ? selectedFile.name : 'Choose File'}
              </Button>
            </label>
          </Box>
          <TextField
            id="file-description"
            label="Description (optional)"
            multiline
            rows={3}
            fullWidth
            sx={{ mb: 2 }}
          />
          {uploading && (
            <Box sx={{ mb: 2 }}>
              <CircularProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleFileUpload(currentSection!.id, currentSubfolder?.id)}
            variant="contained"
            disabled={!selectedFile || uploading}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Upload */}
      {user && currentSection && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload />
        </Fab>
      )}
    </Container>
  );
};

export default LessonPlans;