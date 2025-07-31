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
} from '@mui/material';
import { AutoStories, Psychology, Groups, Assessment, Save, Download, CloudUpload, DeleteOutline } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { lessonPlansAPI, documentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface LessonPlan {
  subject: string;
  grade: string;
  topic: string;
  duration: number;
  objectives: string[];
  activities: string[];
  resources: string[];
  assessment: string;
}

const LessonPlanGenerator: React.FC = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [uploadedTemplate, setUploadedTemplate] = useState<any>(null);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan>({
    subject: '',
    grade: '',
    topic: '',
    duration: 40,
    objectives: [''],
    activities: [''],
    resources: [''],
    assessment: '',
  });

  const steps = [
    'Basic Information',
    'Learning Objectives',
    'Activities & Resources',
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

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (field: keyof LessonPlan, value: any) => {
    setLessonPlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addArrayItem = (field: 'objectives' | 'activities' | 'resources') => {
    setLessonPlan(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayItem = (field: 'objectives' | 'activities' | 'resources', index: number, value: string) => {
    setLessonPlan(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleGenerateWithAI = async () => {
    if (!lessonPlan.subject || !lessonPlan.grade || !lessonPlan.topic) {
      toast.error('Please fill in subject, grade, and topic before generating');
      return;
    }

    setLoading(true);
    try {
      const contextData: any = {
        subject: lessonPlan.subject,
        grade: lessonPlan.grade,
        topic: lessonPlan.topic,
        duration: lessonPlan.duration,
      };

      // If we have a template, add it to the context
      if (uploadedTemplate) {
        contextData.context = `Please follow the format and structure from the uploaded template document: ${uploadedTemplate.filename}. Use the same sections, formatting style, and criteria as shown in the template.`;
      }

      const response = await lessonPlansAPI.generateWithAI(contextData);

      if (response.data.success) {
        setGeneratedPlan(response.data.data);
        toast.success('AI lesson plan generated successfully!');
        setActiveStep(steps.length); // Move to a completion step
      } else {
        toast.error('Failed to generate lesson plan');
      }
    } catch (error) {
      console.error('Error generating lesson plan:', error);
      toast.error('Failed to generate lesson plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGenerate = async () => {
    // Quick generation from basic info
    if (!lessonPlan.subject || !lessonPlan.grade || !lessonPlan.topic) {
      toast.error('Please fill in subject, grade, and topic');
      return;
    }

    await handleGenerateWithAI();
  };

  const handleSaveLessonPlan = async () => {
    if (!generatedPlan || !user) {
      toast.error('Please generate a lesson plan first and ensure you are logged in');
      return;
    }

    setSaving(true);
    try {
      const response = await lessonPlansAPI.create({
        title: generatedPlan.title,
        subject: generatedPlan.subject,
        grade: generatedPlan.grade,
        duration: generatedPlan.duration,
        learningOutcomes: generatedPlan.learningOutcomes,
        coreCompetencies: generatedPlan.coreCompetencies,
        values: generatedPlan.values,
        keyInquiryQuestions: generatedPlan.keyInquiryQuestions,
        learningExperiences: generatedPlan.learningExperiences,
        assessmentCriteria: generatedPlan.assessmentCriteria,
        resources: generatedPlan.resources,
        reflection: generatedPlan.reflection,
        createdBy: user.id,
      });

      if (response.data.success) {
        toast.success('Lesson plan saved successfully!');
      } else {
        toast.error('Failed to save lesson plan');
      }
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      toast.error('Failed to save lesson plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportToDOCX = async () => {
    if (!generatedPlan) {
      toast.error('Please generate a lesson plan first');
      return;
    }

    setExporting(true);
    try {
      // For now, we'll create a simple text export
      // In production, you would implement proper DOCX generation
      const content = `
CBC LESSON PLAN

Title: ${generatedPlan.title}
Subject: ${generatedPlan.subject}
Grade: ${generatedPlan.grade}
Duration: ${generatedPlan.duration} minutes

LEARNING OUTCOMES:
${generatedPlan.learningOutcomes?.map((outcome: string, index: number) => `${index + 1}. ${outcome}`).join('\n') || 'None specified'}

CORE COMPETENCIES:
${generatedPlan.coreCompetencies?.join(', ') || 'None specified'}

VALUES:
${generatedPlan.values?.join(', ') || 'None specified'}

KEY INQUIRY QUESTIONS:
${generatedPlan.keyInquiryQuestions?.map((question: string, index: number) => `${index + 1}. ${question}`).join('\n') || 'None specified'}

LEARNING EXPERIENCES:
${generatedPlan.learningExperiences?.map((exp: any, index: number) => `
${index + 1}. ${exp.activity}
   Duration: ${exp.duration}
   Method: ${exp.methodology}
   Materials: ${Array.isArray(exp.materials) ? exp.materials.join(', ') : exp.materials}
`).join('\n') || 'None specified'}

ASSESSMENT CRITERIA:
${generatedPlan.assessmentCriteria?.map((assessment: any, index: number) => `
${index + 1}. Type: ${assessment.type}
   Method: ${assessment.method}
   Criteria: ${assessment.criteria}
`).join('\n') || 'None specified'}

RESOURCES:
${generatedPlan.resources?.join(', ') || 'None specified'}

REFLECTION:
${generatedPlan.reflection || 'None provided'}
      `;

      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedPlan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_lesson_plan.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Lesson plan exported successfully!');
    } catch (error) {
      console.error('Error exporting lesson plan:', error);
      toast.error('Failed to export lesson plan. Please try again.');
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
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      const supportedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'];
      
      // Validate file type
      const isValidType = supportedTypes.includes(file.type) || 
                         supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValidType) {
        toast.error('Please upload a PDF, Word document, text file, or Excel file');
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
      formData.append('type', 'lesson-plan-template');
      formData.append('description', 'Lesson plan template for AI generation');

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
                  value={lessonPlan.subject}
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
                  value={lessonPlan.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                >
                  {cbcGrades.map(grade => (
                    <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Lesson Topic"
                value={lessonPlan.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="Enter the main topic for this lesson"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={lessonPlan.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
              Learning Objectives
            </Typography>
            {lessonPlan.objectives.map((objective, index) => (
              <TextField
                key={index}
                fullWidth
                multiline
                rows={2}
                label={`Objective ${index + 1}`}
                value={objective}
                onChange={(e) => updateArrayItem('objectives', index, e.target.value)}
                sx={{ mb: 2 }}
              />
            ))}
            <Button onClick={() => addArrayItem('objectives')}>
              Add Objective
            </Button>
          </Box>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                <Groups sx={{ mr: 1, verticalAlign: 'middle' }} />
                Learning Activities
              </Typography>
              {lessonPlan.activities.map((activity, index) => (
                <TextField
                  key={index}
                  fullWidth
                  multiline
                  rows={3}
                  label={`Activity ${index + 1}`}
                  value={activity}
                  onChange={(e) => updateArrayItem('activities', index, e.target.value)}
                  sx={{ mb: 2 }}
                />
              ))}
              <Button onClick={() => addArrayItem('activities')}>
                Add Activity
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                <AutoStories sx={{ mr: 1, verticalAlign: 'middle' }} />
                Resources Needed
              </Typography>
              {lessonPlan.resources.map((resource, index) => (
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
              Assessment Method
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="How will you assess student learning?"
              value={lessonPlan.assessment}
              onChange={(e) => handleInputChange('assessment', e.target.value)}
              placeholder="Describe your assessment strategy..."
            />
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  const renderGeneratedPlan = () => {
    if (!generatedPlan) return null;

    return (
      <Paper sx={{ p: 4, mt: 3, backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography variant="h4" gutterBottom color="primary">
          🎉 Generated CBC Lesson Plan
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {generatedPlan.title}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Chip label={`${generatedPlan.subject}`} color="primary" sx={{ mr: 1, mb: 1 }} />
              <Chip label={`${generatedPlan.grade}`} color="secondary" sx={{ mr: 1, mb: 1 }} />
              <Chip label={`${generatedPlan.duration} minutes`} variant="outlined" sx={{ mr: 1, mb: 1 }} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Learning Outcomes</Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {generatedPlan.learningOutcomes?.map((outcome: string, index: number) => (
                <li key={index}>
                  <Typography>{outcome}</Typography>
                </li>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Core Competencies</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {generatedPlan.coreCompetencies?.map((competency: string, index: number) => (
                <Chip key={index} label={competency} variant="outlined" size="small" />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Values</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {generatedPlan.values?.map((value: string, index: number) => (
                <Chip key={index} label={value} color="secondary" variant="outlined" size="small" />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Key Inquiry Questions</Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {generatedPlan.keyInquiryQuestions?.map((question: string, index: number) => (
                <li key={index}>
                  <Typography>{question}</Typography>
                </li>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Learning Experiences</Typography>
            <Box sx={{ mt: 2 }}>
              {generatedPlan.learningExperiences?.map((experience: any, index: number) => (
                <Paper key={index} sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle1" fontWeight="bold">{experience.activity}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {experience.duration} | Method: {experience.methodology}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Materials: {Array.isArray(experience.materials) ? experience.materials.join(', ') : experience.materials}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Assessment Criteria</Typography>
            <Box sx={{ mt: 2 }}>
              {generatedPlan.assessmentCriteria?.map((assessment: any, index: number) => (
                <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: '#f0f8ff' }}>
                  <Typography variant="subtitle2" fontWeight="bold">{assessment.type}</Typography>
                  <Typography variant="body2">{assessment.method}</Typography>
                  <Typography variant="body2" color="text.secondary">{assessment.criteria}</Typography>
                </Paper>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Resources</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {generatedPlan.resources?.map((resource: string, index: number) => (
                <Chip key={index} label={resource} variant="outlined" />
              ))}
            </Box>
            {generatedPlan.reflection && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Reflection Notes</Typography>
                <Paper sx={{ p: 2, backgroundColor: '#fff3e0' }}>
                  <Typography variant="body2">{generatedPlan.reflection}</Typography>
                </Paper>
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                onClick={handleSaveLessonPlan}
                disabled={saving || !user}
              >
                {saving ? 'Saving...' : 'Save Lesson Plan'}
              </Button>
              <Button 
                variant="contained" 
                color="secondary"
                startIcon={exporting ? <CircularProgress size={20} /> : <Download />}
                onClick={handleExportToDOCX}
                disabled={exporting}
              >
                {exporting ? 'Exporting...' : 'Export to TXT'}
              </Button>
              <Button variant="outlined" onClick={() => {
                setGeneratedPlan(null);
                setActiveStep(0);
              }}>
                Create Another Plan
              </Button>
            </Box>
            {!user && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please log in to save lesson plans to your account.
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
          CBC Lesson Plan Generator
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Create comprehensive lesson plans aligned with CBC curriculum standards
        </Typography>

        {/* Template Upload Section */}
        <Card sx={{ mb: 4, border: '2px dashed #1976d2', backgroundColor: '#f8f9ff' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📄 Upload Lesson Plan Template (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload a sample lesson plan in PDF, Word, text, or Excel format to ensure all generated plans follow the same format and criteria.
            </Typography>
            
            {!uploadedTemplate ? (
              <Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <Box
                    component="input"
                    id="template-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                    <strong>Tip:</strong> Upload a well-structured lesson plan in PDF, Word (.doc/.docx), text (.txt), or Excel (.xls/.xlsx) format that includes all the sections you want in your generated plans (learning outcomes, activities, assessments, etc.)
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
                    All generated lesson plans will follow the format and criteria from your uploaded template.
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
          {activeStep === 0 && lessonPlan.subject && lessonPlan.grade && lessonPlan.topic && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>
                  Ready to generate? You can create an AI-powered lesson plan now or continue customizing.
                  {uploadedTemplate && ' 📄 Using your uploaded template format!'}
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

      {/* Display Generated Lesson Plan */}
      {renderGeneratedPlan()}
    </Container>
  );
};

export default LessonPlanGenerator;
