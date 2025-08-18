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
import { 
  AutoStories, 
  Psychology, 
  Assessment, 
  Save, 
  Download, 
  Settings
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { schemesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import TemplateManager from '../../components/TemplateManager/TemplateManager';
import ExportDialog from '../../components/ExportDialog/ExportDialog';

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
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [generatedScheme, setGeneratedScheme] = useState<any>(null);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
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

      // If we have a selected template, fetch its content and add to context
      if (selectedTemplate) {
        try {
          const templateResponse = await schemesAPI.getTemplate(selectedTemplate.id);
          if (templateResponse.data.success) {
            const templateData = templateResponse.data.data;
            contextData.templateContent = {
              extractedText: templateData.extractedText,
              filename: templateData.originalName
            };
            contextData.context = `Please follow the format and structure from the uploaded template document: ${templateData.originalName}. Use the same sections, formatting style, and criteria as shown in the template for the scheme of work.`;
          }
        } catch (templateError) {
          console.warn('Could not fetch template content, proceeding without template:', templateError);
        }
      }

      // Call the AI generation API
      const response = await schemesAPI.generateWithAI(contextData);
      
      if (response.data.success) {
        const generatedData = response.data.data;
        setGeneratedScheme(generatedData);
        setActiveStep(3); // Move to export step
        toast.success('Scheme of work generated successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to generate scheme of work');
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
      // Save the generated scheme using the API
      const response = await schemesAPI.create(generatedScheme);
      
      if (response.data.success) {
        toast.success('Scheme of work saved successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to save scheme of work');
      }
    } catch (error) {
      console.error('Error saving scheme of work:', error);
      toast.error('Failed to save scheme of work. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportToExcel = async () => {
    setExportDialogOpen(true);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    if (template) {
      toast.success(`Template "${template.originalName}" selected!`);
    } else {
      toast.info('Template selection cleared');
    }
  };

  const handleRemoveTemplate = () => {
    setSelectedTemplate(null);
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
                startIcon={<Download />}
                onClick={handleExportToExcel}
                disabled={false}
              >
                Export Scheme
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
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, backgroundColor: '#f8f9fa', minHeight: '100vh', px: { xs: 0.5, sm: 2, md: 3 }, overflowX: 'hidden' }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography variant="h4" gutterBottom align="center">
          CBC Scheme of Work Generator
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Create comprehensive schemes of work aligned with CBC curriculum standards
        </Typography>

        {/* Template Management Section */}
        <Card sx={{ mb: 4, border: '2px dashed #1976d2', backgroundColor: '#f8f9ff' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📊 Template Management (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select or upload a scheme of work template to ensure all generated schemes follow the same format and criteria.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="outlined"
                startIcon={<Settings />}
                onClick={() => setTemplateManagerOpen(true)}
              >
                Manage Templates
              </Button>
              
              {selectedTemplate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`Selected: ${selectedTemplate.originalName}`}
                    color="primary"
                    variant="outlined"
                    onDelete={handleRemoveTemplate}
                  />
                </Box>
              )}
            </Box>
            
            {selectedTemplate ? (
              <Alert severity="success">
                <Typography variant="body2">
                  ✅ Template selected: <strong>{selectedTemplate.originalName}</strong>
                  {selectedTemplate.subject && ` (${selectedTemplate.subject})`}
                  {selectedTemplate.grade && ` - ${selectedTemplate.grade}`}
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Tip:</strong> Select a template to guide AI generation, or upload a new one if needed. Templates can be in PDF, Word, Excel, CSV, or text format.
                </Typography>
              </Alert>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
                <Typography>
                  Ready to generate? You can create an AI-powered scheme of work now or continue customizing.
                  {selectedTemplate && ' 📊 Using your selected template format!'}
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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

      {/* Template Manager Dialog */}
      <TemplateManager
        open={templateManagerOpen}
        onClose={() => setTemplateManagerOpen(false)}
        onTemplateSelect={handleTemplateSelect}
        selectedTemplate={selectedTemplate}
        allowUpload={true}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        scheme={generatedScheme}
      />
    </Container>
  );
};

export default SchemeOfWorkGenerator;
