// Import React hooks and core functionality
import React, { useState, useRef, useEffect } from 'react';

// Import Material-UI components for building the interface
import {
  Container, Paper, Typography, Box, TextField, Button, Grid, Card, CardContent,
  Avatar, Chip, Alert, List, ListItem, IconButton, useTheme, useMediaQuery,
  Drawer, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  AppBar, Toolbar, Badge, Tooltip, LinearProgress, Fade, Slide, Zoom,
} from '@mui/material';

// Import Material-UI icons for various UI elements
import {
  Psychology, Send, School, Assignment, Description, Lightbulb, Quiz, MenuBook,
  Clear, ContentCopy, ThumbUp, ThumbDown, Menu, Close, SmartToy, AutoAwesome,
  Assessment, Search, Download, OpenInNew, Refresh, Settings, Help,
  Notifications, Person, DarkMode, LightMode,
} from '@mui/icons-material';

// Import custom hooks and services
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Interface defining the structure of chat messages
interface Message {
  id: string;                    // Unique identifier for each message
  content: string;               // The actual message text content
  sender: 'user' | 'ai';        // Who sent the message (user or AI)
  timestamp: Date;               // When the message was sent
  type?: 'text' | 'suggestion'; // Optional message type for different content
}

// Interface defining the structure of AI tool suggestions
interface AISuggestion {
  id: string;                    // Unique identifier for each suggestion
  title: string;                 // Display name of the AI tool
  description: string;           // Brief description of what the tool does
  icon: React.ReactNode;         // Icon component to display
  action: string;                // Action identifier for handling clicks
  color?: string;                // Optional color theme for the tool
}

// Main AI Assistant component
const AIAssistant: React.FC = () => {
  // Get current authenticated user from context
  const { user } = useAuth();
  
  // Get current theme for responsive design
  const theme = useTheme();
  
  // Check if device is mobile for responsive behavior
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Reference to scroll to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // ===== STATE MANAGEMENT =====
  
  // UI State - Controls visibility of various components
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);           // Mobile suggestions drawer
  const [referencesDrawerOpen, setReferencesDrawerOpen] = useState(false); // References panel
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);     // Question generation dialog
  const [rubricDialogOpen, setRubricDialogOpen] = useState(false);         // Rubric generation dialog
  
  // Chat State - Manages conversation flow
  const [messages, setMessages] = useState<Message[]>([
    // Welcome message from AI
    {
      id: '1',
      content: `Hello ${user?.firstName || 'there'}! I'm your Elimu Hub AI Assistant. I'm here to help you with lesson planning, curriculum development, and educational content creation. How can I assist you today?`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');                    // Current input text
  const [isLoading, setIsLoading] = useState(false);                       // AI response loading state
  
  // Data State - Stores various content and references
  const [references, setReferences] = useState<any[]>([]);                 // Educational references
  const [searchQuery, setSearchQuery] = useState('');                      // Search query for references
  
  // Form State - Manages dialog form inputs
  const [formSubject, setFormSubject] = useState('');                      // Subject for questions/rubrics
  const [formGrade, setFormGrade] = useState('');                          // Grade level for questions/rubrics
  const [formTopic, setFormTopic] = useState('');                          // Topic for questions/rubrics
  const [formNumQuestions, setFormNumQuestions] = useState(10);            // Number of questions to generate
  
  // Theme State
  const [darkMode, setDarkMode] = useState(false);                         // Dark/light mode toggle

  // ===== AI TOOL SUGGESTIONS =====
  // Array of available AI-powered educational tools with their configurations
  const suggestions: AISuggestion[] = [
    {
      id: '1', 
      title: 'Lesson Plans', 
      description: 'Generate comprehensive CBC-aligned lesson plans',
      icon: <Assignment />, 
      action: 'lesson-plan', 
      color: '#2196F3', // Blue
    },
    {
      id: '2', 
      title: 'Scheme of Work', 
      description: 'Create structured schemes aligned with CBC curriculum',
      icon: <Description />, 
      action: 'scheme-of-work', 
      color: '#4CAF50', // Green
    },
    {
      id: '3', 
      title: 'Assessment Ideas', 
      description: 'Get creative assessment and evaluation methods',
      icon: <Quiz />, 
      action: 'assessment', 
      color: '#FF9800', // Orange
    },
    {
      id: '4', 
      title: 'Learning Activities', 
      description: 'Discover engaging activities and teaching strategies',
      icon: <Lightbulb />, 
      action: 'activities', 
      color: '#9C27B0', // Purple
    },
    {
      id: '5', 
      title: 'Curriculum Alignment', 
      description: 'Ensure content aligns with CBC learning objectives',
      icon: <School />, 
      action: 'curriculum', 
      color: '#607D8B', // Blue-Grey
    },
    {
      id: '6', 
      title: 'Resource Suggestions', 
      description: 'Get recommendations for teaching materials',
      icon: <MenuBook />, 
      action: 'resources', 
      color: '#795548', // Brown
    },
    {
      id: '7', 
      title: 'Generate Questions', 
      description: 'Create exam-style questions with answers',
      icon: <AutoAwesome />, 
      action: 'generate-questions', 
      color: '#E91E63', // Pink
    },
    {
      id: '8', 
      title: 'Grading Rubric', 
      description: 'Get CBC-aligned grading rubrics',
      icon: <Assessment />, 
      action: 'grading-rubric', 
      color: '#00BCD4', // Cyan
    },
    {
      id: '9', 
      title: 'References', 
      description: 'Find relevant notes and documents',
      icon: <MenuBook />, 
      action: 'references', 
      color: '#3F51B5', // Indigo
    },
  ];

  // ===== EFFECTS =====
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ===== AI API INTEGRATION =====
  
  /**
   * Calls OpenAI API to generate educational content
   * @param prompt - The user's question or request
   * @returns Promise<string> - AI-generated response
   */
  const callAIAPI = async (prompt: string): Promise<string> => {
    try {
      // Make request to OpenAI Chat Completions API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',           // Use GPT-3.5 for cost-effective responses
          messages: [
            {
              role: 'system',
              content: 'You are an expert in Kenyan CBC (Competency-Based Curriculum) education. Generate detailed, practical, and CBC-compliant educational content for teachers. Be helpful, informative, and provide actionable advice.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,                  // Limit response length for cost control
          temperature: 0.7,                   // Balance creativity with consistency
        }),
      });

      // Handle API errors
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      
      // Parse and return AI response
      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I encountered an error. Please try again.';
    } catch (error) {
      console.error('AI API Error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  };

  // ===== MESSAGE HANDLING =====
  
  /**
   * Handles sending user messages and receiving AI responses
   * Manages the complete message flow from user input to AI response
   */
  const handleSendMessage = async () => {
    // Prevent sending empty messages
    if (!inputMessage.trim()) return;

    // Create and add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    // Update messages state and clear input
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get AI response from OpenAI API
      const aiResponse = await callAIAPI(inputMessage);
      
      // Create and add AI message to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Add error message if AI call fails
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
    setSuggestionsOpen(false);

    try {
      let prompt = '';
      switch (suggestion.action) {
        case 'lesson-plan':
          prompt = "I need help creating a lesson plan. Please provide guidance on: 1) How to structure a CBC-aligned lesson plan, 2) Key components to include, 3) Assessment strategies, 4) Learning activities. Give me a comprehensive overview.";
          break;
        case 'scheme-of-work':
          prompt = "I need help developing a scheme of work. Please explain: 1) How to structure a CBC scheme of work, 2) Key learning areas to cover, 3) Progression planning, 4) Assessment criteria. Provide detailed guidance.";
          break;
        case 'generate-questions': {
          setQuestionDialogOpen(true);
          setIsLoading(false);
          return;
        }
        case 'grading-rubric': {
          setRubricDialogOpen(true);
          setIsLoading(false);
          return;
        }
        case 'references': {
          setReferencesDrawerOpen(true);
          setIsLoading(false);
          return;
        }
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

  const submitQuestions = async () => {
    if (!formSubject || !formGrade || !formTopic) return;
    setQuestionDialogOpen(false);
    setIsLoading(true);
    try {
      const res = await api.post('/ai/questions', { subject: formSubject, grade: formGrade, topic: formTopic, numQuestions: formNumQuestions, difficulty: 'mixed' });
      const json = res.data?.data;
      setMessages(prev => [...prev, { id: (Date.now() + 3).toString(), sender: 'ai', timestamp: new Date(), content: JSON.stringify(json, null, 2), type: 'text' }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 3).toString(), sender: 'ai', timestamp: new Date(), content: 'Failed to generate questions.', type: 'text' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitRubric = async () => {
    if (!formSubject || !formGrade || !formTopic) return;
    setRubricDialogOpen(false);
    setIsLoading(true);
    try {
      const res = await api.post('/ai/grading-rubric', { subject: formSubject, grade: formGrade, topic: formTopic });
      const json = res.data?.data;
      setMessages(prev => [...prev, { id: (Date.now() + 4).toString(), sender: 'ai', timestamp: new Date(), content: JSON.stringify(json, null, 2), type: 'text' }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 4).toString(), sender: 'ai', timestamp: new Date(), content: 'Failed to generate rubric.', type: 'text' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReferences = async (query: string) => {
    try {
      const res = await api.get('/ai/references', { params: { q: query, tags: 'library,lesson-plan,scheme' } });
      setReferences(res.data?.data || []);
    } catch {
      setReferences([]);
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '16px 16px 0 0'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
            <AutoAwesome />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              AI Tools
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.95, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              Quick access to educational assistance
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          height: '100%'
        }}>
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.id}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: 3,
                border: `2px solid ${suggestion.color}20`,
                bgcolor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                minHeight: 60,
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: `0 6px 20px ${suggestion.color}30`,
                  borderColor: suggestion.color,
                  bgcolor: `${suggestion.color}05`,
                },
              }}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ 
                    bgcolor: suggestion.color, 
                    borderRadius: 2, 
                    p: 1,
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    minWidth: 36,
                    height: 36,
                    boxShadow: `0 2px 8px ${suggestion.color}40`
                  }}>
                    {suggestion.icon}
                  </Box>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="bold" 
                    sx={{ 
                      color: suggestion.color,
                      fontSize: '1rem',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    {suggestion.title}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
      </Box>
  );

  return (
    <Box sx={{ 
      height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      bgcolor: '#f8fafc',
      overflow: 'hidden'
    }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="primary">
                Elimu Hub AI
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Your Educational Assistant
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="References">
              <IconButton onClick={() => { setReferencesDrawerOpen(true); loadReferences('cbc references'); }}>
                <MenuBook />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Theme">
              <IconButton onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <Settings />
              </IconButton>
            </Tooltip>
            <Tooltip title="Help">
              <IconButton>
                <Help />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Suggestions Panel - Desktop */}
            {!isMobile && (
          <Box sx={{ 
            width: 320, 
            borderRight: '1px solid rgba(0,0,0,0.08)',
            bgcolor: '#fafbfc',
            boxShadow: '2px 0 20px rgba(0,0,0,0.05)'
          }}>
                  <SuggestionsPanel />
                </Box>
        )}

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Chat Header */}
                <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            bgcolor: 'white',
                  display: 'flex',
                  alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <SmartToy />
                    </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  AI Assistant
                      </Typography>
                      <Chip 
                        label="Online" 
                        color="success" 
                        size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
                    {isMobile && (
                <Tooltip title="AI Tools">
                  <IconButton onClick={() => setSuggestionsOpen(true)}>
                    <Menu />
                      </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Clear Chat">
                <IconButton onClick={handleClearChat}>
                  <Clear />
                    </IconButton>
              </Tooltip>
                  </Box>
                </Box>

          {/* Messages */}
                <Box sx={{ 
                  flex: 1, 
                  overflow: 'auto', 
            p: 2,
                  bgcolor: '#fafbfc'
                }}>
                    {messages.map((message) => (
              <Box
                        key={message.id}
                        sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Paper
                          sx={{
                    p: 2,
                    maxWidth: '70%',
                    borderRadius: 3,
                            bgcolor: message.sender === 'user' 
                      ? 'primary.main'
                              : 'white',
                            color: message.sender === 'user' ? 'white' : 'text.primary',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            position: 'relative',
                  }}
                >
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                            {message.content}
                          </Typography>
                  
                          {message.sender === 'ai' && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
                      <Tooltip title="Copy">
                        <IconButton size="small" onClick={() => copyToClipboard(message.content)}>
                                <ContentCopy fontSize="small" />
                              </IconButton>
                      </Tooltip>
                      <Tooltip title="Like">
                        <IconButton size="small">
                                <ThumbUp fontSize="small" />
                              </IconButton>
                      </Tooltip>
                      <Tooltip title="Dislike">
                        <IconButton size="small">
                                <ThumbDown fontSize="small" />
                              </IconButton>
                      </Tooltip>
                            </Box>
                          )}
                        </Paper>
              </Box>
            ))}
            
                    {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'white' }}>
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
              </Box>
                    )}
                    <div ref={messagesEndRef} />
      </Box>

          {/* Input Area */}
      <Box sx={{ 
            p: 2, 
            borderTop: '1px solid rgba(0,0,0,0.08)',
            bgcolor: 'white',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.03)'
          }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5,
            alignItems: 'flex-end',
            bgcolor: '#f8fafc',
            borderRadius: 3,
            p: 1.5,
            border: '1px solid rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
              bgcolor: 'white'
            }
          }}>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <TextField
                fullWidth
                placeholder="Ask me anything about lesson planning, curriculum, or teaching strategies..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                multiline
                maxRows={3}
                variant="standard"
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    '&:before': { borderBottom: 'none' },
                    '&:after': { borderBottom: 'none' },
                    '&:hover:before': { borderBottom: 'none' }
                  },
                  '& .MuiInputBase-input': {
                    padding: '8px 0',
                    color: '#1a1a1a'
                  }
                }}
              />
              {inputMessage.length > 0 && (
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: -18, 
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {inputMessage.length} chars
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setInputMessage('')}
                    sx={{ 
                      minWidth: 'auto', 
                      p: 0.5,
                      color: 'text.secondary',
                      '&:hover': { color: 'error.main' }
                    }}
                  >
                    <Clear fontSize="small" />
                  </Button>
                </Box>
              )}
            </Box>
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              sx={{ 
                minWidth: 'auto', 
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: 'primary.main',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                },
                '&:disabled': {
                  bgcolor: 'grey.400',
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              <Send sx={{ fontSize: '1.2rem' }} />
            </Button>
          </Box>
          
          {/* Quick Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 0.8, 
            mt: 1.5, 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {[
              { text: 'Lesson plan', icon: <Assignment fontSize="small" /> },
              { text: 'Questions', icon: <Quiz fontSize="small" /> },
              { text: 'Curriculum', icon: <School fontSize="small" /> },
              { text: 'Assessment', icon: <Assessment fontSize="small" /> }
            ].map((action, index) => (
              <Button
                key={index}
                size="small"
                variant="outlined"
                startIcon={action.icon}
                onClick={() => setInputMessage(action.text)}
                sx={{
                  borderRadius: 16,
                  px: 1.5,
                  py: 0.4,
                  fontSize: '0.75rem',
                  borderColor: 'primary.light',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.light',
                    color: 'white'
                  }
                }}
              >
                {action.text}
              </Button>
            ))}
          </Box>
          </Box>
        </Box>
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
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" color="primary">
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
          aria-label="AI Tools"
          onClick={() => setSuggestionsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <AutoAwesome />
        </Fab>
      )}

      {/* Question Dialog */}
      <Dialog 
        open={questionDialogOpen} 
        onClose={() => setQuestionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">Generate Questions</Typography>
          <Typography variant="body2" color="text.secondary">
            Create exam-style questions for your students
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Subject" 
                value={formSubject} 
                onChange={(e) => setFormSubject(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Grade" 
                value={formGrade} 
                onChange={(e) => setFormGrade(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Topic" 
                value={formTopic} 
                onChange={(e) => setFormTopic(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                type="number" 
                label="Number of Questions" 
                value={formNumQuestions} 
                onChange={(e) => setFormNumQuestions(parseInt(e.target.value || '10'))}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setQuestionDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={submitQuestions} 
            disabled={!formSubject || !formGrade || !formTopic}
          >
            Generate Questions
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rubric Dialog */}
      <Dialog 
        open={rubricDialogOpen} 
        onClose={() => setRubricDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">Generate Grading Rubric</Typography>
          <Typography variant="body2" color="text.secondary">
            Create assessment rubrics aligned with CBC standards
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Subject" 
                value={formSubject} 
                onChange={(e) => setFormSubject(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Grade" 
                value={formGrade} 
                onChange={(e) => setFormGrade(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Topic" 
                value={formTopic} 
                onChange={(e) => setFormTopic(e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setRubricDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={submitRubric} 
            disabled={!formSubject || !formGrade || !formTopic}
          >
            Generate Rubric
          </Button>
        </DialogActions>
      </Dialog>

      {/* References Drawer */}
      <Drawer 
        anchor="right" 
        open={referencesDrawerOpen} 
        onClose={() => setReferencesDrawerOpen(false)}
        PaperProps={{
          sx: { width: 400 }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              References
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Search and access educational resources
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField 
                fullWidth 
                size="small" 
                placeholder="Search references..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') loadReferences(searchQuery); }}
                variant="outlined"
              />
              <Button 
                variant="contained" 
                onClick={() => loadReferences(searchQuery || 'cbc references')}
                startIcon={<Search />}
              >
                Search
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {references.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <MenuBook sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No references found. Try searching for something else.
                </Typography>
              </Box>
            ) : (
              <List>
                {references.map((ref) => (
                  <ListItem key={ref.id} sx={{ display: 'block', mb: 2 }}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                          {ref.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                          {ref.type} • {(ref.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            size="small" 
                            component="a" 
                            href={ref.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            startIcon={<OpenInNew />}
                            variant="outlined"
                          >
                            Open
                          </Button>
                          <Button 
                            size="small" 
                            component="a" 
                            href={ref.url} 
                            download
                            startIcon={<Download />}
                            variant="contained"
                          >
                            Download
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>

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
