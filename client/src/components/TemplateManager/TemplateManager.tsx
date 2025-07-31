import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  InsertDriveFile as FileIcon,
  Description as PdfIcon,
  Article as WordIcon,
  TableView as ExcelIcon,
  TextSnippet as TextIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { schemesAPI } from '../../services/api';

interface Template {
  id: string;
  originalName: string;
  subject: string | null;
  grade: string | null;
  fileSize: number;
  createdAt: string;
}

interface TemplateManagerProps {
  open: boolean;
  onClose: () => void;
  onTemplateSelect: (template: Template | null) => void;
  selectedTemplate: Template | null;
  allowUpload?: boolean;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  open,
  onClose,
  onTemplateSelect,
  selectedTemplate,
  allowUpload = true,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    subject: '',
    grade: '',
  });

  const cbcSubjects = [
    'Mathematics',
    'English',
    'Kiswahili',
    'Science & Technology',
    'Social Studies',
    'Creative Arts',
    'Physical Education'
  ];

  const cbcGrades = [
    'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 
    'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'
  ];

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await schemesAPI.getTemplates();
      if (response.data.success) {
        setTemplates(response.data.data);
      } else {
        toast.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const supportedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      const supportedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.csv'];
      const isValidType = supportedTypes.includes(file.type) || 
                         supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValidType) {
        toast.error('Please upload a PDF, Word document, text file, Excel file, or CSV file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }

      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const metadata = {
        ...(uploadMetadata.subject && { subject: uploadMetadata.subject }),
        ...(uploadMetadata.grade && { grade: uploadMetadata.grade }),
      };

      const response = await schemesAPI.uploadTemplate(uploadFile, metadata);
      
      if (response.data.success) {
        toast.success('Template uploaded successfully!');
        setUploadFile(null);
        setUploadMetadata({ subject: '', grade: '' });
        // Reset file input
        const fileInput = document.getElementById('template-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Refresh templates list
        await fetchTemplates();
      } else {
        toast.error('Failed to upload template');
      }
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('Failed to upload template');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return;
    }

    try {
      const response = await schemesAPI.deleteTemplate(templateId);
      
      if (response.data.success) {
        toast.success('Template deleted successfully');
        // If the deleted template was selected, clear selection
        if (selectedTemplate?.id === templateId) {
          onTemplateSelect(null);
        }
        // Refresh templates list
        await fetchTemplates();
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return <PdfIcon sx={{ color: '#d32f2f' }} />;
      case 'doc':
      case 'docx':
        return <WordIcon sx={{ color: '#1976d2' }} />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <ExcelIcon sx={{ color: '#388e3c' }} />;
      case 'txt':
        return <TextIcon sx={{ color: '#616161' }} />;
      default:
        return <FileIcon sx={{ color: '#757575' }} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || template.subject === filterSubject;
    const matchesGrade = !filterGrade || template.grade === filterGrade;
    return matchesSearch && matchesSubject && matchesGrade;
  });

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Template Manager</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Upload Section */}
        {allowUpload && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload New Template
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    fullWidth
                  >
                    Choose File
                    <input
                      id="template-file-input"
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
                      onChange={handleFileSelect}
                    />
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Subject (Optional)</InputLabel>
                    <Select
                      value={uploadMetadata.subject}
                      onChange={(e) => setUploadMetadata(prev => ({ ...prev, subject: e.target.value }))}
                    >
                      <MenuItem value="">None</MenuItem>
                      {cbcSubjects.map(subject => (
                        <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Grade (Optional)</InputLabel>
                    <Select
                      value={uploadMetadata.grade}
                      onChange={(e) => setUploadMetadata(prev => ({ ...prev, grade: e.target.value }))}
                    >
                      <MenuItem value="">None</MenuItem>
                      {cbcGrades.map(grade => (
                        <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    fullWidth
                  >
                    {uploading ? <CircularProgress size={20} /> : 'Upload'}
                  </Button>
                </Grid>
              </Grid>
              
              {uploadFile && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info">
                    Selected file: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filters Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filter Templates
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search by filename"
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
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Subject</InputLabel>
                  <Select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <MenuItem value="">All Subjects</MenuItem>
                    {cbcSubjects.map(subject => (
                      <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Grade</InputLabel>
                  <Select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                  >
                    <MenuItem value="">All Grades</MenuItem>
                    {cbcGrades.map(grade => (
                      <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Available Templates ({filteredTemplates.length})
              </Typography>
              {selectedTemplate && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`Selected: ${selectedTemplate.originalName}`}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredTemplates.length === 0 ? (
              <Alert severity="info">
                No templates found. {allowUpload ? 'Upload your first template above!' : 'Ask an admin to upload templates.'}
              </Alert>
            ) : (
              <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {filteredTemplates.map((template, index) => (
                  <React.Fragment key={template.id}>
                    <ListItem
                      button
                      selected={selectedTemplate?.id === template.id}
                      onClick={() => onTemplateSelect(template)}
                      sx={{
                        border: selectedTemplate?.id === template.id ? 2 : 1,
                        borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        {getFileIcon(template.originalName)}
                      </Box>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" component="span">
                              {template.originalName}
                            </Typography>
                            {template.subject && (
                              <Chip label={template.subject} size="small" color="primary" />
                            )}
                            {template.grade && (
                              <Chip label={template.grade} size="small" color="secondary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {formatFileSize(template.fileSize)} • Uploaded {formatDate(template.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(template.id, template.originalName);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredTemplates.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => onTemplateSelect(null)} color="secondary">
          Clear Selection
        </Button>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateManager;
