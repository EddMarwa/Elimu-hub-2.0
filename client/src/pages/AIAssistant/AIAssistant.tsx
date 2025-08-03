import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  List,
  ListItem,
  IconButton,
} from '@mui/material';
import {
  Psychology,
  Send,
  School,
  Assignment,
  Description,
  Lightbulb,
  Quiz,
  MenuBook,
  Clear,
  ContentCopy,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'suggestion';
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
}

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello ${user?.firstName || 'there'}! I'm your Elimu Hub AI Assistant. I'm here to help you with lesson planning, curriculum development, and educational content creation. How can I assist you today?`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestions: AISuggestion[] = [
    {
      id: '1',
      title: 'Create Lesson Plan',
      description: 'Generate a comprehensive lesson plan for any subject and grade level',
      icon: <Assignment color="primary" />,
      action: 'lesson-plan',
    },
    {
      id: '2',
      title: 'Develop Scheme of Work',
      description: 'Create a structured scheme of work aligned with CBC curriculum',
      icon: <Description color="primary" />,
      action: 'scheme-of-work',
    },
    {
      id: '3',
      title: 'Assessment Ideas',
      description: 'Get creative assessment and evaluation methods for your lessons',
      icon: <Quiz color="primary" />,
      action: 'assessment',
    },
    {
      id: '4',
      title: 'Learning Activities',
      description: 'Discover engaging activities and teaching strategies',
      icon: <Lightbulb color="primary" />,
      action: 'activities',
    },
    {
      id: '5',
      title: 'Curriculum Alignment',
      description: 'Ensure your content aligns with CBC learning objectives',
      icon: <School color="primary" />,
      action: 'curriculum',
    },
    {
      id: '6',
      title: 'Resource Suggestions',
      description: 'Get recommendations for teaching materials and resources',
      icon: <MenuBook color="primary" />,
      action: 'resources',
    },
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response (replace with actual AI service call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I understand you're looking for help with that. As your AI assistant, I can help you create educational content, provide teaching suggestions, and assist with curriculum planning. What specific aspect would you like me to focus on?",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    const suggestionMessage: Message = {
      id: Date.now().toString(),
      content: `Help me with: ${suggestion.title}`,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, suggestionMessage]);
    setIsLoading(true);

    // Simulate AI response based on suggestion
    setTimeout(() => {
      let response = '';
      switch (suggestion.action) {
        case 'lesson-plan':
          response = "I'd be happy to help you create a lesson plan! Please provide me with: 1) Subject area, 2) Grade level, 3) Topic/learning objective, 4) Duration, and 5) Any specific requirements. I'll generate a comprehensive CBC-aligned lesson plan for you.";
          break;
        case 'scheme-of-work':
          response = "Let's create a scheme of work together! I'll need: 1) Subject, 2) Grade level, 3) Term/duration, 4) Key learning areas to cover. I'll structure it according to CBC guidelines with clear progression and assessment criteria.";
          break;
        case 'assessment':
          response = "Great choice! I can suggest various assessment methods including formative and summative assessments. Tell me about your lesson topic and I'll recommend appropriate evaluation techniques, rubrics, and student feedback methods.";
          break;
        case 'activities':
          response = "I love helping with engaging activities! Share your lesson topic and grade level, and I'll suggest interactive activities, group work ideas, hands-on experiments, and creative learning experiences that align with CBC principles.";
          break;
        case 'curriculum':
          response = "Curriculum alignment is crucial! Tell me your subject and grade level, and I'll help ensure your content meets CBC learning outcomes, competency standards, and assessment criteria. I can also suggest cross-curricular connections.";
          break;
        case 'resources':
          response = "I can recommend excellent teaching resources! Share your subject and topic, and I'll suggest appropriate textbooks, digital resources, manipulatives, and supplementary materials that support effective learning.";
          break;
        default:
          response = "I'm here to help with your educational needs. Please provide more details about what you'd like assistance with.";
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        content: `Hello ${user?.firstName || 'there'}! I'm your Elimu Hub AI Assistant. I'm here to help you with lesson planning, curriculum development, and educational content creation. How can I assist you today?`,
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Grid container spacing={3}>
        {/* AI Suggestions Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Psychology color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                AI Assistance Options
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click on any option below to get started with AI-powered educational assistance.
            </Typography>

            <Grid container spacing={2}>
              {suggestions.map((suggestion) => (
                <Grid item xs={12} key={suggestion.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {suggestion.icon}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {suggestion.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {suggestion.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Pro Tip:</strong> Be specific with your requests to get the most relevant and helpful AI-generated content.
              </Typography>
            </Alert>
          </Paper>
        </Grid>

        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            {/* Chat Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <Psychology />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Elimu Hub AI Assistant
                    </Typography>
                    <Chip label="Online" color="success" size="small" />
                  </Box>
                </Box>
                <IconButton onClick={handleClearChat} title="Clear Chat">
                  <Clear />
                </IconButton>
              </Box>
            </Box>

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <List>
                {messages.map((message) => (
                  <ListItem
                    key={message.id}
                    sx={{
                      flexDirection: 'column',
                      alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '80%',
                        bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                        color: message.sender === 'user' ? 'white' : 'text.primary',
                      }}
                    >
                      <Typography variant="body2">{message.content}</Typography>
                      {message.sender === 'ai' && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(message.content)}
                            sx={{ color: 'text.secondary' }}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                          <IconButton size="small" sx={{ color: 'text.secondary' }}>
                            <ThumbUp fontSize="small" />
                          </IconButton>
                          <IconButton size="small" sx={{ color: 'text.secondary' }}>
                            <ThumbDown fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Paper>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </ListItem>
                ))}
                {isLoading && (
                  <ListItem sx={{ justifyContent: 'flex-start' }}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                      <Typography variant="body2" color="text.secondary">
                        AI is thinking...
                      </Typography>
                    </Paper>
                  </ListItem>
                )}
              </List>
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Ask me anything about lesson planning, curriculum, or teaching strategies..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  multiline
                  maxRows={3}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  <Send />
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AIAssistant;
