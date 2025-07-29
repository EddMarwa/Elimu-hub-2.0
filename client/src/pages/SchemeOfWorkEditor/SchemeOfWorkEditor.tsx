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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Fab,
  Container,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  LinearProgress,
  Switch,
  FormControlLabel,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Download,
  Preview,
  AutoAwesome,
  ExpandMore,
  School,
  CalendarToday,
  Assignment,
  Psychology,
  Favorite,
  Assessment,
  MenuBook,
  Schedule,
  Extension,
  Flag,
  CheckCircle,
  TrendingUp,
  Share,
  ContentCopy,
  Refresh,
  ImportExport,
  Dashboard,
  Lightbulb,
  Group
} from '@mui/icons-material';

interface SchemeOfWork {
  id?: string;
  title: string;
  subject: string;
  grade: string;
  term: string;
  totalWeeks: number;
  learningAreas: LearningArea[];
  assessmentSchedule: AssessmentItem[];
  resources: string[];
  competencies: string[];
  values: string[];
  terminalObjectives: string[];
  generalObjectives: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface LearningArea {
  id: string;
  week: number;
  topic: string;
  subtopic: string;
  specificObjectives: string[];
  keyInquiryQuestions: string[];
  learningExperiences: string[];
  coreCompetencies: string[];
  pertinentIssues: string[];
  values: string[];
  assessmentMethods: string[];
  resources: string[];
  duration: number;
}

interface AssessmentItem {
  id: string;
  week: number;
  type: 'formative' | 'summative';
  title: string;
  description: string;
  competencies: string[];
  marks?: number;
}

const SchemeOfWorkEditor: React.FC = () => {
  const [scheme, setScheme] = useState<SchemeOfWork>({
    title: '',
    subject: '',
    grade: '',
    term: '',
    totalWeeks: 12,
    learningAreas: [],
    assessmentSchedule: [],
    resources: [],
    competencies: [],
    values: [],
    terminalObjectives: [],
    generalObjectives: []
  });

  const [currentWeek, setCurrentWeek] = useState(1);
  const [editingWeek, setEditingWeek] = useState<LearningArea | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'table' | 'cards'>('timeline');
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [savedSchemes, setSavedSchemes] = useState<SchemeOfWork[]>([]);

  const subjects = [
    'English', 'Kiswahili', 'Mathematics', 'Science & Technology',
    'Social Studies', 'Creative Arts', 'Physical Education',
    'Religious Education', 'Life Skills', 'Computer Science'
  ];

  const grades = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'
  ];

  const terms = ['Term 1', 'Term 2', 'Term 3'];

  const cbcCompetencies = [
    'Communication and Collaboration',
    'Critical Thinking and Problem Solving',
    'Creativity and Imagination',
    'Citizenship and Social Responsibility',
    'Digital Literacy',
    'Learning to Learn',
    'Self-Efficacy'
  ];

  const cbcValues = [
    'Love', 'Responsibility', 'Respect', 'Unity', 'Peace',
    'Patriotism', 'Social Justice', 'Integrity'
  ];

  const pertinentIssues = [
    'Education for Sustainable Development',
    'Safety and Security Education',
    'Disaster Risk Reduction',
    'Child Protection',
    'Financial Literacy',
    'Life Skills Education',
    'Citizenship Education',
    'Social Cohesion and National Unity'
  ];

  // Initialize weeks when basic info changes
  useEffect(() => {
    if (scheme.totalWeeks > 0 && scheme.learningAreas.length !== scheme.totalWeeks) {
      const newLearningAreas: LearningArea[] = Array.from({ length: scheme.totalWeeks }, (_, index) => ({
        id: `week-${index + 1}`,
        week: index + 1,
        topic: '',
        subtopic: '',
        specificObjectives: [],
        keyInquiryQuestions: [],
        learningExperiences: [],
        coreCompetencies: [],
        pertinentIssues: [],
        values: [],
        assessmentMethods: [],
        resources: [],
        duration: 5 // days per week
      }));
      
      setScheme(prev => ({
        ...prev,
        learningAreas: newLearningAreas
      }));
    }
  }, [scheme.totalWeeks]);

  const updateScheme = (field: string, value: any) => {
    setScheme(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateLearningArea = (weekIndex: number, field: string, value: any) => {
    setScheme(prev => ({
      ...prev,
      learningAreas: prev.learningAreas.map((area, index) =>
        index === weekIndex ? { ...area, [field]: value } : area
      )
    }));
  };

  const openWeekEditor = (week: LearningArea) => {
    setEditingWeek({ ...week });
    setDialogOpen(true);
  };

  const saveWeekChanges = () => {
    if (editingWeek) {
      const weekIndex = editingWeek.week - 1;
      setScheme(prev => ({
        ...prev,
        learningAreas: prev.learningAreas.map((area, index) =>
          index === weekIndex ? editingWeek : area
        )
      }));
    }
    setDialogOpen(false);
    setEditingWeek(null);
  };

  const generateSuggestions = async (week: number) => {
    if (!scheme.subject || !scheme.grade) return;

    setIsGenerating(true);
    try {
      // Simulate API call for suggestions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock suggestions based on week and subject
      const mockSuggestions = {
        topic: `${scheme.subject} Week ${week} Topic`,
        objectives: [
          `Learn fundamental concepts of ${scheme.subject}`,
          `Apply knowledge in practical scenarios`,
          `Demonstrate understanding through activities`
        ],
        experiences: [
          'Interactive group discussions',
          'Hands-on practical activities',
          'Individual reflection exercises'
        ]
      };

      // Apply suggestions to current week
      const weekIndex = week - 1;
      if (weekIndex < scheme.learningAreas.length) {
        updateLearningArea(weekIndex, 'topic', mockSuggestions.topic);
        updateLearningArea(weekIndex, 'specificObjectives', mockSuggestions.objectives);
        updateLearningArea(weekIndex, 'learningExperiences', mockSuggestions.experiences);
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportScheme = (format: 'pdf' | 'docx' | 'excel') => {
    console.log(`Exporting scheme as ${format}...`);
    // Implement export functionality
  };

  const saveScheme = () => {
    const newScheme = {
      ...scheme,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSavedSchemes(prev => [...prev, newScheme]);
    // Here you would typically save to backend
  };

  const calculateProgress = () => {
    const completedWeeks = scheme.learningAreas.filter(week => 
      week.topic && week.specificObjectives.length > 0
    ).length;
    return (completedWeeks / scheme.totalWeeks) * 100;
  };

  const renderTimelineView = () => (
    <Grid container spacing={2}>
      {scheme.learningAreas.map((week, index) => (
        <Grid item xs={12} key={week.id}>
          <Card 
            elevation={week.topic ? 2 : 1} 
            sx={{ 
              cursor: 'pointer',
              '&:hover': { elevation: 3 },
              border: week.topic ? '1px solid #1976d2' : '1px solid #e0e0e0',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 24,
                top: 0,
                bottom: 0,
                width: 2,
                background: week.topic ? '#1976d2' : '#e0e0e0'
              }
            }}
            onClick={() => openWeekEditor(week)}
          >
            <CardContent sx={{ pl: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="primary">
                  Week {week.week}
                </Typography>
                <Avatar sx={{ bgcolor: week.topic ? 'success.main' : 'grey.400' }}>
                  {week.topic ? <CheckCircle /> : <Schedule />}
                </Avatar>
              </Box>
              
              <Typography variant="h6" component="h3">
                {week.topic || `Week ${week.week} - Plan Needed`}
              </Typography>
              {week.subtopic && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {week.subtopic}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip size="small" label={`${week.specificObjectives.length} objectives`} />
                <Chip size="small" label={`${week.learningExperiences.length} activities`} />
                <Chip size="small" label={`${week.coreCompetencies.length} competencies`} />
              </Box>
              {week.topic && (
                <LinearProgress 
                  variant="determinate" 
                  value={85} 
                  sx={{ mt: 2, height: 6, borderRadius: 3 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderTableView = () => (
    <TableContainer component={Paper} elevation={2}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Week</TableCell>
            <TableCell>Topic</TableCell>
            <TableCell>Subtopic</TableCell>
            <TableCell>Objectives</TableCell>
            <TableCell>Competencies</TableCell>
            <TableCell>Assessment</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {scheme.learningAreas.map((week) => (
            <TableRow key={week.id} hover>
              <TableCell>
                <Badge badgeContent={week.week} color="primary">
                  <Avatar sx={{ bgcolor: week.topic ? 'primary.main' : 'grey.400' }}>
                    {week.topic ? <CheckCircle /> : <Schedule />}
                  </Avatar>
                </Badge>
              </TableCell>
              <TableCell>
                <Typography variant="body1" fontWeight={week.topic ? 'bold' : 'normal'}>
                  {week.topic || 'Not planned'}
                </Typography>
              </TableCell>
              <TableCell>{week.subtopic || '-'}</TableCell>
              <TableCell>
                <Chip label={week.specificObjectives.length} size="small" />
              </TableCell>
              <TableCell>
                <Chip label={week.coreCompetencies.length} size="small" color="secondary" />
              </TableCell>
              <TableCell>
                <Chip label={week.assessmentMethods.length} size="small" color="success" />
              </TableCell>
              <TableCell>
                <IconButton onClick={() => openWeekEditor(week)} color="primary">
                  <Edit />
                </IconButton>
                <IconButton onClick={() => generateSuggestions(week.week)} disabled={isGenerating}>
                  <AutoAwesome />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCardsView = () => (
    <Grid container spacing={3}>
      {scheme.learningAreas.map((week) => (
        <Grid item xs={12} sm={6} md={4} key={week.id}>
          <Card 
            elevation={week.topic ? 3 : 1}
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              '&:hover': { elevation: 4 },
              border: week.topic ? '2px solid #1976d2' : '1px solid #e0e0e0'
            }}
            onClick={() => openWeekEditor(week)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="primary">
                  Week {week.week}
                </Typography>
                <Avatar sx={{ bgcolor: week.topic ? 'success.main' : 'grey.400' }}>
                  {week.topic ? <CheckCircle /> : <Schedule />}
                </Avatar>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                {week.topic || 'Plan Required'}
              </Typography>
              
              {week.subtopic && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {week.subtopic}
                </Typography>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" display="block">Progress</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={week.topic ? 75 : 0} 
                  sx={{ height: 6, borderRadius: 3, mt: 1 }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                <Chip size="small" label={`${week.specificObjectives.length} obj`} />
                <Chip size="small" label={`${week.coreCompetencies.length} comp`} />
                <Chip size="small" label={`${week.values.length} val`} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)', color: 'white' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            📋 CBC Scheme of Work Editor
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Plan and organize your term curriculum following CBC guidelines
          </Typography>
          
          {/* Progress Bar */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">Term Planning Progress</Typography>
              <Typography variant="body2">{Math.round(calculateProgress())}% Complete</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={calculateProgress()} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white'
                }
              }}
            />
          </Box>
        </Paper>

        <Grid container spacing={4}>
          {/* Scheme Setup */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School color="primary" />
                Scheme Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Scheme Title"
                    value={scheme.title}
                    onChange={(e) => updateScheme('title', e.target.value)}
                    placeholder="e.g., Mathematics Term 1 2024"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Subject</InputLabel>
                    <Select
                      value={scheme.subject}
                      onChange={(e) => updateScheme('subject', e.target.value)}
                      label="Subject"
                    >
                      {subjects.map(subject => (
                        <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Grade</InputLabel>
                    <Select
                      value={scheme.grade}
                      onChange={(e) => updateScheme('grade', e.target.value)}
                      label="Grade"
                    >
                      {grades.map(grade => (
                        <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Term</InputLabel>
                    <Select
                      value={scheme.term}
                      onChange={(e) => updateScheme('term', e.target.value)}
                      label="Term"
                    >
                      {terms.map(term => (
                        <MenuItem key={term} value={term}>{term}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Total Weeks"
                    type="number"
                    value={scheme.totalWeeks}
                    onChange={(e) => updateScheme('totalWeeks', parseInt(e.target.value) || 12)}
                    inputProps={{ min: 1, max: 20 }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* View Controls */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="h6">Week Planning</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoSuggest}
                        onChange={(e) => setAutoSuggest(e.target.checked)}
                      />
                    }
                    label="Auto-suggestions"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('timeline')}
                    startIcon={<Assignment />}
                  >
                    List
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('table')}
                    startIcon={<Dashboard />}
                  >
                    Table
                  </Button>
                  <Button
                    variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('cards')}
                    startIcon={<Assignment />}
                  >
                    Cards
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              {viewMode === 'timeline' && renderTimelineView()}
              {viewMode === 'table' && renderTableView()}
              {viewMode === 'cards' && renderCardsView()}
            </Paper>
          </Grid>
        </Grid>

        {/* Floating Action Buttons */}
        <SpeedDial
          ariaLabel="Scheme Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<Save />}
            tooltipTitle="Save Scheme"
            onClick={saveScheme}
          />
          <SpeedDialAction
            icon={<Download />}
            tooltipTitle="Export PDF"
            onClick={() => exportScheme('pdf')}
          />
          <SpeedDialAction
            icon={<ImportExport />}
            tooltipTitle="Export Excel"
            onClick={() => exportScheme('excel')}
          />
          <SpeedDialAction
            icon={<Share />}
            tooltipTitle="Share"
            onClick={() => console.log('Share scheme')}
          />
        </SpeedDial>

        {/* Week Editor Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Edit Week {editingWeek?.week} - {editingWeek?.topic || 'New Topic'}
          </DialogTitle>
          <DialogContent>
            {editingWeek && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Topic"
                    value={editingWeek.topic}
                    onChange={(e) => setEditingWeek({ ...editingWeek, topic: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Subtopic"
                    value={editingWeek.subtopic}
                    onChange={(e) => setEditingWeek({ ...editingWeek, subtopic: e.target.value })}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Specific Objectives</Typography>
                  <ArrayEditor
                    items={editingWeek.specificObjectives}
                    onChange={(items) => setEditingWeek({ ...editingWeek, specificObjectives: items })}
                    placeholder="Add specific learning objective..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Core Competencies</Typography>
                  <Autocomplete
                    multiple
                    options={cbcCompetencies}
                    value={editingWeek.coreCompetencies}
                    onChange={(_, newValue) => setEditingWeek({ ...editingWeek, coreCompetencies: newValue })}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Select competencies" />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Values</Typography>
                  <Autocomplete
                    multiple
                    options={cbcValues}
                    value={editingWeek.values}
                    onChange={(_, newValue) => setEditingWeek({ ...editingWeek, values: newValue })}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Select values" />
                    )}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveWeekChanges} startIcon={<Save />}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

// Helper component for editing arrays
interface ArrayEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}

const ArrayEditor: React.FC<ArrayEditorProps> = ({ items, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onChange([...items, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
        />
        <Button onClick={handleAdd} disabled={!inputValue.trim()}>
          <Add />
        </Button>
      </Box>
      
      <List dense>
        {items.map((item, index) => (
          <ListItem
            key={index}
            sx={{ px: 0, py: 0.5 }}
            secondaryAction={
              <IconButton size="small" onClick={() => handleRemove(index)}>
                <Delete />
              </IconButton>
            }
          >
            <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default SchemeOfWorkEditor;
