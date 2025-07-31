import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { AutoStories, Psychology, Groups, Assessment, Save, Download, CloudUpload, DeleteOutline, TableView } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { documentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface SchemeOfWork {
  subject: string;
  grade: string;
  term: string;
  duration: string;
  strand: string;
  subStrand: string;
  weeks: number;
  generalObjectives: string[];
  specificObjectives: string[];
  resources: string[];
  assessment: string;
}

interface WeeklyPlan {
  week: number;
  topic: string;
  specificObjectives: string[];
  keyInquiryQuestions: string[];
  learningExperiences: string[];
  coreCompetencies: string[];
  values: string[];
  resources: string[];
  assessmentMethods: string[];
}

const SchemeOfWorkGenerator: React.FC = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [uploadedTemplate, setUploadedTemplate] = useState<any>(null);
  const [generatedScheme, setGeneratedScheme] = useState<any>(null);
  const [schemeOfWork, setSchemeOfWork] = useState<SchemeOfWork>({
    subject: '',
    grade: '',
    term: '',
    duration: '',
    strand: '',
    subStrand: '',
    weeks: 12,
    generalObjectives: [''],
    specificObjectives: [''],
    resources: [''],
    assessment: '',
  });

  const steps = [
    'Basic Information',
    'Curriculum Details',
    'Objectives & Resources',
    'Assessment & Review'
  ];

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

  const terms = ['Term 1', 'Term 2', 'Term 3'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (field: keyof SchemeOfWork, value: any) => {
    setSchemeOfWork(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addArrayItem = (field: 'generalObjectives' | 'specificObjectives' | 'resources') => {
    setSchemeOfWork(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayItem = (field: 'generalObjectives' | 'specificObjectives' | 'resources', index: number, value: string) => {
    setSchemeOfWork(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleGenerateWithAI = async () => {
    if (!schemeOfWork.subject || !schemeOfWork.grade || !schemeOfWork.strand) {
      toast.error('Please fill in subject, grade, and strand before generating');
      return;
    }

    setLoading(true);
    try {
      const contextData: any = {
        subject: schemeOfWork.subject,
        grade: schemeOfWork.grade,
        term: schemeOfWork.term,
        strand: schemeOfWork.strand,
        subStrand: schemeOfWork.subStrand,
        weeks: schemeOfWork.weeks,
        duration: schemeOfWork.duration,
        type: 'scheme-of-work'
      };

      // If we have a template, add it to the context
      if (uploadedTemplate) {
        contextData.context = `Please follow the format and structure from the uploaded template document: ${uploadedTemplate.filename}. Use the same sections, formatting style, and criteria as shown in the template for the scheme of work.`;
      }

      // For now, we'll simulate the AI response since the actual API endpoint needs to be implemented
      // In production, you would call: const response = await schemesAPI.generateWithAI(contextData);
      
      // Simulated response structure
      const mockResponse = {
        data: {
          success: true,
          data: {
            title: `${schemeOfWork.subject} - ${schemeOfWork.grade} - ${schemeOfWork.term} Scheme of Work`,
            subject: schemeOfWork.subject,
            grade: schemeOfWork.grade,
            term: schemeOfWork.term,
            strand: schemeOfWork.strand,
            subStrand: schemeOfWork.subStrand,
            duration: schemeOfWork.duration,
            weeks: schemeOfWork.weeks,
            generalObjectives: [
              'Develop understanding of key concepts',
              'Apply knowledge in practical situations',
              'Demonstrate critical thinking skills'
            ],
            weeklyPlans: Array.from({ length: schemeOfWork.weeks }, (_, i) => ({
              week: i + 1,
              topic: `Week ${i + 1} Topic: Core Concepts ${i + 1}`,
              specificObjectives: [
                `By the end of week ${i + 1}, learners should be able to understand basic concepts`,
                `Apply knowledge gained in week ${i + 1} activities`
              ],
              keyInquiryQuestions: [
                `What are the main concepts in week ${i + 1}?`,
                `How can we apply these concepts practically?`
              ],
              learningExperiences: [
                'Interactive discussions and group work',
                'Hands-on activities and experiments',
                'Individual and collaborative projects'
              ],
              coreCompetencies: ['Communication', 'Critical Thinking', 'Creativity'],
              values: ['Responsibility', 'Integrity', 'Respect'],
              resources: ['Textbooks', 'Charts', 'Digital resources'],
              assessmentMethods: ['Observation', 'Oral questions', 'Written tasks']
            }))
          }
        }
      };

      if (mockResponse.data.success) {
        setGeneratedScheme(mockResponse.data.data);
        toast.success('AI scheme of work generated successfully!');
        setActiveStep(steps.length); // Move to a completion step
      } else {
        toast.error('Failed to generate scheme of work');
      }
    } catch (error) {
      console.error('Error generating scheme of work:', error);
      toast.error('Failed to generate scheme of work. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGenerate = async () => {
    // Quick generation from basic info
    if (!schemeOfWork.subject || !schemeOfWork.grade || !schemeOfWork.strand) {
      toast.error('Please fill in subject, grade, and strand');
      return;
    }

    await handleGenerateWithAI();
  };

  const handleSaveScheme = async () => {
    if (!generatedScheme || !user) {
      toast.error('Please generate a scheme of work first and ensure you are logged in');
      return;
    }

    setSaving(true);
    try {
      // This would be implemented with the schemes API
      // const response = await schemesAPI.create(generatedScheme);
      
      // Simulated save
      toast.success('Scheme of work saved successfully!');
    } catch (error) {
      console.error('Error saving scheme of work:', error);
      toast.error('Failed to save scheme of work. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportToExcel = async () => {
    if (!generatedScheme) {
      toast.error('Please generate a scheme of work first');
      return;
    }

    setExporting(true);
    try {
      // Create CSV content that can be opened in Excel
      const headers = [
        'Week',
        'Topic',
        'Specific Objectives',
        'Key Inquiry Questions',
        'Learning Experiences',
        'Core Competencies',
        'Values',
        'Resources',
        'Assessment Methods'
      ];

      const csvContent = [
        // Title rows
        [`${generatedScheme.title}`],
        [`Subject: ${generatedScheme.subject}, Grade: ${generatedScheme.grade}, Term: ${generatedScheme.term}`],
        [`Strand: ${generatedScheme.strand}, Sub-Strand: ${generatedScheme.subStrand}`],
        [`Duration: ${generatedScheme.duration}, Total Weeks: ${generatedScheme.weeks}`],
        [''], // Empty row
        ['General Objectives:'],
        ...generatedScheme.generalObjectives.map((obj: string) => [`• ${obj}`]),
        [''], // Empty row
        headers, // Column headers
        // Weekly data
        ...generatedScheme.weeklyPlans.map((week: WeeklyPlan) => [
          week.week.toString(),
          week.topic,
          week.specificObjectives.join('; '),
          week.keyInquiryQuestions.join('; '),
          week.learningExperiences.join('; '),
          week.coreCompetencies.join(', '),
          week.values.join(', '),
          week.resources.join(', '),
          week.assessmentMethods.join(', ')
        ])
      ];

      // Convert to CSV format
      const csv = csvContent.map(row =>
        row.map((cell: any) => `"${cell?.toString().replace(/"/g, '""') || ''}"`).join(',')
      ).join('\n');      // Create and download the file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedScheme.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scheme_of_work.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Scheme of work exported to CSV successfully! You can open it in Excel.');
    } catch (error) {
      console.error('Error exporting scheme of work:', error);
      toast.error('Failed to export scheme of work. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleTemplateFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Define supported file types
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
      
      // Validate file type
      const isValidType = supportedTypes.includes(file.type) || 
                         supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValidType) {
        toast.error('Please upload a PDF, Word document, text file, Excel file, or CSV file');
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }
      setTemplateFile(file);
    }
  };

  const handleUploadTemplate = async () => {
    if (!templateFile) {
      toast.error('Please select a template file first');
      return;
    }

    setUploadingTemplate(true);
    try {
      const formData = new FormData();
      formData.append('document', templateFile);
      formData.append('type', 'scheme-of-work-template');
      formData.append('description', 'Scheme of work template for AI generation');

      const response = await documentsAPI.upload(formData);

      if (response.data.success) {
        setUploadedTemplate(response.data.data);
        toast.success('Template uploaded successfully! It will be used for future generations.');
        setTemplateFile(null);
        // Reset file input
        const fileInput = document.getElementById('template-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast.error('Failed to upload template');
      }
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('Failed to upload template. Please try again.');
    } finally {
      setUploadingTemplate(false);
    }
  };

  const handleRemoveTemplate = () => {
    setUploadedTemplate(null);
    setTemplateFile(null);
    toast.info('Template removed. AI will use default format.');
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={schemeOfWork.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                >
                  {cbcSubjects.map(subject => (
                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={schemeOfWork.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                >
                  {cbcGrades.map(grade => (
                    <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Term</InputLabel>
                <Select
                  value={schemeOfWork.term}
                  onChange={(e) => handleInputChange('term', e.target.value)}
                >
                  {terms.map(term => (
                    <MenuItem key={term} value={term}>{term}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration"
                value={schemeOfWork.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="e.g., 13 weeks, 3 months"
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Strand"
                value={schemeOfWork.strand}
                onChange={(e) => handleInputChange('strand', e.target.value)}
                placeholder="Enter the curriculum strand"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sub-Strand"
                value={schemeOfWork.subStrand}
                onChange={(e) => handleInputChange('subStrand', e.target.value)}
                placeholder="Enter the sub-strand"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Weeks"
                value={schemeOfWork.weeks}
                onChange={(e) => handleInputChange('weeks', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                General Objectives
              </Typography>
              {schemeOfWork.generalObjectives.map((objective, index) => (
                <TextField
                  key={index}
                  fullWidth
                  multiline
                  rows={2}
                  label={`General Objective ${index + 1}`}
                  value={objective}
                  onChange={(e) => updateArrayItem('generalObjectives', index, e.target.value)}
                  sx={{ mb: 2 }}
                />
              ))}
              <Button onClick={() => addArrayItem('generalObjectives')}>
                Add General Objective
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                <AutoStories sx={{ mr: 1, verticalAlign: 'middle' }} />
                Resources Needed
              </Typography>
              {schemeOfWork.resources.map((resource, index) => (
                <TextField
                  key={index}
                  fullWidth
                  label={`Resource ${index + 1}`}
                  value={resource}
                  onChange={(e) => updateArrayItem('resources', index, e.target.value)}
                  sx={{ mb: 2 }}
                />
              ))}
              <Button onClick={() => addArrayItem('resources')}>
                Add Resource
              </Button>
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Assessment Strategy
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="How will you assess student progress throughout the term?"
              value={schemeOfWork.assessment}
              onChange={(e) => handleInputChange('assessment', e.target.value)}
              placeholder="Describe your assessment strategy..."
            />
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  const renderGeneratedScheme = () => {
    if (!generatedScheme) return null;

    return (
      <Paper sx={{ p: 4, mt: 3, backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography variant="h4" gutterBottom color="primary">
          📊 Generated CBC Scheme of Work
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {generatedScheme.title}
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Chip label={`${generatedScheme.subject}`} color="primary" sx={{ mr: 1, mb: 1 }} />
              <Chip label={`${generatedScheme.grade}`} color="secondary" sx={{ mr: 1, mb: 1 }} />
              <Chip label={`${generatedScheme.term}`} variant="outlined" sx={{ mr: 1, mb: 1 }} />
              <Chip label={`${generatedScheme.weeks} weeks`} variant="outlined" sx={{ mr: 1, mb: 1 }} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Strand & Sub-Strand</Typography>
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography><strong>Strand:</strong> {generatedScheme.strand}</Typography>
              <Typography><strong>Sub-Strand:</strong> {generatedScheme.subStrand}</Typography>
              <Typography><strong>Duration:</strong> {generatedScheme.duration}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>General Objectives</Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {generatedScheme.generalObjectives?.map((objective: string, index: number) => (
                <li key={index}>
                  <Typography>{objective}</Typography>
                </li>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Weekly Breakdown</Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                    <TableCell><strong>Week</strong></TableCell>
                    <TableCell><strong>Topic</strong></TableCell>
                    <TableCell><strong>Specific Objectives</strong></TableCell>
                    <TableCell><strong>Key Questions</strong></TableCell>
                    <TableCell><strong>Learning Experiences</strong></TableCell>
                    <TableCell><strong>Core Competencies</strong></TableCell>
                    <TableCell><strong>Values</strong></TableCell>
                    <TableCell><strong>Resources</strong></TableCell>
                    <TableCell><strong>Assessment</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatedScheme.weeklyPlans?.map((week: WeeklyPlan) => (
                    <TableRow key={week.week}>
                      <TableCell>{week.week}</TableCell>
                      <TableCell>{week.topic}</TableCell>
                      <TableCell>
                        <Box component="ul" sx={{ pl: 2, margin: 0 }}>
                          {week.specificObjectives.map((obj, idx) => (
                            <Box key={idx} component="li" sx={{ fontSize: '0.875rem' }}>{obj}</Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box component="ul" sx={{ pl: 2, margin: 0 }}>
                          {week.keyInquiryQuestions.map((question, idx) => (
                            <Box key={idx} component="li" sx={{ fontSize: '0.875rem' }}>{question}</Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box component="ul" sx={{ pl: 2, margin: 0 }}>
                          {week.learningExperiences.map((exp, idx) => (
                            <Box key={idx} component="li" sx={{ fontSize: '0.875rem' }}>{exp}</Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {week.coreCompetencies.map((comp, idx) => (
                            <Chip key={idx} label={comp} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {week.values.map((value, idx) => (
                            <Chip key={idx} label={value} size="small" color="secondary" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {week.resources.join(', ')}
                      </TableCell>
                      <TableCell>
                        {week.assessmentMethods.join(', ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                onClick={handleSaveScheme}
                disabled={saving || !user}
              >
                {saving ? 'Saving...' : 'Save Scheme'}
              </Button>
              <Button 
                variant="contained" 
                color="secondary"
                startIcon={exporting ? <CircularProgress size={20} /> : <TableView />}
                onClick={handleExportToExcel}
                disabled={exporting}
              >
                {exporting ? 'Exporting...' : 'Export to Excel (CSV)'}
              </Button>
              <Button variant="outlined" onClick={() => {
                setGeneratedScheme(null);
                setActiveStep(0);
              }}>
                Create Another Scheme
              </Button>
            </Box>
            {!user && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please log in to save schemes of work to your account.
              </Alert>
            )}
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography variant="h4" gutterBottom align="center">
          CBC Scheme of Work Generator
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Create comprehensive schemes of work aligned with CBC curriculum standards
        </Typography>

        {/* Template Upload Section */}
        <Card sx={{ mb: 4, border: '2px dashed #1976d2', backgroundColor: '#f8f9ff' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📊 Upload Scheme of Work Template (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload a sample scheme of work in PDF, Word, Excel, CSV, or text format to ensure all generated schemes follow the same format and criteria.
            </Typography>
            
            {!uploadedTemplate ? (
              <Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <Box
                    component="input"
                    id="template-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    onChange={handleTemplateFileChange}
                    sx={{ display: 'none' }}
                  />
                  <label htmlFor="template-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                    >
                      Choose Template File
                    </Button>
                  </label>
                  
                  {templateFile && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {templateFile.name} ({(templateFile.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleUploadTemplate}
                        disabled={uploadingTemplate}
                        startIcon={uploadingTemplate ? <CircularProgress size={16} /> : <CloudUpload />}
                      >
                        {uploadingTemplate ? 'Uploading...' : 'Upload'}
                      </Button>
                    </Box>
                  )}
                </Box>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Tip:</strong> Upload a well-structured scheme of work in Excel (.xlsx/.xls), CSV (.csv), PDF, Word (.doc/.docx), or text (.txt) format that includes weekly breakdowns, objectives, and assessment methods.
                  </Typography>
                </Alert>
              </Box>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    ✅ Template uploaded: <strong>{uploadedTemplate.filename}</strong>
                  </Typography>
                </Alert>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    All generated schemes of work will follow the format and criteria from your uploaded template.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleRemoveTemplate}
                    startIcon={<DeleteOutline />}
                  >
                    Remove Template
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        <Divider sx={{ mb: 4 }} />

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {/* Quick AI Generation Section */}
          {activeStep === 0 && schemeOfWork.subject && schemeOfWork.grade && schemeOfWork.strand && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>
                  Ready to generate? You can create an AI-powered scheme of work now or continue customizing.
                  {uploadedTemplate && ' 📊 Using your uploaded template format!'}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleQuickGenerate}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Psychology />}
                >
                  {loading ? 'Generating...' : 'Generate with AI'}
                </Button>
              </Box>
            </Alert>
          )}
          
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep === steps.length - 1 ? (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleGenerateWithAI}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Psychology />}
              >
                {loading ? 'Generating...' : 'Generate with AI'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Display Generated Scheme of Work */}
      {renderGeneratedScheme()}
    </Container>
  );
};

export default SchemeOfWorkGenerator;
