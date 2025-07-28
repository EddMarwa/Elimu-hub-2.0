import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AutoAwesome,
  ExpandMore,
  Download,
  Preview,
  Edit,
  Add,
  Delete,
  School,
  AccessTime,
  Assignment,
  Psychology,
  Favorite,
  QuestionAnswer,
  Extension,
  Assessment
} from '@mui/icons-material';
import axios from 'axios';

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration: number;
  learningOutcomes: string[];
  coreCompetencies: string[];
  values: string[];
  keyInquiryQuestions: string[];
  learningExperiences: LearningExperience[];
  assessmentCriteria: AssessmentCriteria[];
  resources: string[];
  reflection: string;
}

interface LearningExperience {
  id: string;
  activity: string;
  duration: number;
  methodology: string;
  resources: string[];
  assessment: string;
}

interface AssessmentCriteria {
  id: string;
  criterion: string;
  exceeding: string;
  meeting: string;
  approaching: string;
  below: string;
}

const LessonPlanGenerator: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [lessonPlan, setLessonPlan] = useState<Partial<LessonPlan>>({
    title: '',
    subject: '',
    grade: '',
    duration: 40,
    learningOutcomes: [],
    coreCompetencies: [],
    values: [],
    keyInquiryQuestions: [],
    learningExperiences: [],
    assessmentCriteria: [],
    resources: [],
    reflection: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cbcStandards, setCbcStandards] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [curriculumReferences, setCurriculumReferences] = useState<any[]>([]);

  const steps = [
    'Basic Information',
    'Learning Outcomes',
    'Core Competencies & Values',
    'Learning Experiences',
    'Assessment',
    'Resources & Review'
  ];

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

  useEffect(() => {
    fetchCBCStandards();
  }, []);

  const fetchCBCStandards = async () => {
    try {
      const response = await axios.get('/api/lesson-plans/cbc-standards');
      setCbcStandards(response.data.data);
    } catch (error) {
      console.error('Failed to fetch CBC standards:', error);
    }
  };

  const generateLessonPlan = async () => {
    if (!lessonPlan.subject || !lessonPlan.grade || !lessonPlan.title) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/lesson-plans/generate', {
        subject: lessonPlan.subject,
        grade: lessonPlan.grade,
        topic: lessonPlan.title,
        duration: lessonPlan.duration
      });

      const generatedPlan = response.data.data.lessonPlan;
      setCurriculumReferences(response.data.data.curriculumReferences || []);
      
      setLessonPlan(generatedPlan);
      setActiveStep(1); // Move to next step
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate lesson plan');
    } finally {
      setLoading(false);
    }
  };

  const exportLessonPlan = async (format: 'docx' | 'pdf') => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/lesson-plans/${lessonPlan.id}/export`, {
        format,
        lessonPlan
      });

      // Trigger download
      window.open(response.data.data.downloadUrl, '_blank');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const updateLessonPlan = (field: string, value: any) => {
    setLessonPlan(prev => ({ ...prev, [field]: value }));
  };

  const addListItem = (field: string, item: string) => {
    if (!item.trim()) return;
    const currentList = lessonPlan[field as keyof LessonPlan] as string[] || [];
    updateLessonPlan(field, [...currentList, item.trim()]);
  };

  const removeListItem = (field: string, index: number) => {
    const currentList = lessonPlan[field as keyof LessonPlan] as string[] || [];
    updateLessonPlan(field, currentList.filter((_, i) => i !== index));
  };

  const renderBasicInformation = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <School /> Basic Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Lesson Title/Topic *"
              value={lessonPlan.title}
              onChange={(e) => updateLessonPlan('title', e.target.value)}
              placeholder="e.g., Introduction to Fractions"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Subject *</InputLabel>
              <Select
                value={lessonPlan.subject}
                onChange={(e) => updateLessonPlan('subject', e.target.value)}
                label="Subject *"
              >
                {subjects.map(subject => (
                  <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Grade *</InputLabel>
              <Select
                value={lessonPlan.grade}
                onChange={(e) => updateLessonPlan('grade', e.target.value)}
                label="Grade *"
              >
                {grades.map(grade => (
                  <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={lessonPlan.duration}
              onChange={(e) => updateLessonPlan('duration', parseInt(e.target.value))}
              InputProps={{
                startAdornment: <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={generateLessonPlan}
            disabled={loading || !lessonPlan.subject || !lessonPlan.grade || !lessonPlan.title}
            startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
          >
            Generate CBC-Compliant Lesson Plan
          </Button>
        </Box>

        {curriculumReferences.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              📚 Curriculum References Used:
            </Typography>
            {curriculumReferences.map((ref, index) => (
              <Chip
                key={index}
                label={`${ref.source} (${Math.round(ref.similarity * 100)}% match)`}
                size="small"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderLearningOutcomes = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment /> Learning Outcomes
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Define what learners should know, understand, and be able to do by the end of the lesson.
        </Typography>

        <EditableList
          items={lessonPlan.learningOutcomes || []}
          onAdd={(item) => addListItem('learningOutcomes', item)}
          onRemove={(index) => removeListItem('learningOutcomes', index)}
          placeholder="e.g., By the end of the lesson, learners will be able to identify equivalent fractions"
          label="Learning Outcome"
        />
      </CardContent>
    </Card>
  );

  const renderCompetenciesAndValues = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology /> Core Competencies
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {cbcStandards?.coreCompetencies?.map((competency: string) => (
                <Chip
                  key={competency}
                  label={competency}
                  clickable
                  color={lessonPlan.coreCompetencies?.includes(competency) ? 'primary' : 'default'}
                  onClick={() => {
                    const current = lessonPlan.coreCompetencies || [];
                    if (current.includes(competency)) {
                      updateLessonPlan('coreCompetencies', current.filter(c => c !== competency));
                    } else {
                      updateLessonPlan('coreCompetencies', [...current, competency]);
                    }
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Favorite /> Values
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {cbcStandards?.values?.map((value: string) => (
                <Chip
                  key={value}
                  label={value}
                  clickable
                  color={lessonPlan.values?.includes(value) ? 'secondary' : 'default'}
                  onClick={() => {
                    const current = lessonPlan.values || [];
                    if (current.includes(value)) {
                      updateLessonPlan('values', current.filter(v => v !== value));
                    } else {
                      updateLessonPlan('values', [...current, value]);
                    }
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <QuestionAnswer /> Key Inquiry Questions
            </Typography>
            
            <EditableList
              items={lessonPlan.keyInquiryQuestions || []}
              onAdd={(item) => addListItem('keyInquiryQuestions', item)}
              onRemove={(index) => removeListItem('keyInquiryQuestions', index)}
              placeholder="e.g., What do you notice about these fractions?"
              label="Inquiry Question"
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderLearningOutcomes();
      case 2:
        return renderCompetenciesAndValues();
      default:
        return <Typography>Step content for step {step}</Typography>;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        🧠 CBC Lesson Plan Generator
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Create comprehensive, CBC-compliant lesson plans with curriculum-aware suggestions and smart content generation.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Progress Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStepContent(activeStep)}

      {/* Navigation */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={() => setActiveStep(prev => prev - 1)}
        >
          Back
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {lessonPlan.id && (
            <>
              <Button
                variant="outlined"
                onClick={() => setPreviewOpen(true)}
                startIcon={<Preview />}
              >
                Preview
              </Button>
              <Button
                variant="outlined"
                onClick={() => exportLessonPlan('docx')}
                startIcon={<Download />}
              >
                Export DOCX
              </Button>
              <Button
                variant="outlined"
                onClick={() => exportLessonPlan('pdf')}
                startIcon={<Download />}
              >
                Export PDF
              </Button>
            </>
          )}
          
          {activeStep < steps.length - 1 && (
            <Button
              variant="contained"
              onClick={() => setActiveStep(prev => prev + 1)}
              disabled={!lessonPlan.id}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Reusable component for editable lists
interface EditableListProps {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  label: string;
}

const EditableList: React.FC<EditableListProps> = ({ items, onAdd, onRemove, placeholder, label }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem);
      setNewItem('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button
          variant="outlined"
          onClick={handleAdd}
          startIcon={<Add />}
          disabled={!newItem.trim()}
        >
          Add
        </Button>
      </Box>
      
      <List dense>
        {items.map((item, index) => (
          <ListItem
            key={index}
            sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}
            secondaryAction={
              <IconButton edge="end" onClick={() => onRemove(index)} size="small">
                <Delete />
              </IconButton>
            }
          >
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
      
      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No {label.toLowerCase()}s added yet. Use the form above to add some.
        </Typography>
      )}
    </Box>
  );
};

export default LessonPlanGenerator;