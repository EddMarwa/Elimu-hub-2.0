import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  ExpandMore,
  School,
  TrendingUp,
  Compare,
  CheckCircle,
  Info,
  Timeline,
  Assessment,
  Psychology,
  Favorite,
  Groups,
  Computer
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const CBCTransition: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const curriculumComparison = [
    {
      aspect: 'Focus',
      old844: 'Content-based learning with emphasis on examinations',
      cbc: 'Competency-based learning focusing on skills and application'
    },
    {
      aspect: 'Assessment',
      old844: 'Summative assessment through national examinations',
      cbc: 'Continuous assessment with formative and summative methods'
    },
    {
      aspect: 'Learning Approach',
      old844: 'Teacher-centered with passive learning',
      cbc: 'Learner-centered with active participation and discovery'
    },
    {
      aspect: 'Skills Development',
      old844: 'Academic knowledge acquisition',
      cbc: 'Life skills, critical thinking, and practical application'
    },
    {
      aspect: 'Career Preparation',
      old844: 'Limited pathways focused on university education',
      cbc: 'Multiple pathways including technical and vocational training'
    }
  ];

  const cbcCoreCompetencies = [
    {
      name: 'Communication and Collaboration',
      description: 'Ability to communicate effectively and work with others',
      icon: <Groups color="primary" />,
      examples: ['Group discussions', 'Presentations', 'Peer learning', 'Digital communication']
    },
    {
      name: 'Critical Thinking and Problem Solving',
      description: 'Analyzing information and solving complex problems',
      icon: <Psychology color="primary" />,
      examples: ['Case studies', 'Research projects', 'Mathematical reasoning', 'Scientific inquiry']
    },
    {
      name: 'Imagination and Creativity',
      description: 'Generating new ideas and innovative solutions',
      icon: <TrendingUp color="primary" />,
      examples: ['Art projects', 'Creative writing', 'Innovation challenges', 'Design thinking']
    },
    {
      name: 'Citizenship',
      description: 'Understanding rights, responsibilities, and civic engagement',
      icon: <School color="primary" />,
      examples: ['Community service', 'Environmental conservation', 'Cultural appreciation', 'Leadership']
    },
    {
      name: 'Digital Literacy',
      description: 'Effective use of digital technologies',
      icon: <Computer color="primary" />,
      examples: ['Computer skills', 'Online research', 'Digital content creation', 'Coding basics']
    },
    {
      name: 'Learning to Learn',
      description: 'Developing metacognitive skills and self-directed learning',
      icon: <Timeline color="primary" />,
      examples: ['Study strategies', 'Self-reflection', 'Goal setting', 'Time management']
    },
    {
      name: 'Self-Efficacy',
      description: 'Building confidence and belief in one\'s abilities',
      icon: <CheckCircle color="primary" />,
      examples: ['Personal goal achievement', 'Resilience building', 'Self-assessment', 'Growth mindset']
    }
  ];

  const cbcValues = [
    {
      name: 'Love',
      description: 'Caring for self, others, and the environment',
      color: '#E91E63'
    },
    {
      name: 'Responsibility',
      description: 'Being accountable for actions and decisions',
      color: '#FF9800'
    },
    {
      name: 'Respect',
      description: 'Valuing diversity and treating others with dignity',
      color: '#2196F3'
    },
    {
      name: 'Unity',
      description: 'Working together for common goals',
      color: '#4CAF50'
    },
    {
      name: 'Peace',
      description: 'Promoting harmony and conflict resolution',
      color: '#9C27B0'
    },
    {
      name: 'Patriotism',
      description: 'Love and loyalty to one\'s country',
      color: '#F44336'
    },
    {
      name: 'Social Justice',
      description: 'Fairness and equality for all',
      color: '#607D8B'
    }
  ];

  const implementationTimeline = [
    {
      year: '2017',
      milestone: 'CBC Launch',
      description: 'Introduction of CBC in Pre-Primary 1 and 2'
    },
    {
      year: '2018',
      milestone: 'Grade 1 Implementation',
      description: 'CBC rolled out to Grade 1 learners'
    },
    {
      year: '2019',
      milestone: 'Grade 2 Implementation',
      description: 'CBC extended to Grade 2'
    },
    {
      year: '2020',
      milestone: 'Grade 3 Implementation',
      description: 'CBC implementation in Grade 3'
    },
    {
      year: '2021',
      milestone: 'Grade 4 Implementation',
      description: 'CBC rolled out to Grade 4'
    },
    {
      year: '2022',
      milestone: 'Grade 5 Implementation',
      description: 'CBC extended to Grade 5'
    },
    {
      year: '2023',
      milestone: 'Grade 6 Implementation',
      description: 'CBC implementation in Grade 6'
    },
    {
      year: '2024',
      milestone: 'Junior Secondary',
      description: 'Transition to Junior Secondary School (Grade 7-9)'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        🔄 CBC Transition Guide
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Understanding the transition from 8-4-4 to Competency-Based Curriculum (CBC) and its implications for teaching and learning.
      </Typography>

      {/* Overview Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>CBC Focus:</strong> The Competency-Based Curriculum emphasizes developing learners' abilities to apply knowledge, 
          skills, and attitudes to solve real-world problems, moving away from rote learning to competency development.
        </Typography>
      </Alert>

      {/* Tabs Navigation */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<Info />} />
          <Tab label="Core Competencies" icon={<Psychology />} />
          <Tab label="Values" icon={<Favorite />} />
          <Tab label="Implementation" icon={<Timeline />} />
          <Tab label="Comparison" icon={<Compare />} />
        </Tabs>
      </Card>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School /> What is CBC?
                </Typography>
                
                <Typography variant="body2" paragraph>
                  The Competency-Based Curriculum (CBC) is Kenya's new education system that focuses on developing learners' 
                  competencies rather than just academic knowledge. It emphasizes:
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Practical application of knowledge" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Development of life skills" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Learner-centered approaches" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Continuous assessment" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Multiple career pathways" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment /> Key Features
                </Typography>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">Learning Areas</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2">
                      CBC organizes content into learning areas that integrate multiple subjects, 
                      promoting holistic learning and real-world application.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">Assessment Methods</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2">
                      Continuous assessment through portfolios, projects, and practical activities 
                      rather than relying solely on examinations.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">Career Pathways</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2">
                      Multiple pathways including academic, technical, and vocational tracks 
                      to cater to diverse learner interests and abilities.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
          CBC Core Competencies
        </Typography>
        
        <Grid container spacing={3}>
          {cbcCoreCompetencies.map((competency, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {competency.icon}
                    <Typography variant="h6" sx={{ color: 'primary.main' }}>
                      {competency.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" paragraph>
                    {competency.description}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Examples:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {competency.examples.map((example, idx) => (
                      <Chip key={idx} label={example} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
          CBC Values
        </Typography>
        
        <Grid container spacing={3}>
          {cbcValues.map((value, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%', borderLeft: `4px solid ${value.color}` }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: value.color }}>
                    {value.name}
                  </Typography>
                  <Typography variant="body2">
                    {value.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Integration:</strong> These values should be integrated across all learning areas and activities, 
            not taught as separate subjects. They form the foundation of character development in CBC.
          </Typography>
        </Alert>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
          CBC Implementation Timeline
        </Typography>
        
        <Card>
          <CardContent>
            <List>
              {implementationTimeline.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <Chip label={item.year} color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.milestone}
                      secondary={item.description}
                    />
                  </ListItem>
                  {index < implementationTimeline.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
        
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> The implementation timeline may vary by region and school. 
            Teachers should stay updated with official communications from the Ministry of Education.
          </Typography>
        </Alert>
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
          8-4-4 vs CBC Comparison
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Aspect</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>8-4-4 System</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>CBC System</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {curriculumComparison.map((row, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    {row.aspect}
                  </TableCell>
                  <TableCell>{row.old844}</TableCell>
                  <TableCell sx={{ color: 'primary.main' }}>{row.cbc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={() => setComparisonOpen(true)}
            startIcon={<Compare />}
          >
            View Detailed Comparison
          </Button>
        </Box>
      </TabPanel>

      {/* Detailed Comparison Dialog */}
      <Dialog open={comparisonOpen} onClose={() => setComparisonOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detailed Curriculum Comparison</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            This detailed comparison helps teachers understand the fundamental shifts required 
            when transitioning from the 8-4-4 system to CBC.
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Teaching Methodology</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="error">8-4-4 Approach:</Typography>
                  <List dense>
                    <ListItem><ListItemText primary="Lecture-based teaching" /></ListItem>
                    <ListItem><ListItemText primary="Memorization and recall" /></ListItem>
                    <ListItem><ListItemText primary="Teacher as information provider" /></ListItem>
                  </List>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="primary">CBC Approach:</Typography>
                  <List dense>
                    <ListItem><ListItemText primary="Interactive and participatory" /></ListItem>
                    <ListItem><ListItemText primary="Application and problem-solving" /></ListItem>
                    <ListItem><ListItemText primary="Teacher as facilitator" /></ListItem>
                  </List>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Assessment Philosophy</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="error">8-4-4 Assessment:</Typography>
                  <List dense>
                    <ListItem><ListItemText primary="High-stakes examinations" /></ListItem>
                    <ListItem><ListItemText primary="Ranking and competition" /></ListItem>
                    <ListItem><ListItemText primary="One-size-fits-all approach" /></ListItem>
                  </List>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="primary">CBC Assessment:</Typography>
                  <List dense>
                    <ListItem><ListItemText primary="Continuous assessment" /></ListItem>
                    <ListItem><ListItemText primary="Individual progress tracking" /></ListItem>
                    <ListItem><ListItemText primary="Multiple assessment methods" /></ListItem>
                  </List>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComparisonOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Cards */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: 'rgba(10, 135, 84, 0.05)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <School sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                For Teachers
              </Typography>
              <Typography variant="body2">
                Adapt your teaching methods to focus on competency development and learner-centered approaches.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: 'rgba(255, 215, 0, 0.05)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Assessment Changes
              </Typography>
              <Typography variant="body2">
                Implement continuous assessment methods and focus on competency-based evaluation.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: 'rgba(46, 125, 50, 0.05)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Future Ready
              </Typography>
              <Typography variant="body2">
                Prepare learners for the 21st century with relevant skills and competencies.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CBCTransition;