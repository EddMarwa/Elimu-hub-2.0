import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import {
  CloudUpload,
  PictureAsPdf,
  CheckCircle,
  Error,
  Delete,
  Visibility
} from '@mui/icons-material';
import axios from 'axios';

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

const Upload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [documentType, setDocumentType] = useState('');

  const subjects = [
    'Mathematics',
    'English',
    'Kiswahili',
    'Science and Technology',
    'Social Studies',
    'Creative Arts',
    'Physical and Health Education'
  ];

  const grades = [
    'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'
  ];

  const documentTypes = [
    'Curriculum Design',
    'Teachers Guide',
    'Learners Book',
    'Assessment Rubric'
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    newFiles.forEach(uploadFile => {
      uploadDocument(uploadFile);
    });
  }, [subject, grade, documentType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const uploadDocument = async (uploadFile: UploadedFile) => {
    try {
      const formData = new FormData();
      formData.append('document', uploadFile.file);
      formData.append('subject', subject);
      formData.append('grade', grade);
      formData.append('documentType', documentType);

      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'processing', progress: 50 }
            : f
        )
      );

      const response = await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          
          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === uploadFile.id
                ? { ...f, progress: Math.min(progress, 90) }
                : f
            )
          );
        }
      });

      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                result: response.data.data
              }
            : f
        )
      );

    } catch (error: any) {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'error',
                progress: 0,
                error: error.response?.data?.message || 'Upload failed'
              }
            : f
        )
      );
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'processing':
      case 'uploading':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <PictureAsPdf color="primary" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        📤 Upload Curriculum Documents
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Upload PDF documents to extract content and build your curriculum reference library.
        Supports both text-based and scanned PDFs with OCR processing.
      </Typography>

      {/* Upload Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
            Document Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  label="Subject"
                >
                  {subjects.map(subj => (
                    <MenuItem key={subj} value={subj}>{subj}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  label="Grade"
                >
                  {grades.map(gr => (
                    <MenuItem key={gr} value={gr}>{gr}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  label="Document Type"
                >
                  {documentTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Drag and Drop Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'primary.light' : 'background.paper',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.light'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        
        {isDragActive ? (
          <Typography variant="h6" sx={{ color: 'primary.main' }}>
            Drop the PDF files here...
          </Typography>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Drag & drop PDF files here, or click to select
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Supports multiple files • Maximum 50MB per file
            </Typography>
            <Button variant="contained" sx={{ mt: 1 }}>
              Choose Files
            </Button>
          </>
        )}
      </Paper>

      {/* Upload Progress and Results */}
      {uploadedFiles.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Upload Progress
            </Typography>
            
            <List>
              {uploadedFiles.map(uploadFile => (
                <ListItem key={uploadFile.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                  <ListItemIcon>
                    {getStatusIcon(uploadFile.status)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {uploadFile.file.name}
                        </Typography>
                        <Chip
                          label={uploadFile.status}
                          color={getStatusColor(uploadFile.status) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {uploadFile.status === 'uploading' || uploadFile.status === 'processing' ? (
                          <LinearProgress
                            variant="determinate"
                            value={uploadFile.progress}
                            sx={{ mb: 1 }}
                          />
                        ) : null}
                        
                        {uploadFile.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {uploadFile.error}
                          </Alert>
                        )}
                        
                        {uploadFile.result && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" display="block">
                              Pages: {uploadFile.result.pageCount} • 
                              Method: {uploadFile.result.processingMethod} • 
                              Text Length: {uploadFile.result.extractedTextLength} chars
                              {uploadFile.result.confidence && ` • Confidence: ${Math.round(uploadFile.result.confidence)}%`}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {uploadFile.result && (
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                    )}
                    <IconButton size="small" color="error" onClick={() => removeFile(uploadFile.id)}>
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card sx={{ mt: 3, backgroundColor: 'rgba(10, 135, 84, 0.05)' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
            📋 Upload Instructions
          </Typography>
          
          <Typography variant="body2" component="div">
            <strong>Supported Documents:</strong>
            <ul>
              <li>CBC Curriculum Designs</li>
              <li>Teacher's Guides</li>
              <li>Learner's Books</li>
              <li>Assessment Rubrics</li>
            </ul>
            
            <strong>Processing:</strong>
            <ul>
              <li>Text-based PDFs are processed directly for faster results</li>
              <li>Scanned PDFs use OCR technology for text extraction</li>
              <li>Extracted content is automatically indexed for smart search</li>
              <li>All content is organized by subject, grade, and document type</li>
            </ul>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Upload;