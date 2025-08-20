import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';
import { aiLessonAPI } from '../../services/api';

const LessonPlanGenerator: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setLessonPlan(null);
    try {
      const res = await aiLessonAPI.generateLessonPlan({ subject, grade, topic, objectives, context });
      setLessonPlan(res.data?.data?.lessonPlan || res.data?.data);
    } catch (e: any) {
      setError('Failed to generate lesson plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Lesson Plan Generator
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField label="Subject" value={subject} onChange={e => setSubject(e.target.value)} fullWidth margin="normal" />
        <TextField label="Grade" value={grade} onChange={e => setGrade(e.target.value)} fullWidth margin="normal" />
        <TextField label="Topic" value={topic} onChange={e => setTopic(e.target.value)} fullWidth margin="normal" />
        <TextField label="Objectives" value={objectives} onChange={e => setObjectives(e.target.value)} fullWidth margin="normal" multiline minRows={2} />
        <TextField label="Context (optional)" value={context} onChange={e => setContext(e.target.value)} fullWidth margin="normal" multiline minRows={2} />
        <Button variant="contained" color="primary" onClick={handleGenerate} disabled={loading || !subject || !grade || !topic} sx={{ mt: 2 }}>
          {loading ? <CircularProgress size={24} /> : 'Generate Lesson Plan'}
        </Button>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </Paper>
      {lessonPlan && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Generated Lesson Plan</Typography>
          {Object.entries(lessonPlan).map(([key, value]) => (
            <Box key={key} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">{key.replace(/([A-Z])/g, ' $1')}</Typography>
              <Typography variant="body2">{Array.isArray(value) ? value.join(', ') : value}</Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default LessonPlanGenerator;
