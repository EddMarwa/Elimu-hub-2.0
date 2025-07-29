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
  Badge,
  Container,
  InputAdornment,
  IconButton,
  Avatar,
  Skeleton,
  Fade,
  Tooltip,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  Search,
  FilterList,
  ExpandMore,
  School,
  MenuBook,
  Assessment,
  TrendingUp,
  Clear,
  Bookmark,
  Share,
  ContentCopy,
  AutoAwesome,
  Psychology,
  FindInPage,
  Lightbulb
} from '@mui/icons-material';

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata: {
    source: string;
    subject?: string;
    grade?: string;
    topic?: string;
    documentType?: string;
    chunkIndex: number;
    totalChunks: number;
    uploadedAt?: string;
  };
  highlights?: string[];
}

interface SearchFilters {
  subject: string;
  grade: string;
  documentType: string;
  minSimilarity: number;
}

interface QuickSearch {
  query: string;
  category: string;
  icon: React.ReactNode;
  description: string;
}

const Reference: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    subject: '',
    grade: '',
    documentType: '',
    minSimilarity: 0.7
  });
  const [activeTab, setActiveTab] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedResults, setSavedResults] = useState<SearchResult[]>([]);

  const subjects = [
    'English', 'Kiswahili', 'Mathematics', 'Science & Technology',
    'Social Studies', 'Creative Arts', 'Physical Education',
    'Religious Education', 'Life Skills', 'Computer Science'
  ];

  const grades = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'
  ];

  const documentTypes = [
    'Curriculum Design', 'Teacher\'s Guide', 'Learner\'s Book',
    'Assessment Guidelines', 'CBC Handbook', 'Subject Manual'
  ];

  const quickSearches: QuickSearch[] = [
    {
      query: 'CBC learning objectives for Grade 1 Mathematics',
      category: 'Learning Objectives',
      icon: <School />,
      description: 'Find specific learning objectives'
    },
    {
      query: 'Assessment methods and rubrics',
      category: 'Assessment',
      icon: <Assessment />,
      description: 'Assessment criteria and methods'
    },
    {
      query: 'Teaching methodologies and approaches',
      category: 'Teaching Methods',
      icon: <Psychology />,
      description: 'Pedagogical approaches'
    },
    {
      query: 'Competency-based curriculum framework',
      category: 'CBC Framework',
      icon: <TrendingUp />,
      description: 'Core CBC principles'
    }
  ];

  const performSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
      }

      // Simulate API call for semantic search
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock search results based on query
      const mockResults: SearchResult[] = [
        {
          id: '1',
          content: `The CBC curriculum for ${query} emphasizes competency-based learning where learners demonstrate mastery of specific skills and knowledge. The learning objectives are designed to develop critical thinking, creativity, and problem-solving abilities in learners.`,
          similarity: 0.95,
          metadata: {
            source: 'CBC_Curriculum_Design_Grade1.pdf',
            subject: 'Mathematics',
            grade: 'Grade 1',
            topic: 'Number Concepts',
            documentType: 'Curriculum Design',
            chunkIndex: 1,
            totalChunks: 45,
            uploadedAt: '2025-01-15'
          },
          highlights: [query.split(' ').slice(0, 2).join(' ')]
        },
        {
          id: '2',
          content: `Assessment in the CBC framework is continuous and formative, focusing on the learner's progress rather than just final outcomes. Teachers use various assessment methods including observations, portfolios, and practical demonstrations to evaluate competency development.`,
          similarity: 0.87,
          metadata: {
            source: 'Assessment_Guidelines_CBC.pdf',
            subject: 'General',
            grade: 'All Grades',
            topic: 'Assessment Methods',
            documentType: 'Assessment Guidelines',
            chunkIndex: 3,
            totalChunks: 28,
            uploadedAt: '2025-01-10'
          },
          highlights: ['assessment', 'competency']
        },
        {
          id: '3',
          content: `The teaching methodology in CBC encourages learner-centered approaches where students actively participate in the learning process. This includes collaborative learning, inquiry-based learning, and hands-on activities that make learning meaningful and engaging.`,
          similarity: 0.82,
          metadata: {
            source: 'Teachers_Guide_Primary.pdf',
            subject: 'Science & Technology',
            grade: 'Grade 3',
            topic: 'Teaching Approaches',
            documentType: 'Teacher\'s Guide',
            chunkIndex: 7,
            totalChunks: 67,
            uploadedAt: '2025-01-08'
          },
          highlights: ['teaching', 'learner-centered']
        }
      ];

      // Filter results based on current filters
      const filteredResults = mockResults.filter(result => {
        if (filters.subject && result.metadata.subject !== filters.subject) return false;
        if (filters.grade && result.metadata.grade !== filters.grade) return false;
        if (filters.documentType && result.metadata.documentType !== filters.documentType) return false;
        if (result.similarity < filters.minSimilarity) return false;
        return true;
      });

      setSearchResults(filteredResults);

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const saveResult = (result: SearchResult) => {
    if (!savedResults.find(r => r.id === result.id)) {
      setSavedResults(prev => [...prev, result]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const highlightText = (text: string, highlights: string[] = []) => {
    if (!highlights.length) return text;
    
    let highlightedText = text;
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'success';
    if (similarity >= 0.8) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            🔍 Semantic Search & Reference
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Search through your uploaded CBC curriculum documents using AI-powered semantic search
          </Typography>
        </Paper>

        <Grid container spacing={4}>
          {/* Search Section */}
          <Grid item xs={12} lg={8}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder="Search for learning objectives, teaching methods, assessment criteria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AutoAwesome color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {searchQuery && (
                        <IconButton onClick={clearSearch} size="small">
                          <Clear />
                        </IconButton>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => performSearch()}
                        disabled={!searchQuery.trim() || isSearching}
                        sx={{ ml: 1 }}
                      >
                        {isSearching ? <CircularProgress size={20} /> : <Search />}
                      </Button>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.1rem',
                    '& fieldset': {
                      borderColor: '#667eea',
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              />

              {/* Quick Search Suggestions */}
              {!searchQuery && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    💡 Quick Search Ideas:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {quickSearches.map((quick, index) => (
                      <Tooltip key={index} title={quick.description}>
                        <Chip
                          label={quick.category}
                          variant="outlined"
                          clickable
                          onClick={() => {
                            setSearchQuery(quick.query);
                            performSearch(quick.query);
                          }}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              color: 'white'
                            }
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Search Results */}
            {isSearching && (
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CircularProgress size={24} />
                  <Typography>Searching through your document library...</Typography>
                </Box>
                <LinearProgress />
              </Paper>
            )}

            {searchResults.length > 0 && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FindInPage color="primary" />
                  Search Results ({searchResults.length})
                </Typography>

                {searchResults.map((result, index) => (
                  <Fade key={result.id} in={true} timeout={300 * (index + 1)}>
                    <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {result.metadata.source}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                              <Chip label={result.metadata.subject} size="small" color="primary" variant="outlined" />
                              <Chip label={result.metadata.grade} size="small" color="secondary" variant="outlined" />
                              <Chip label={result.metadata.documentType} size="small" variant="outlined" />
                              <Chip 
                                label={`${Math.round(result.similarity * 100)}% match`}
                                size="small"
                                color={getSimilarityColor(result.similarity)}
                              />
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Save result">
                              <IconButton size="small" onClick={() => saveResult(result)}>
                                <Bookmark />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Copy content">
                              <IconButton size="small" onClick={() => copyToClipboard(result.content)}>
                                <ContentCopy />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 2 }}>
                          {highlightText(result.content, result.highlights)}
                        </Typography>

                        <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Chunk {result.metadata.chunkIndex} of {result.metadata.totalChunks} • 
                            Uploaded {result.metadata.uploadedAt}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Topic: {result.metadata.topic}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                ))}
              </Paper>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Alert severity="info">
                  No results found for "{searchQuery}". Try adjusting your search terms or filters.
                </Alert>
              </Paper>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Filters */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterList color="primary" />
                Search Filters
              </Typography>

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={filters.subject}
                  onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                  label="Subject"
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map(subject => (
                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Grade</InputLabel>
                <Select
                  value={filters.grade}
                  onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                  label="Grade"
                >
                  <MenuItem value="">All Grades</MenuItem>
                  {grades.map(grade => (
                    <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={filters.documentType}
                  onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
                  label="Document Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {documentTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Minimum Similarity: {Math.round(filters.minSimilarity * 100)}%
                </Typography>
                <Box 
                  component="input"
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={filters.minSimilarity}
                  onChange={(e: any) => setFilters(prev => ({ ...prev, minSimilarity: parseFloat(e.target.value) }))}
                  sx={{ width: '100%' }}
                  aria-label="Minimum similarity threshold"
                  title="Adjust minimum similarity threshold for search results"
                />
              </Box>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => setFilters({
                  subject: '',
                  grade: '',
                  documentType: '',
                  minSimilarity: 0.7
                })}
                sx={{ mt: 2 }}
              >
                Clear Filters
              </Button>
            </Paper>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Searches
                </Typography>
                <List dense>
                  {searchHistory.slice(0, 5).map((query, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => {
                        setSearchQuery(query);
                        performSearch(query);
                      }}
                    >
                      <ListItemText 
                        primary={query}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Saved Results */}
            {savedResults.length > 0 && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Saved Results ({savedResults.length})
                </Typography>
                <List dense>
                  {savedResults.slice(0, 3).map((result) => (
                    <ListItem key={result.id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={result.metadata.source}
                        secondary={`${result.metadata.subject} • ${result.metadata.grade}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
export default Reference;