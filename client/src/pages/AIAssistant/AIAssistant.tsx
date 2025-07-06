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
  Divider,
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
  SmartToy,
  AutoAwesome,
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
  // IMPORTANT: Set REACT_APP_GROQ_API_KEY and REACT_APP_GROQ_API_URL in your .env file (never commit secrets)
  const API_KEY = process.env.REACT_APP_GROQ_API_KEY || '';
  const API_URL = process.env.REACT_APP_GROQ_API_URL || '';

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
      p: 2, 
      height: '100%',
      borderRadius: 2,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          bgcolor: 'primary.main', 
          borderRadius: '50%', 
          p: 0.8, 
          mr: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <AutoAwesome sx={{ color: 'white', fontSize: 16 }} />
        </Box>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', fontSize: '1rem' }}>
          AI Tools
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.4, fontSize: '0.8rem' }}>
        Quick access to AI-powered educational assistance
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        {suggestions.map((suggestion) => (
          <Card
            key={suggestion.id}
            variant="outlined"
            sx={{
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 1.5,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderColor: 'primary.main',
                bgcolor: 'rgba(25, 118, 210, 0.04)',
              },
            }}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  bgcolor: 'primary.light', 
                  borderRadius: 0.8, 
                  p: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 28,
                  height: 28
                }}>
                  {suggestion.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.25, fontSize: '0.75rem' }}>
                    {suggestion.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                    {suggestion.description}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Alert severity="info" sx={{ mt: 2, borderRadius: 1.5, py: 0.5 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          <strong>💡 Pro Tip:</strong> Be specific with your requests for better AI responses.
        </Typography>
      </Alert>
    </Paper>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      position: 'relative',
      bgcolor: '#f8fafc'
    }}>
      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        pb: { xs: '65px', md: '75px' } // Reduced padding bottom
      }}>
        <Container maxWidth="xl" sx={{ 
          py: { xs: 1, md: 2 }, 
          px: { xs: 1, md: 2 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Grid container spacing={{ xs: 1, md: 2 }} sx={{ height: '100%' }}>
            {/* AI Suggestions Panel - Desktop */}
            {!isMobile && (
              <Grid item xs={12} md={3} sx={{ height: '100%' }}>
                <Box sx={{ height: '100%' }}>
                  <SuggestionsPanel />
                </Box>
              </Grid>
            )}

            {/* Chat Interface */}
            <Grid item xs={12} md={isMobile ? 12 : 9} sx={{ height: '100%' }}>
              <Paper sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                minHeight: { xs: '500px', md: '600px' },
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                {/* Chat Header */}
                <Box sx={{ 
                  p: { xs: 1, md: 1.5 }, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  minHeight: { xs: '60px', md: '70px' }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      mr: 1.5, 
                      width: { xs: 32, md: 40 }, 
                      height: { xs: 32, md: 40 },
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}>
                      <SmartToy sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ 
                        fontSize: { xs: '0.9rem', md: '1.1rem' },
                        color: 'white',
                        lineHeight: 1.2,
                        mb: 0.5
                      }}>
                        Elimu Hub AI Assistant
                      </Typography>
                      <Chip 
                        label="Online" 
                        color="success" 
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(76, 175, 80, 0.9)',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                          height: '20px'
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {isMobile && (
                      <IconButton 
                        onClick={() => setSuggestionsOpen(true)}
                        size="small"
                        title="Show Suggestions"
                        sx={{ 
                          color: 'white',
                          p: 0.5,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                      >
                        <Menu sx={{ fontSize: '1.2rem' }} />
                      </IconButton>
                    )}
                    <IconButton 
                      onClick={handleClearChat} 
                      title="Clear Chat" 
                      size="small"
                      sx={{ 
                        color: 'white',
                        p: 0.5,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <Clear sx={{ fontSize: '1.2rem' }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Messages Area */}
                <Box sx={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  p: { xs: 1.5, md: 2 },
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: '#fafbfc'
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
                            bgcolor: message.sender === 'user' 
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : 'white',
                            color: message.sender === 'user' ? 'white' : 'text.primary',
                            wordBreak: 'break-word',
                            borderRadius: 3,
                            boxShadow: message.sender === 'user' 
                              ? '0 4px 15px rgba(102, 126, 234, 0.3)'
                              : '0 2px 8px rgba(0,0,0,0.1)',
                            border: message.sender === 'user' 
                              ? 'none'
                              : '1px solid rgba(0,0,0,0.08)',
                            position: 'relative',
                            '&::before': message.sender === 'user' ? {
                              content: '""',
                              position: 'absolute',
                              right: -8,
                              top: 12,
                              width: 0,
                              height: 0,
                              borderLeft: '8px solid #667eea',
                              borderTop: '8px solid transparent',
                              borderBottom: '8px solid transparent',
                            } : {
                              content: '""',
                              position: 'absolute',
                              left: -8,
                              top: 12,
                              width: 0,
                              height: 0,
                              borderRight: '8px solid white',
                              borderTop: '8px solid transparent',
                              borderBottom: '8px solid transparent',
                            }
                          }}
                        >
                          <Typography variant="body2" sx={{ 
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            lineHeight: 1.6
                          }}>
                            {message.content}
                          </Typography>
                          {message.sender === 'ai' && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, flexWrap: 'wrap' }}>
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(message.content)}
                                sx={{ 
                                  color: 'text.secondary', 
                                  p: 0.5,
                                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                                }}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                              <IconButton size="small" sx={{ 
                                color: 'text.secondary', 
                                p: 0.5,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                              }}>
                                <ThumbUp fontSize="small" />
                              </IconButton>
                              <IconButton size="small" sx={{ 
                                color: 'text.secondary', 
                                p: 0.5,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                              }}>
                                <ThumbDown fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Paper>
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          mt: 0.5, 
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          opacity: 0.7
                        }}>
                          {message.timestamp.toLocaleTimeString()}
                        </Typography>
                      </ListItem>
                    ))}
                    {isLoading && (
                      <ListItem sx={{ justifyContent: 'flex-start', px: 0 }}>
                        <Paper sx={{ 
                          p: { xs: 1.5, md: 2 }, 
                          bgcolor: 'white',
                          borderRadius: 3,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          border: '1px solid rgba(0,0,0,0.08)'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '50%', 
                              bgcolor: 'primary.main',
                              animation: 'pulse 1.5s ease-in-out infinite'
                            }} />
                            <Typography variant="body2" color="text.secondary">
                              AI is thinking...
                            </Typography>
                          </Box>
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

      {/* Fixed Input Area at Bottom - Only for Chat Area */}
      <Box sx={{ 
        position: 'fixed',
        bottom: 0,
        left: isMobile ? 0 : '25%', // Start after sidebar on desktop
        right: 0,
        bgcolor: 'white',
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 1000,
        p: { xs: 0.5, md: 0.75 }, // Further reduced padding
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <Container maxWidth="xl" sx={{ pl: 0, pr: 0 }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 0.75, // Further reduced gap
            alignItems: 'flex-end',
            bgcolor: 'white',
            borderRadius: 2,
            p: 0.5, // Further reduced padding
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            <TextField
              fullWidth
              placeholder="Ask me anything about lesson planning, curriculum, or teaching strategies..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              multiline
              maxRows={2}
              size="small"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.75rem', md: '0.8rem' }, // Smaller font
                  borderRadius: 1.5,
                  minHeight: '36px', // Smaller fixed height
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              sx={{ 
                minWidth: 'auto', 
                px: 1, // Reduced padding
                py: 0.5, // Reduced padding
                height: '36px', // Smaller fixed height
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                },
                '&:disabled': {
                  background: 'rgba(0,0,0,0.12)',
                  transform: 'none',
                  boxShadow: 'none',
                }
              }}
            >
              <Send sx={{ fontSize: '1rem' }} />
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
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '80vh',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>
                AI Tools
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
            bottom: 75, // Further adjusted position
            right: 16,
            zIndex: 1000,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              transform: 'scale(1.1)',
            }
          }}
        >
          <AutoAwesome />
        </Fab>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Box>
  );
};

export default AIAssistant;
