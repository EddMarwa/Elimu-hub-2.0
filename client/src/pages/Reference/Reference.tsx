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
  Badge
} from '@mui/material';
import {
  Search,
  FilterList,
  ExpandMore,
  School,
  MenuBook,
  Assessment,
  TrendingUp
} from '@mui/icons-material';
import axios from 'axios';

interface SearchResult {
  content: string;
  similarity: number;
  metadata: {
    source: string;
    subject?: string;
    grade?: string;
    topic?: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

interface SearchResponse {
  query: string;
  filters: any;
  results: SearchResult[];
}

const Reference: React.FC = () => {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [topic, setTopic] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

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
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/documents/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        limit: '10'
      });

      if (subject) params.append('subject', subject);
      if (grade) params.append('grade', grade);
      if (topic) params.append('topic', topic);

      const response = await axios.get(`/api/documents/search?${params}`);
      setResults(response.data.data.results);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSubject('');
    setGrade('');
    setTopic('');
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'success';
    if (similarity >= 0.6) return 'warning';
    return 'default';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.8) return 'High Match';
    if (similarity >= 0.6) return 'Good Match';
    return 'Partial Match';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        🔍 Curriculum Reference Search
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Search through uploaded curriculum documents to find relevant content for lesson planning.
        Use semantic search to discover related concepts and learning materials.
      </Typography>

      {/* Stats Overview */}
      {stats && (
        <Card sx={{ mb: 3, backgroundColor: 'rgba(10, 135, 84, 0.05)' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Badge badgeContent={stats.totalChunks} color="primary">
                  <MenuBook sx={{ fontSize: 40, color: 'primary.main' }} />
                </Badge>
              </Grid>
              <Grid item xs>
                <Typography variant="h6" sx={{ color: 'primary.main' }}>
                  Reference Library
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.totalChunks} content chunks available for search across {stats.collections.length} collection(s)
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Search Interface */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search Query"
                placeholder="e.g., learning outcomes for fractions, assessment methods..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  label="Subject"
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map(subj => (
                    <MenuItem key={subj} value={subj}>{subj}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Grade</InputLabel>
                <Select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  label="Grade"
                >
                  <MenuItem value="">All Grades</MenuItem>
                  {grades.map(gr => (
                    <MenuItem key={gr} value={gr}>{gr}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                  fullWidth
                >
                  Search
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Active Filters */}
          {(subject || grade || topic) && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <FilterList sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ mr: 1 }}>Filters:</Typography>
              {subject && <Chip label={`Subject: ${subject}`} size="small" onDelete={() => setSubject('')} />}
              {grade && <Chip label={`Grade: ${grade}`} size="small" onDelete={() => setGrade('')} />}
              {topic && <Chip label={`Topic: ${topic}`} size="small" onDelete={() => setTopic('')} />}
              <Button size="small" onClick={clearFilters}>Clear All</Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Search Results ({results.length})
            </Typography>
            
            <List>
              {results.map((result, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {result.metadata.source}
                          </Typography>
                          <Chip
                            label={getSimilarityLabel(result.similarity)}
                            color={getSimilarityColor(result.similarity) as any}
                            size="small"
                          />
                          <Chip
                            label={`${Math.round(result.similarity * 100)}% match`}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          {/* Metadata */}
                          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            {result.metadata.subject && (
                              <Chip
                                icon={<School />}
                                label={result.metadata.subject}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {result.metadata.grade && (
                              <Chip
                                icon={<Assessment />}
                                label={result.metadata.grade}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {result.metadata.topic && (
                              <Chip
                                label={result.metadata.topic}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            <Chip
                              label={`Chunk ${result.metadata.chunkIndex + 1}/${result.metadata.totalChunks}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>

                          {/* Content Preview */}
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="body2">
                                {result.content.substring(0, 150)}...
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {result.content}
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < results.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No results found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search query or filters. Make sure you have uploaded relevant documents first.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      <Card sx={{ mt: 3, backgroundColor: 'rgba(255, 215, 0, 0.05)' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
            💡 Search Tips
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" component="div">
                <strong>Effective Queries:</strong>
                <ul>
                  <li>Use specific terms: "learning outcomes", "assessment criteria"</li>
                  <li>Include context: "Grade 3 mathematics fractions"</li>
                  <li>Ask questions: "How to assess reading comprehension?"</li>
                </ul>
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" component="div">
                <strong>Semantic Search:</strong>
                <ul>
                  <li>Finds related concepts even with different wording</li>
                  <li>Understands context and meaning</li>
                  <li>Works with natural language queries</li>
                </ul>
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reference;