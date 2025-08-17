import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  Book,
  Description,
  School,
  Policy,
  Assessment,
  Timeline,
  Download,
  Visibility,
  FilterList,
  ExpandMore,
  Article,
  VideoLibrary,
  PictureAsPdf,
  InsertDriveFile,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ReferenceDocument {
  id: string;
  title: string;
  description: string;
  type: 'policy' | 'guideline' | 'curriculum' | 'assessment' | 'research' | 'template';
  category: string;
  tags: string[];
  fileUrl: string;
  fileType: string;
  fileSize: number;
  lastUpdated: string;
  author: string;
  rating: number;
  downloads: number;
  isBookmarked: boolean;
}

interface ReferenceCategory {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  icon: React.ReactNode;
}

const Reference: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<ReferenceDocument[]>([]);
  const [categories, setCategories] = useState<ReferenceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState('relevance');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<ReferenceDocument | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const documentTypes = [
    { value: 'policy', label: 'Policy Documents' },
    { value: 'guideline', label: 'Guidelines' },
    { value: 'curriculum', label: 'Curriculum' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'research', label: 'Research Papers' },
    { value: 'template', label: 'Templates' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'downloads', label: 'Most Downloaded' },
    { value: 'title', label: 'Title A-Z' },
  ];

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [searchTerm, selectedCategory, selectedType, sortBy, documents]);

  const loadReferenceData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockCategories: ReferenceCategory[] = [
        {
          id: 'policy',
          name: 'Policy Documents',
          description: 'Official education policies and regulations',
          documentCount: 15,
          icon: <Policy />
        },
        {
          id: 'curriculum',
          name: 'Curriculum Standards',
          description: 'CBC curriculum frameworks and standards',
          documentCount: 28,
          icon: <School />
        },
        {
          id: 'assessment',
          name: 'Assessment Guidelines',
          description: 'Evaluation and assessment procedures',
          documentCount: 22,
          icon: <Assessment />
        },
        {
          id: 'research',
          name: 'Research Papers',
          description: 'Educational research and studies',
          documentCount: 45,
          icon: <Article />
        },
        {
          id: 'templates',
          name: 'Templates & Forms',
          description: 'Ready-to-use templates and forms',
          documentCount: 33,
          icon: <Description />
        },
        {
          id: 'multimedia',
          name: 'Multimedia Resources',
          description: 'Videos, presentations, and interactive content',
          documentCount: 18,
          icon: <VideoLibrary />
        }
      ];

      const mockDocuments: ReferenceDocument[] = [
        {
          id: '1',
          title: 'CBC Implementation Policy Framework',
          description: 'Comprehensive policy framework for implementing CBC curriculum across all levels',
          type: 'policy',
          category: 'policy',
          tags: ['cbc', 'implementation', 'policy', 'framework'],
          fileUrl: '#',
          fileType: 'pdf',
          fileSize: 2.5,
          lastUpdated: '2024-01-15',
          author: 'Ministry of Education',
          rating: 4.8,
          downloads: 1250,
          isBookmarked: false
        },
        {
          id: '2',
          title: 'Mathematics Grade 4-6 Curriculum Guide',
          description: 'Detailed curriculum guide for Mathematics in upper primary grades',
          type: 'curriculum',
          category: 'curriculum',
          tags: ['mathematics', 'grade4', 'grade5', 'grade6', 'curriculum'],
          fileUrl: '#',
          fileType: 'pdf',
          fileSize: 3.2,
          lastUpdated: '2024-02-01',
          author: 'KICD',
          rating: 4.6,
          downloads: 890,
          isBookmarked: true
        },
        {
          id: '3',
          title: 'Assessment Rubrics for Creative Arts',
          description: 'Standardized assessment rubrics for evaluating creative arts projects',
          type: 'assessment',
          category: 'assessment',
          tags: ['assessment', 'creative-arts', 'rubrics', 'evaluation'],
          fileUrl: '#',
          fileType: 'docx',
          fileSize: 1.8,
          lastUpdated: '2024-01-28',
          author: 'Curriculum Development Team',
          rating: 4.4,
          downloads: 567,
          isBookmarked: false
        },
        {
          id: '4',
          title: 'Teacher Professional Development Guidelines',
          description: 'Guidelines for continuous professional development of teachers',
          type: 'guideline',
          category: 'policy',
          tags: ['teacher-development', 'professional-development', 'guidelines'],
          fileUrl: '#',
          fileType: 'pdf',
          fileSize: 2.1,
          lastUpdated: '2024-01-20',
          author: 'TSC',
          rating: 4.7,
          downloads: 1100,
          isBookmarked: false
        },
        {
          id: '5',
          title: 'Lesson Plan Template - Science & Technology',
          description: 'Standardized lesson plan template for Science & Technology subjects',
          type: 'template',
          category: 'templates',
          tags: ['lesson-plan', 'template', 'science', 'technology'],
          fileUrl: '#',
          fileType: 'docx',
          fileSize: 0.8,
          lastUpdated: '2024-02-05',
          author: 'Curriculum Team',
          rating: 4.9,
          downloads: 2100,
          isBookmarked: true
        }
      ];

      setCategories(mockCategories);
      setDocuments(mockDocuments);
    } catch (error) {
      toast.error('Failed to load reference materials');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(doc => doc.type === selectedType);
    }

    // Sort documents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'oldest':
          return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredDocuments(filtered);
  };

  const handleDocumentAction = (document: ReferenceDocument, action: string) => {
    switch (action) {
      case 'view':
        setSelectedDocument(document);
        setViewDialogOpen(true);
        break;
      case 'download':
        toast.success(`Downloading ${document.title}`);
        break;
      case 'bookmark':
        setDocuments(prev => prev.map(doc =>
          doc.id === document.id ? { ...doc, isBookmarked: !doc.isBookmarked } : doc
        ));
        toast.success(document.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
        break;
      case 'rate':
        toast.info('Rating functionality coming soon');
        break;
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <PictureAsPdf color="error" />;
      case 'docx':
        return <InsertDriveFile color="primary" />;
      case 'pptx':
        return <InsertDriveFile color="warning" />;
      default:
        return <InsertDriveFile />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'policy': return 'error';
      case 'guideline': return 'warning';
      case 'curriculum': return 'primary';
      case 'assessment': return 'success';
      case 'research': return 'info';
      case 'template': return 'secondary';
      default: return 'default';
    }
  };

  const formatFileSize = (size: number) => {
    return `${size} MB`;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          Reference Materials
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Access educational policies, curriculum guides, assessment tools, and research materials
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search reference materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {documentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedType('');
                setSortBy('relevance');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Categories Overview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Browse by Category
        </Typography>
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={category.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
                  transition: 'all 0.3s ease',
                  border: selectedCategory === category.id ? '2px solid' : '1px solid',
                  borderColor: selectedCategory === category.id ? 'primary.main' : 'divider',
                }}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>
                    {category.icon}
                  </Box>
                  <Typography variant="subtitle2" fontWeight="bold" noWrap>
                    {category.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {category.documentCount} documents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Documents List */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Reference Documents ({filteredDocuments.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredDocuments.length} of {documents.length} documents
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredDocuments.length === 0 ? (
          <Alert severity="info">
            No documents found matching your criteria. Try adjusting your search or filters.
          </Alert>
        ) : (
          <List>
            {filteredDocuments.map((document, index) => (
              <React.Fragment key={document.id}>
                <ListItem sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 2, 
                  mb: 2,
                  '&:hover': { bgcolor: 'action.hover' }
                }}>
                  <ListItemIcon>
                    {getFileIcon(document.fileType)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {document.title}
                        </Typography>
                        <Chip
                          label={document.type}
                          size="small"
                          color={getTypeColor(document.type) as any}
                        />
                        {document.isBookmarked && (
                          <Bookmark color="primary" fontSize="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {document.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {document.tags.slice(0, 3).map((tag, tagIndex) => (
                            <Chip
                              key={tagIndex}
                              label={tag}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {document.tags.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                              +{document.tags.length - 3} more
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            By {document.author}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Updated {new Date(document.lastUpdated).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(document.fileSize)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star fontSize="small" color="primary" />
                            <Typography variant="caption">{document.rating}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {document.downloads} downloads
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleDocumentAction(document, 'bookmark')}
                        color={document.isBookmarked ? 'primary' : 'default'}
                      >
                        {document.isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                      </IconButton>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handleDocumentAction(document, 'view')}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Download />}
                        onClick={() => handleDocumentAction(document, 'download')}
                      >
                        Download
                      </Button>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredDocuments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Document View Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedDocument?.title}
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedDocument.description}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Tags:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedDocument.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Author:</strong> {selectedDocument.author}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>File Type:</strong> {selectedDocument.fileType.toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>File Size:</strong> {formatFileSize(selectedDocument.fileSize)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Updated:</strong> {new Date(selectedDocument.lastUpdated).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Rating:</strong> {selectedDocument.rating}/5
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Downloads:</strong> {selectedDocument.downloads}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedDocument && (
            <Button 
              variant="contained" 
              startIcon={<Download />}
              onClick={() => handleDocumentAction(selectedDocument, 'download')}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Reference;