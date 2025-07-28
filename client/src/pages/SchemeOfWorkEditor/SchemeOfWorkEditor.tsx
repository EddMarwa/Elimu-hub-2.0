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
  Fab
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
  MenuBook
} from '@mui/icons-material';
import axios from 'axios';

interface WeeklyPlan {
  week: number;
  topic: string;
  subTopics: string[];
  learningOutcomes: string[];
  keyInquiryQuestions: string[];
  learningExperiences: string[];
  coreCompetencies: string[];
  values: string[];
  assessmentMethods: string[];
  resources: string[];
}

interface SchemeOfWork {
  id?: string;
  title: string;
  subject: string;
  grade: string;
  term: number;
  weeks: WeeklyPlan[];
  overallObjectives: string[];
  coreCompetencies: string[];
  values: string[];
}

const SchemeOfWorkEditor: React.FC = () => {
  const [scheme, setScheme] = useState<SchemeOfWork>({
    title: '',
    subject: '',
    grade: '',
    term: 1,
    weeks: [],
    overallObjectives: [],
    coreCompetencies: [],
    values: []
  });
  const [editingWeek, setEditingWeek] = useState<WeeklyPlan | null>(null);
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [template, setTemplate] = useState<any>(null);

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

  const terms = [1, 2, 3];

  const cbcCoreCompetencies = [
    'Communication and Collaboration',
    'Critical Thinking and Problem Solving',
    'Imagination and Creativity',
    'Citizenship',
    'Digital Literacy',
    'Learning to Learn',
    'Self-Efficacy'
  ];

  const cbcValues = [
    'Love',
    'Responsibility',
    'Respect',
    'Unity',
    'Peace',
    'Patriotism',
    'Social Justice'
  ];

  useEffect(() => {
    if (scheme.subject && scheme.grade && scheme.term) {
      fetchTemplate();
    }
  }, [scheme.subject, scheme.grade, scheme.term]);

  const fetchTemplate = async () => {
    try {
      const response = await axios.get('/api/schemes/template', {
        params: {
          subject: scheme.subject,
          grade: scheme.grade,
          term: scheme.term
        }
      });
      setTemplate(response.data.data);
    } catch (error) {
      console.error('Failed to fetch template:', error);
    }
  };

  const generateScheme = async () => {
    if (!scheme.subject || !scheme.grade || !scheme.term) {
      setError('Please fill in subject, grade, and term');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/schemes/generate', {
        subject: scheme.subject,
        grade: scheme.grade,
        term: scheme.term,
        weeks: 12
      });

      const generatedScheme = response.data.data.schemeOfWork;
      setScheme(generatedScheme);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate scheme');
    } finally {
      setLoading(false);
    }
  };

  const addWeek = () => {
    const newWeek: WeeklyPlan = {
      week: scheme.weeks.length + 1,
      topic: '',
      subTopics: [],
      learningOutcomes: [],
      keyInquiryQuestions: [],
      learningExperiences: [],
      coreCompetencies: [],
      values: [],
      assessmentMethods: [],
      resources: []
    };
    setEditingWeek(newWeek);
    setWeekDialogOpen(true);
  };

  const editWeek = (week: WeeklyPlan) => {
    setEditingWeek({ ...week });
    setWeekDialogOpen(true);
  };

  const saveWeek = () => {
    if (!editingWeek) return;

    const updatedWeeks = [...scheme.weeks];
    const existingIndex = updatedWeeks.findIndex(w => w.week === editingWeek.week);

    if (existingIndex >= 0) {
      updatedWeeks[existingIndex] = editingWeek;
    } else {
      updatedWeeks.push(editingWeek);
    }

    setScheme(prev => ({ ...prev, weeks: updatedWeeks.sort((a, b) => a.week - b.week) }));
    setWeekDialogOpen(false);
    setEditingWeek(null);
  };

  const deleteWeek = (weekNumber: number) => {
    setScheme(prev => ({
      ...prev,
      weeks: prev.weeks.filter(w => w.week !== weekNumber)
    }));
  };

  const exportScheme = async (format: 'docx' | 'pdf') => {
    if (!scheme.id) {
      setError('Please save the scheme first');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/api/schemes/${scheme.id}/export`, {
        format,
        schemeOfWork: scheme
      });

      window.open(response.data.data.downloadUrl, '_blank');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const updateEditingWeek = (field: keyof WeeklyPlan, value: any) => {
    if (!editingWeek) return;
    setEditingWeek(prev => prev ? { ...prev, [field]: value } : null);
  };

  const addListItem = (field: keyof WeeklyPlan, item: string) => {
    if (!editingWeek || !item.trim()) return;
    const currentList = editingWeek[field] as string[] || [];
    updateEditingWeek(field, [...currentList, item.trim()]);
  };

  const removeListItem = (field: keyof WeeklyPlan, index: number) => {
    if (!editingWeek) return;
    const currentList = editingWeek[field] as string[] || [];
    updateEditingWeek(field, currentList.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        📊 Scheme of Work Editor
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Create and edit comprehensive CBC-compliant schemes of work with structured weekly planning.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Basic Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <School /> Scheme Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Scheme Title"
                value={scheme.title}
                onChange={(e) => setScheme(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Mathematics Grade 3 Term 1"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={scheme.subject}
                  onChange={(e) => setScheme(prev => ({ ...prev, subject: e.target.value }))}
                  label="Subject"
                >
                  {subjects.map(subject => (
                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={scheme.grade}
                  onChange={(e) => setScheme(prev => ({ ...prev, grade: e.target.value }))}
                  label="Grade"
                >
                  {grades.map(grade => (
                    <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Term</InputLabel>
                <Select
                  value={scheme.term}
                  onChange={(e) => setScheme(prev => ({ ...prev, term: parseInt(e.target.value as string) }))}
                  label="Term"
                >
                  {terms.map(term => (
                    <MenuItem key={term} value={term}>Term {term}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={generateScheme}
              disabled={loading || !scheme.subject || !scheme.grade}
              startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
            >
              Generate CBC Scheme
            </Button>
            
            {template && (
              <Button
                variant="outlined"
                onClick={() => setScheme(prev => ({ ...prev, weeks: [] }))}
                startIcon={<MenuBook />}
              >
                Use Template ({template.suggestedWeeks} weeks)
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Weekly Plans Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday /> Weekly Plans ({scheme.weeks.length} weeks)
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {scheme.id && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => exportScheme('docx')}
                    startIcon={<Download />}
                  >
                    Export DOCX
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => exportScheme('pdf')}
                    startIcon={<Download />}
                  >
                    Export PDF
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Week</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Topic</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Learning Outcomes</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Activities</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Resources</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scheme.weeks.map((week) => (
                  <TableRow key={week.week} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                    <TableCell>
                      <Chip label={`Week ${week.week}`} color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {week.topic}
                      </Typography>
                      {week.subTopics.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {week.subTopics.slice(0, 2).join(', ')}
                          {week.subTopics.length > 2 && '...'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ maxWidth: 200 }}>
                        {week.learningOutcomes.slice(0, 2).map((outcome, idx) => (
                          <Typography key={idx} variant="caption" display="block">
                            • {outcome.substring(0, 50)}...
                          </Typography>
                        ))}
                        {week.learningOutcomes.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{week.learningOutcomes.length - 2} more
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ maxWidth: 200 }}>
                        {week.learningExperiences.slice(0, 2).map((activity, idx) => (
                          <Typography key={idx} variant="caption" display="block">
                            • {activity.substring(0, 40)}...
                          </Typography>
                        ))}
                        {week.learningExperiences.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{week.learningExperiences.length - 2} more
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ maxWidth: 150 }}>
                        {week.resources.slice(0, 3).map((resource, idx) => (
                          <Chip key={idx} label={resource} size="small" sx={{ m: 0.25 }} />
                        ))}
                        {week.resources.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{week.resources.length - 3} more
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit Week">
                          <IconButton size="small" onClick={() => editWeek(week)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Week">
                          <IconButton size="small" color="error" onClick={() => deleteWeek(week.week)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {scheme.weeks.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CalendarToday sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No weekly plans yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Generate a scheme or add weeks manually to get started.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={addWeek}
      >
        <Add />
      </Fab>

      {/* Week Edit Dialog */}
      <Dialog open={weekDialogOpen} onClose={() => setWeekDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingWeek?.week ? `Edit Week ${editingWeek.week}` : 'Add New Week'}
        </DialogTitle>
        <DialogContent>
          {editingWeek && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Week Number"
                    type="number"
                    value={editingWeek.week}
                    onChange={(e) => updateEditingWeek('week', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Topic"
                    value={editingWeek.topic}
                    onChange={(e) => updateEditingWeek('topic', e.target.value)}
                  />
                </Grid>
              </Grid>

              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Learning Outcomes ({editingWeek.learningOutcomes.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <EditableList
                    items={editingWeek.learningOutcomes}
                    onAdd={(item) => addListItem('learningOutcomes', item)}
                    onRemove={(index) => removeListItem('learningOutcomes', index)}
                    placeholder="Enter learning outcome..."
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Learning Experiences ({editingWeek.learningExperiences.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <EditableList
                    items={editingWeek.learningExperiences}
                    onAdd={(item) => addListItem('learningExperiences', item)}
                    onRemove={(index) => removeListItem('learningExperiences', index)}
                    placeholder="Enter learning activity..."
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Resources ({editingWeek.resources.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <EditableList
                    items={editingWeek.resources}
                    onAdd={(item) => addListItem('resources', item)}
                    onRemove={(index) => removeListItem('resources', index)}
                    placeholder="Enter resource..."
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Core Competencies</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {cbcCoreCompetencies.map(competency => (
                      <Chip
                        key={competency}
                        label={competency}
                        clickable
                        color={editingWeek.coreCompetencies.includes(competency) ? 'primary' : 'default'}
                        onClick={() => {
                          const current = editingWeek.coreCompetencies;
                          if (current.includes(competency)) {
                            updateEditingWeek('coreCompetencies', current.filter(c => c !== competency));
                          } else {
                            updateEditingWeek('coreCompetencies', [...current, competency]);
                          }
                        }}
                      />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Values</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {cbcValues.map(value => (
                      <Chip
                        key={value}
                        label={value}
                        clickable
                        color={editingWeek.values.includes(value) ? 'secondary' : 'default'}
                        onClick={() => {
                          const current = editingWeek.values;
                          if (current.includes(value)) {
                            updateEditingWeek('values', current.filter(v => v !== value));
                          } else {
                            updateEditingWeek('values', [...current, value]);
                          }
                        }}
                      />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWeekDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveWeek} variant="contained" startIcon={<Save />}>
            Save Week
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Reusable component for editable lists
interface EditableListProps {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}

const EditableList: React.FC<EditableListProps> = ({ items, onAdd, onRemove, placeholder }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem);
      setNewItem('');
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
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="outlined" onClick={handleAdd} disabled={!newItem.trim()}>
          Add
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {items.map((item, index) => (
          <Chip
            key={index}
            label={item}
            onDelete={() => onRemove(index)}
            size="small"
          />
        ))}
      </Box>
    </Box>
  );
};

export default SchemeOfWorkEditor;