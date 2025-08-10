import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Breadcrumbs,
  Link,
  CircularProgress,
  DialogContentText
} from '@mui/material';
import {
  Folder,
  PictureAsPdf,
  Article,
  Upload,
  Add,
  NavigateNext,
  Visibility,
  Download,
  Delete
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { libraryAPI, SERVER_BASE_ORIGIN } from '../../services/api';
import { toast } from 'react-toastify';

interface LibrarySection {
  id: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  _count?: { files: number };
  subfolders?: LibrarySubfolder[];
}

interface LibrarySubfolder {
  id: string;
  name: string;
  sectionId?: string;
  order?: number;
  _count?: { files: number };
}

interface LibraryFile {
  id: string;
  filename: string;
  originalName: string;
  fileType: 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOCUMENT';
  fileSize: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  description?: string;
  createdAt: string;
  uploader: { firstName: string; lastName: string; email: string };
}

const SchemesOfWork: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = Boolean(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'));
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<LibrarySection[]>([]);
  const [currentSection, setCurrentSection] = useState<LibrarySection | null>(null);
  const [currentSubfolder, setCurrentSubfolder] = useState<LibrarySubfolder | null>(null);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [subfolderDialogOpen, setSubfolderDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<LibraryFile | null>(null);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'PDF': return <PictureAsPdf color="error" />;
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

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await libraryAPI.getSections();
      setSections(response.data);
    } catch (error) {
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (sectionId: string, subfolderId?: string) => {
    try {
      setLoading(true);
      const response = await libraryAPI.getFiles({ sectionId, subfolderId });
      const onlyDocs = (response.data || []).filter((f: any) => f.fileType === 'PDF' || f.fileType === 'DOCUMENT');
      setFiles(onlyDocs);
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const handleSectionClick = (section: LibrarySection) => {
    setCurrentSection(section);
    setCurrentSubfolder(null);
    if (!section.subfolders || section.subfolders.length === 0) {
      loadFiles(section.id);
    }
  };

  const handleSubfolderClick = (subfolder: LibrarySubfolder) => {
    setCurrentSubfolder(subfolder);
    if (currentSection) loadFiles(currentSection.id, subfolder.id);
  };

  const handleFileUpload = async (sectionId: string, subfolderId?: string) => {
    if (!selectedFile || !user) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sectionId', sectionId);
      if (subfolderId) formData.append('subfolderId', subfolderId);
      // Tag as 'scheme' to distinguish category if needed later
      formData.append('tags', JSON.stringify(['scheme']))

      await libraryAPI.uploadFile(formData, (progress) => setUploadProgress(progress), { userId: user.id, role: user.role });
      toast.success(isAdmin ? 'File uploaded and approved!' : 'File uploaded successfully! Awaiting admin approval.');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      if (currentSection) loadFiles(currentSection.id, currentSubfolder?.id || undefined);
    } catch (e) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
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
        <Folder sx={{ mr: 0.5 }} fontSize="inherit" />
        Schemes Of Work
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
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }, transition: 'all 0.3s ease' }} onClick={() => handleSectionClick(section)}>
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
                <Chip label={`${section._count?.files || 0} files`} size="small" color="primary" variant="outlined" />
                {section.subfolders && section.subfolders.length > 0 && (
                  <Chip label={`${section.subfolders.length} folders`} size="small" color="secondary" variant="outlined" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
      {isAdmin && (
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ cursor: 'pointer', border: '2px dashed', borderColor: 'primary.main', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => setSectionDialogOpen(true)}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Add color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6" color="primary">Add New Section</Typography>
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
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'scale(1.02)' }, transition: 'transform 0.2s ease' }} onClick={() => handleSubfolderClick(subfolder)}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Folder color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="subtitle1">{subfolder.name}</Typography>
              <Chip label={`${subfolder._count?.files || 0} files`} size="small" variant="outlined" />
            </CardContent>
          </Card>
        </Grid>
      ))}
      {isAdmin && (
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', border: '1px dashed', borderColor: 'secondary.main', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => setSubfolderDialogOpen(true)}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Add color="secondary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="body2" color="secondary">Add Subfolder</Typography>
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
                  <Typography variant="subtitle2" noWrap>{file.originalName}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatFileSize(file.fileSize)}</Typography>
                </Box>
                <Chip label={file.status} size="small" color={file.status === 'APPROVED' ? 'success' : file.status === 'PENDING' ? 'warning' : 'error'} variant="outlined" />
              </Box>
              <Typography variant="caption" color="text.secondary">Uploaded by {file.uploader.firstName} {file.uploader.lastName}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" startIcon={<Visibility />} component="a" href={`${SERVER_BASE_ORIGIN}/uploads/library/${file.filename}`} target="_blank" rel="noopener noreferrer">View</Button>
              <Button size="small" startIcon={<Download />} component="a" href={`${SERVER_BASE_ORIGIN}/uploads/library/${file.filename}`} download>Download</Button>
              {isAdmin && (
                <Button size="small" startIcon={<Delete />} color="error" onClick={() => { setFileToDelete(file); setDeleteConfirmOpen(true); }}>Delete</Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>📄 Schemes Of Work Samples</Typography>
        <Typography variant="body1" color="text.secondary">Browse folders of Schemes of Work (PDF/Word). Admins can create folders, upload, and delete files.</Typography>
      </Box>

      {renderBreadcrumbs()}

      {!currentSection && renderSections()}
      {currentSection && !currentSubfolder && currentSection.subfolders && currentSection.subfolders.length > 0 && renderSubfolders()}
      {((currentSection && currentSubfolder) || (currentSection && (!currentSection.subfolders || currentSection.subfolders.length === 0))) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">{currentSubfolder ? currentSubfolder.name : currentSection?.name} Files</Typography>
            <Button variant="contained" startIcon={<Upload />} onClick={() => setUploadDialogOpen(true)} disabled={!user}>Upload File</Button>
          </Box>
          {loading && files.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderFiles()
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Scheme (PDF/Word)</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              hidden
              id="scheme-upload-input"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <label htmlFor="scheme-upload-input">
              <Button variant="outlined" component="span" fullWidth sx={{ mb: 2 }}>
                {selectedFile ? selectedFile.name : 'Choose File'}
              </Button>
            </label>
          </Box>
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
          <Button onClick={() => currentSection && handleFileUpload(currentSection.id, currentSubfolder?.id)} variant="contained" disabled={!selectedFile || uploading}>Upload</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{fileToDelete?.originalName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            if (!fileToDelete) return;
            try {
              await libraryAPI.deleteFile(fileToDelete.id, user ? { userId: user.id, role: user.role } : undefined);
              toast.success('File deleted');
              setDeleteConfirmOpen(false);
              setFileToDelete(null);
              if (currentSection) loadFiles(currentSection.id, currentSubfolder?.id || undefined);
            } catch (e) {
              toast.error('Failed to delete file');
            }
          }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Create Section Dialog */}
      <Dialog open={sectionDialogOpen} onClose={() => setSectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Section</DialogTitle>
        <DialogContent>
          <TextField label="Section Name" fullWidth sx={{ mt: 1, mb: 2 }} value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
          <TextField label="Description (optional)" fullWidth multiline rows={3} sx={{ mb: 2 }} value={newSectionDescription} onChange={(e) => setNewSectionDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!user || !isAdmin || !newSectionName.trim()) return;
              try {
                await libraryAPI.createSection({ name: newSectionName.trim(), description: newSectionDescription.trim() || undefined }, { userId: user.id, role: user.role });
                toast.success('Section created');
                setSectionDialogOpen(false);
                setNewSectionName('');
                setNewSectionDescription('');
                loadSections();
              } catch (e) {
                toast.error('Failed to create section');
              }
            }}
            variant="contained"
            disabled={!isAdmin || !user || !newSectionName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Subfolder Dialog */}
      <Dialog open={subfolderDialogOpen} onClose={() => setSubfolderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Subfolder</DialogTitle>
        <DialogContent>
          <TextField label="Subfolder Name" fullWidth sx={{ mt: 1 }} value={newSubfolderName} onChange={(e) => setNewSubfolderName(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubfolderDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!user || !isAdmin || !currentSection || !newSubfolderName.trim()) return;
              try {
                await libraryAPI.createSubfolder({ name: newSubfolderName.trim(), sectionId: currentSection.id }, { userId: user.id, role: user.role });
                toast.success('Subfolder created');
                setSubfolderDialogOpen(false);
                setNewSubfolderName('');
                loadSections();
              } catch (e) {
                toast.error('Failed to create subfolder');
              }
            }}
            variant="contained"
            disabled={!isAdmin || !user || !newSubfolderName.trim() || !currentSection}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SchemesOfWork;