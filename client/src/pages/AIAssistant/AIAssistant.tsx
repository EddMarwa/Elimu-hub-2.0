import React, { useState, useRef, useEffect } from 'react';
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
  useTheme,
  useMediaQuery,
  Drawer,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Menu,
  Close,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
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

  // API Configuration
  const API_KEY = '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';
  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callAIAPI = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in Kenyan CBC (Competency-Based Curriculum) education. Generate detailed, practical, and CBC-compliant educational content for teachers. Be helpful, informative, and provide actionable advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I encountered an error. Please try again.';
    } catch (error) {
      console.error('AI API Error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  };

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

    try {
      const aiResponse = await callAIAPI(inputMessage);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: AISuggestion) => {
    const suggestionMessage: Message = {
      id: Date.now().toString(),
      content: `Help me with: ${suggestion.title}`,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, suggestionMessage]);
    setIsLoading(true);
    setSuggestionsOpen(false); // Close suggestions on mobile

    try {
      let prompt = '';
      switch (suggestion.action) {
        case 'lesson-plan':
          prompt = "I need help creating a lesson plan. Please provide guidance on: 1) How to structure a CBC-aligned lesson plan, 2) Key components to include, 3) Assessment strategies, 4) Learning activities. Give me a comprehensive overview.";
          break;
        case 'scheme-of-work':
          prompt = "I need help developing a scheme of work. Please explain: 1) How to structure a CBC scheme of work, 2) Key learning areas to cover, 3) Progression planning, 4) Assessment criteria. Provide detailed guidance.";
          break;
        case 'assessment':
          prompt = "I need assessment ideas for my lessons. Please suggest: 1) Formative assessment methods, 2) Summative assessment strategies, 3) Creative evaluation techniques, 4) Student feedback methods. Be specific and practical.";
          break;
        case 'activities':
          prompt = "I need engaging learning activities. Please suggest: 1) Interactive classroom activities, 2) Group work ideas, 3) Hands-on experiments, 4) Creative learning experiences. Focus on CBC principles and student engagement.";
          break;
        case 'curriculum':
          prompt = "I need help with curriculum alignment. Please explain: 1) How to align content with CBC learning outcomes, 2) Competency standards, 3) Assessment criteria, 4) Cross-curricular connections. Provide practical guidance.";
          break;
        case 'resources':
          prompt = "I need teaching resource recommendations. Please suggest: 1) Appropriate textbooks and materials, 2) Digital resources, 3) Manipulatives and tools, 4) Supplementary materials. Focus on CBC-aligned resources.";
          break;
        default:
          prompt = "I need educational assistance. Please provide helpful guidance for teachers.";
      }

      const aiResponse = await callAIAPI(prompt);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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

  const SuggestionsPanel = () => (
    <Paper sx={{ 
      p: { xs: 2, md: 3 }, 
      height: isMobile ? 'auto' : 'fit-content',
      maxHeight: isMobile ? '60vh' : 'none',
      overflow: 'auto'
    }}>
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
          <Grid item xs={12} sm={6} md={12} key={suggestion.id}>
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
              <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
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
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      position: 'relative'
    }}>
      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Container maxWidth="xl" sx={{ 
          py: { xs: 1, md: 3 }, 
          px: { xs: 1, md: 3 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Grid container spacing={{ xs: 1, md: 3 }} sx={{ height: '100%' }}>
            {/* AI Suggestions Panel - Desktop */}
            {!isMobile && (
              <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                <Box sx={{ height: '100%', overflow: 'auto' }}>
                  <SuggestionsPanel />
                </Box>
              </Grid>
            )}

            {/* Chat Interface */}
            <Grid item xs={12} md={isMobile ? 12 : 8} sx={{ height: '100%' }}>
              <Paper sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                minHeight: { xs: '500px', md: '600px' }
              }}>
                {/* Chat Header */}
                <Box sx={{ 
                  p: { xs: 1.5, md: 2 }, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                      <Psychology />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        Elimu Hub AI Assistant
                      </Typography>
                      <Chip label="Online" color="success" size="small" />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {isMobile && (
                      <IconButton 
                        onClick={() => setSuggestionsOpen(true)}
                        size="small"
                        title="Show Suggestions"
                      >
                        <Menu />
                      </IconButton>
                    )}
                    <IconButton onClick={handleClearChat} title="Clear Chat" size="small">
                      <Clear />
                    </IconButton>
                  </Box>
                </Box>

                {/* Messages Area */}
                <Box sx={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  p: { xs: 1, md: 2 },
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <List sx={{ flex: 1 }}>
                    {messages.map((message) => (
                      <ListItem
                        key={message.id}
                        sx={{
                          flexDirection: 'column',
                          alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                          mb: 2,
                          px: 0,
                        }}
                      >
                        <Paper
                          sx={{
                            p: { xs: 1.5, md: 2 },
                            maxWidth: { xs: '90%', sm: '85%', md: '80%' },
                            minWidth: { xs: '60%', sm: '50%' },
                            bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                            color: message.sender === 'user' ? 'white' : 'text.primary',
                            wordBreak: 'break-word',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {message.content}
                          </Typography>
                          {message.sender === 'ai' && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(message.content)}
                                sx={{ color: 'text.secondary', p: 0.5 }}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                              <IconButton size="small" sx={{ color: 'text.secondary', p: 0.5 }}>
                                <ThumbUp fontSize="small" />
                              </IconButton>
                              <IconButton size="small" sx={{ color: 'text.secondary', p: 0.5 }}>
                                <ThumbDown fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Paper>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          {message.timestamp.toLocaleTimeString()}
                        </Typography>
                      </ListItem>
                    ))}
                    {isLoading && (
                      <ListItem sx={{ justifyContent: 'flex-start', px: 0 }}>
                        <Paper sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'grey.100' }}>
                          <Typography variant="body2" color="text.secondary">
                            AI is thinking...
                          </Typography>
                        </Paper>
                      </ListItem>
                    )}
                    <div ref={messagesEndRef} />
                  </List>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Fixed Input Area at Bottom */}
      <Box sx={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 1000,
        p: { xs: 1.5, md: 2 },
        boxShadow: 3
      }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              placeholder="Ask me anything about lesson planning, curriculum, or teaching strategies..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              multiline
              maxRows={3}
              size={isSmallMobile ? "small" : "medium"}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              sx={{ 
                minWidth: 'auto', 
                px: { xs: 1.5, md: 2 },
                py: { xs: 1, md: 1.5 },
                height: 'fit-content'
              }}
            >
              <Send />
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Mobile Suggestions Drawer */}
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={suggestionsOpen}
          onClose={() => setSuggestionsOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80vh',
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                AI Assistance Options
              </Typography>
              <IconButton onClick={() => setSuggestionsOpen(false)}>
                <Close />
              </IconButton>
            </Box>
            <SuggestionsPanel />
          </Box>
        </Drawer>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="AI Suggestions"
          onClick={() => setSuggestionsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 16,
            zIndex: 1000,
          }}
        >
          <Psychology />
        </Fab>
      )}
    </Box>
  );
};

export default AIAssistant;
