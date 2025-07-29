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
} from '@mui/material';
import { AutoStories, Psychology, Groups, Assessment } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { lessonPlansAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { lessonPlansAPI } from '../../services/api';

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
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
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
      const response = await lessonPlansAPI.generateWithAI({
        subject: lessonPlan.subject,
        grade: lessonPlan.grade,
        topic: lessonPlan.topic,
        duration: lessonPlan.duration,
      });

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
      <Paper sx={{ p: 4, mt: 3 }}>
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

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button variant="contained" color="primary">
                Export to DOCX
              </Button>
              <Button variant="outlined" onClick={() => {
                setGeneratedPlan(null);
                setActiveStep(0);
              }}>
                Create Another Plan
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          CBC Lesson Plan Generator
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Create comprehensive lesson plans aligned with CBC curriculum standards
        </Typography>

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
