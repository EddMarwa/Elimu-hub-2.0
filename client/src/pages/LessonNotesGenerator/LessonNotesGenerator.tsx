import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';
import { aiLessonAPI } from '../../services/api';

const LessonNotesGenerator: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [topic, setTopic] = useState('');
  const [scheme, setScheme] = useState('');
  const [lessonPlan, setLessonPlan] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [lessonNotes, setLessonNotes] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setLessonNotes(null);
    let schemeObj = undefined;
    let lessonPlanObj = undefined;
    try {
      if (scheme) schemeObj = JSON.parse(scheme);
    } catch {}
    try {
      if (lessonPlan) lessonPlanObj = JSON.parse(lessonPlan);
    } catch {}
    try {
      const res = await aiLessonAPI.generateLessonNotes({ subject, grade, topic, scheme: schemeObj, lessonPlan: lessonPlanObj, context });
      setLessonNotes(res.data?.data?.lessonNotes || res.data?.data);
    } catch (e: any) {
      setError('Failed to generate lesson notes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Lesson Notes Generator
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField label="Subject" value={subject} onChange={e => setSubject(e.target.value)} fullWidth margin="normal" />
        <TextField label="Grade" value={grade} onChange={e => setGrade(e.target.value)} fullWidth margin="normal" />
        <TextField label="Topic" value={topic} onChange={e => setTopic(e.target.value)} fullWidth margin="normal" />
        <TextField label="Scheme of Work (JSON, optional)" value={scheme} onChange={e => setScheme(e.target.value)} fullWidth margin="normal" multiline minRows={2} />
        <TextField label="Lesson Plan (JSON, optional)" value={lessonPlan} onChange={e => setLessonPlan(e.target.value)} fullWidth margin="normal" multiline minRows={2} />
        <TextField label="Context (optional)" value={context} onChange={e => setContext(e.target.value)} fullWidth margin="normal" multiline minRows={2} />
        <Button variant="contained" color="primary" onClick={handleGenerate} disabled={loading || !subject || !grade || !topic} sx={{ mt: 2 }}>
          {loading ? <CircularProgress size={24} /> : 'Generate Lesson Notes'}
        </Button>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </Paper>
      {lessonNotes && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Generated Lesson Notes</Typography>
          {Object.entries(lessonNotes).map(([key, value]) => (
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

export default LessonNotesGenerator;
