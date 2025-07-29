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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Container
} from '@mui/material';
import {
  CloudUpload,
  PictureAsPdf,
  CheckCircle,
  Error,
  Delete,
  Visibility,
  TextSnippet,
  Search,
  AutoAwesome,
  School,
  Description
} from '@mui/icons-material';
import { documentsAPI } from '../../services/api';

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'completed' | 'error';
  progress: number;
  result?: {
    extractedText?: string;
    chunks?: string[];
    embeddings?: number;
    searchable?: boolean;
  };
  error?: string;
  metadata?: {
    subject: string;
    grade: string;
    documentType: string;
    description?: string;
  };
}

const Upload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const subjects = [
    'English', 'Kiswahili', 'Mathematics', 'Science & Technology',
    'Social Studies', 'Creative Arts', 'Physical Education',
    'Religious Education', 'Life Skills', 'Computer Science',
    'Home Science', 'Agriculture', 'Business Studies'
  ];

  const grades = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'
  ];

  const documentTypes = [
    'Curriculum Design',
    'Teacher\'s Guide',
    'Learner\'s Book',
    'Assessment Guidelines',
    'CBC Handbook',
    'Subject Manual',
    'Reference Material',
    'Syllabus Document'
  ];

  const processingSteps = [
    { label: 'Text Extraction', description: 'Extracting text from PDF using OCR if needed' },
    { label: 'Content Chunking', description: 'Breaking content into searchable chunks' },
    { label: 'Embedding Generation', description: 'Creating semantic embeddings for search' },
    { label: 'Index Creation', description: 'Building searchable index' }
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const uploadFile: UploadedFile = {
        file,
        id: fileId,
        status: 'uploading',
        progress: 0,
        metadata: {
          subject,
          grade,
          documentType,
          description
        }
      };

      setUploadedFiles(prev => [...prev, uploadFile]);
      uploadAndProcess(uploadFile);
    });
  }, [subject, grade, documentType, description]);

  const uploadAndProcess = async (uploadFile: UploadedFile) => {
    try {
      // Step 1: Upload file
      updateFileStatus(uploadFile.id, 'uploading', 20);
      
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('subject', uploadFile.metadata!.subject);
      formData.append('grade', uploadFile.metadata!.grade);
      formData.append('documentType', uploadFile.metadata!.documentType);
      formData.append('description', uploadFile.metadata!.description || '');

      // Simulate API call for now (replace with actual API when backend is ready)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Extract text (OCR if needed)
      updateFileStatus(uploadFile.id, 'extracting', 45);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Chunk content
      updateFileStatus(uploadFile.id, 'chunking', 70);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 4: Generate embeddings
      updateFileStatus(uploadFile.id, 'embedding', 90);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Complete
      updateFileStatus(uploadFile.id, 'completed', 100, {
        extractedText: `Extracted text from ${uploadFile.file.name}. This document contains CBC curriculum content for ${uploadFile.metadata!.subject} ${uploadFile.metadata!.grade}. The content has been processed and is now searchable.`,
        chunks: [
          'Chapter 1: Introduction to CBC curriculum framework...',
          'Learning objectives for Grade 1 Mathematics...',
          'Assessment criteria and rubrics...',
          'Teaching methodologies and approaches...'
        ],
        embeddings: Math.floor(Math.random() * 200) + 50,
        searchable: true
      });

      setShowSuccessDialog(true);

    } catch (error: any) {
      updateFileStatus(uploadFile.id, 'error', 0, undefined, error.message || 'Processing failed');
    }
  };

  const updateFileStatus = (
    id: string, 
    status: UploadedFile['status'], 
    progress: number, 
    result?: any, 
    error?: string
  ) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === id ? { ...file, status, progress, result, error } : file
    ));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: !subject || !grade || !documentType
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      default: return 'primary';
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading file...';
      case 'extracting': return 'Extracting text (OCR)...';
      case 'chunking': return 'Chunking content...';
      case 'embedding': return 'Generating embeddings...';
      case 'completed': return 'Ready for search';
      case 'error': return 'Processing failed';
      default: return 'Processing...';
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      default: return <AutoAwesome color="primary" />;
    }
  };

  const isFormValid = subject && grade && documentType;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            📚 PDF Upload & Processing
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Upload CBC curriculum documents for intelligent text extraction and search
          </Typography>
        </Paper>

        <Grid container spacing={4}>
          {/* Upload Configuration */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: 'fit-content' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School color="primary" />
                Document Metadata
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  label="Subject"
                >
                  {subjects.map((subj) => (
                    <MenuItem key={subj} value={subj}>{subj}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Grade</InputLabel>
                <Select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  label="Grade"
                >
                  {grades.map((gr) => (
                    <MenuItem key={gr} value={gr}>{gr}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  label="Document Type"
                >
                  {documentTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                margin="normal"
                placeholder="Brief description of the document content..."
              />

              {!isFormValid && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Please fill in all required fields before uploading files.
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Upload Area */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUpload color="primary" />
                Upload PDF Documents
              </Typography>

              {/* Drag & Drop Area */}
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                  backgroundColor: isDragActive ? 'action.hover' : 'background.default',
                  opacity: isFormValid ? 1 : 0.5,
                  transition: 'all 0.3s ease'
                }}
              >
                <input {...getInputProps()} />
                <PictureAsPdf sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                
                {isDragActive ? (
                  <Typography variant="h6" color="primary">
                    Drop PDF files here...
                  </Typography>
                ) : (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Drag & drop PDF files here, or click to select
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supports text PDFs and scanned documents (OCR will be applied)
                    </Typography>
                  </>
                )}
              </Box>

              {/* Processing Steps Info */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Processing Pipeline:
                </Typography>
                <Stepper orientation="horizontal" sx={{ pt: 1 }}>
                  {processingSteps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel>
                        <Typography variant="caption">{step.label}</Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description color="primary" />
              Processing Queue ({uploadedFiles.length} files)
            </Typography>

            <List>
              {uploadedFiles.map((file) => (
                <Fade key={file.id} in={true} timeout={500}>
                  <ListItem
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 2,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <ListItemIcon>
                      {getStatusIcon(file.status)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle1">{file.file.name}</Typography>
                          <Chip 
                            label={getStatusText(file.status)} 
                            color={getStatusColor(file.status)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {file.metadata?.subject} • {file.metadata?.grade} • {file.metadata?.documentType}
                          </Typography>
                          
                          {file.status !== 'completed' && file.status !== 'error' && (
                            <LinearProgress 
                              variant="determinate" 
                              value={file.progress} 
                              sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                          )}
                          
                          {file.status === 'completed' && file.result && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="success.main">
                                ✓ {file.result.chunks?.length} chunks • {file.result.embeddings} embeddings • Searchable
                              </Typography>
                            </Box>
                          )}
                          
                          {file.status === 'error' && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {file.error}
                            </Alert>
                          )}
                        </Box>
                      }
                    />
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {file.status === 'completed' && (
                        <IconButton 
                          onClick={() => setPreviewFile(file)}
                          color="primary"
                          title="Preview extracted content"
                        >
                          <Visibility />
                        </IconButton>
                      )}
                      <IconButton 
                        onClick={() => removeFile(file.id)}
                        color="error"
                        title="Remove file"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
                </Fade>
              ))}
            </List>
          </Paper>
        )}

        {/* Success Dialog */}
        <Dialog
          open={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle color="success" />
            Processing Complete!
          </DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Your document has been successfully processed and is now available for semantic search.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You can now use the Reference section to search through the uploaded content.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSuccessDialog(false)}>
              Continue Uploading
            </Button>
            <Button variant="contained" href="/reference">
              Go to Search
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={!!previewFile}
          onClose={() => setPreviewFile(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextSnippet color="primary" />
              {previewFile?.file.name}
            </Box>
          </DialogTitle>
          <DialogContent>
            {previewFile?.result && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Extracted Content Summary
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  {previewFile.result.extractedText}
                </Typography>
                
                <Typography variant="h6" gutterBottom>
                  Content Chunks ({previewFile.result.chunks?.length})
                </Typography>
                {previewFile.result.chunks?.map((chunk, index) => (
                  <Typography 
                    key={index} 
                    variant="body2" 
                    sx={{ mb: 1, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}
                  >
                    {index + 1}. {chunk}
                  </Typography>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewFile(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Upload;
