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
              content: `Hello ${user?.firstName || 'there'}! I'm your Elimu Hub AI Assistant. I'm here to help you with curriculum development, scheme of work creation, and educational content creation. How can I assist you today?`,
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

  // Add at the top, after other useState hooks
  const [pendingVideoQuery, setPendingVideoQuery] = useState<string | null>(null);
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null);
  const [showVideoPrompt, setShowVideoPrompt] = useState(false);

  // Add state for feedback/bookmark
  const [videoFeedback, setVideoFeedback] = useState<{ [msgId: string]: 'up' | 'down' | undefined }>({});
  const [bookmarkedVideos, setBookmarkedVideos] = useState<{ [msgId: string]: boolean }>({});

  // ===== AI TOOL SUGGESTIONS =====
  // Array of available AI-powered educational tools with their configurations
  const suggestions: AISuggestion[] = [

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
  const callBackendAIChat = async (messages: { role: string; content: string }[]): Promise<string> => {
    try {
      const res = await api.post('/ai/chat', {
        messages,
      });
      return res.data?.data || 'Sorry, I encountered an error. Please try again.';
    } catch (error) {
      console.error('Backend AI chat error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  };

  // Utility to extract URLs from a string
  const extractReferences = (text: string): string[] => {
    // Simple URL regex
    const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)|(www\.[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;
    return text.match(urlRegex) || [];
  };

  // Utility to clean and shorten AI responses
  const cleanAIResponse = (text: string): string => {
    // Remove generic CBC intros and boilerplate
    let cleaned = text.replace(/(As an expert in Kenyan CBC.*?\.|I'm happy to help!|What specific topic or area would you like to discuss\?|Feel free to ask me any questions, and I'll do my best to help!|I can assist you with various topics, such as:.*?\d+\..*?\n?)+/gis, '').trim();
    // Limit to first 2-3 sentences or 80 words
    const sentences = cleaned.split(/(?<=[.!?])\s+/);
    let result = '';
    let wordCount = 0;
    for (const s of sentences) {
      const words = s.split(/\s+/);
      if (wordCount + words.length > 80) break;
      result += s + ' ';
      wordCount += words.length;
      if (wordCount > 60) break;
    }
    return result.trim();
  };

  // Update fetchYoutubeVideo to return video info
  const fetchYoutubeVideo = async (query: string): Promise<{ videoId: string, title: string, channelTitle: string } | null> => {
    try {
      const res = await api.get('/ai/youtube/search', { params: { q: query } });
      const video = res.data?.video;
      if (video && video.id?.videoId) {
        return {
          videoId: video.id.videoId,
          title: video.title,
          channelTitle: video.channelTitle,
        };
      }
      return null;
    } catch (e) {
      return null;
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
      // Build message history for backend
      const chatHistory = [
        { role: 'system', content: 'You are an expert in Kenyan CBC (Competency-Based Curriculum) education. Generate detailed, practical, and CBC-compliant educational content for teachers. Be helpful, informative, and provide actionable advice.' },
        ...[...messages, userMessage].map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content }))
      ];
      const aiResponse = await callBackendAIChat(chatHistory);
      
      // Create and add AI message to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      // Suggest a video if the AI response is descriptive (simple heuristic: > 30 words)
      if (aiResponse.split(/\s+/).length > 30) {
        setPendingVideoQuery(inputMessage);
        setShowVideoPrompt(true);
      }
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

  // In handleAcceptVideo, store video info in the message content as JSON
  const handleAcceptVideo = async () => {
    if (pendingVideoQuery) {
      const videoInfo = await fetchYoutubeVideo(pendingVideoQuery);
      if (videoInfo) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            content: `__YOUTUBE_VIDEO__:${JSON.stringify(videoInfo)}`,
            sender: 'ai',
            timestamp: new Date(),
          },
        ]);
      }
      setShowVideoPrompt(false);
      setPendingVideoQuery(null);
    }
  };

  // Handler for user declining video suggestion
  const handleDeclineVideo = () => {
    setShowVideoPrompt(false);
    setPendingVideoQuery(null);
  };

  // Feedback handlers
  const handleThumbsUp = (msgId: string) => setVideoFeedback(prev => ({ ...prev, [msgId]: 'up' }));
  const handleThumbsDown = (msgId: string) => setVideoFeedback(prev => ({ ...prev, [msgId]: 'down' }));
  const handleBookmark = (msgId: string) => setBookmarkedVideos(prev => ({ ...prev, [msgId]: !prev[msgId] }));

  // ===== SUGGESTION HANDLING =====
  
  /**
   * Handles clicks on AI tool suggestions
   * Creates appropriate prompts based on the selected tool and generates AI responses
   * @param suggestion - The selected AI tool suggestion
   */
  const handleSuggestionClick = async (suggestion: AISuggestion) => {
    // Create a user message indicating the selected tool
    const suggestionMessage: Message = {
      id: Date.now().toString(),
      content: `Help me with: ${suggestion.title}`,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add message to chat and show loading state
    setMessages(prev => [...prev, suggestionMessage]);
    setIsLoading(true);
    setSuggestionsOpen(false);

    try {
      let prompt = '';
      
      // Generate specific prompts based on the selected tool
      switch (suggestion.action) {

        case 'scheme-of-work':
          prompt = "I need help developing a scheme of work. Please explain: 1) How to structure a CBC scheme of work, 2) Key learning areas to cover, 3) Progression planning, 4) Assessment criteria. Provide detailed guidance.";
          break;
        case 'generate-questions': {
          // Open question generation dialog instead of API call
          setQuestionDialogOpen(true);
          setIsLoading(false);
          return;
        }
        case 'grading-rubric': {
          // Open rubric generation dialog instead of API call
          setRubricDialogOpen(true);
          setIsLoading(false);
          return;
        }
        case 'references': {
          // Open references panel instead of API call
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

      // Build message history for backend
      const chatHistory = [
        { role: 'system', content: 'You are an expert in Kenyan CBC (Competency-Based Curriculum) education. Generate detailed, practical, and CBC-compliant educational content for teachers. Be helpful, informative, and provide actionable advice.' },
        ...[...messages, suggestionMessage, { id: '', content: prompt, sender: 'user', timestamp: new Date() }].map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content }))
      ];
      const aiResponse = await callBackendAIChat(chatHistory);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Handle errors gracefully
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

  // ===== DIALOG HANDLERS =====
  
  /**
   * Submits question generation form and calls AI API
   * Generates educational questions based on form inputs
   */
  const submitQuestions = async () => {
    // Validate required form fields
    if (!formSubject || !formGrade || !formTopic) return;
    
    // Close dialog and show loading state
    setQuestionDialogOpen(false);
    setIsLoading(true);
    
    try {
      // Call backend API to generate questions
      const res = await api.post('/ai/questions', { 
        subject: formSubject, 
        grade: formGrade, 
        topic: formTopic, 
        numQuestions: formNumQuestions, 
        difficulty: 'mixed' 
      });
      
      // Extract and format response data
      const json = res.data?.data;
      
      // Add generated questions to chat
      setMessages(prev => [...prev, { 
        id: (Date.now() + 3).toString(), 
        sender: 'ai', 
        timestamp: new Date(), 
        content: JSON.stringify(json, null, 2), 
        type: 'text' 
      }]);
    } catch (e) {
      // Handle errors gracefully
      setMessages(prev => [...prev, { 
        id: (Date.now() + 3).toString(), 
        sender: 'ai', 
        timestamp: new Date(), 
        content: 'Failed to generate questions.', 
        type: 'text' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submits rubric generation form and calls AI API
   * Generates grading rubrics based on form inputs
   */
  const submitRubric = async () => {
    // Validate required form fields
    if (!formSubject || !formGrade || !formTopic) return;
    
    // Close dialog and show loading state
    setRubricDialogOpen(false);
    setIsLoading(true);
    
    try {
      // Call backend API to generate grading rubric
      const res = await api.post('/ai/grading-rubric', { 
        subject: formSubject, 
        grade: formGrade, 
        topic: formTopic 
      });
      
      // Extract and format response data
      const json = res.data?.data;
      
      // Add generated rubric to chat
      setMessages(prev => [...prev, { 
        id: (Date.now() + 4).toString(), 
        sender: 'ai', 
        timestamp: new Date(), 
        content: JSON.stringify(json, null, 2), 
        type: 'text' 
      }]);
    } catch (e) {
      // Handle errors gracefully
      setMessages(prev => [...prev, { 
        id: (Date.now() + 4).toString(), 
        sender: 'ai', 
        timestamp: new Date(), 
        content: 'Failed to generate rubric.', 
        type: 'text' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== UTILITY FUNCTIONS =====
  
  /**
   * Loads educational references from the backend
   * Searches for relevant documents and materials
   * @param query - Search query string
   */
  const loadReferences = async (query: string) => {
    try {
      // Search for references with specific tags
      const res = await api.get('/ai/references', { 
        params: { 
          q: query, 
          tags: 'library,scheme' 
        } 
      });
      
      // Update references state with search results
      setReferences(res.data?.data || []);
    } catch {
      // Clear references on error
      setReferences([]);
    }
  };

  /**
   * Clears the chat history and resets to welcome message
   * Provides a fresh start for new conversations
   */
  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        content: `Hello ${user?.firstName || 'there'}! I'm your Elimu Hub AI Assistant. I'm here to help you with curriculum development, scheme of work creation, and educational content creation. How can I assist you today?`,
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
  };

  /**
   * Copies text content to the user's clipboard
   * Used for copying AI responses or generated content
   * @param content - Text content to copy
   */
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // ===== UI COMPONENTS =====
  
  /**
   * SuggestionsPanel Component
   * Displays the sidebar with AI tool suggestions
   * Shows available educational tools that users can click to get help
   */
  const SuggestionsPanel = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section - Gradient background with AI Tools title */}
      <Box sx={{ 
        p: 2, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px 12px 0 0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1.5, width: 32, height: 32 }}>
            <AutoAwesome sx={{ fontSize: '1.1rem' }} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)', fontSize: '1rem' }}>
              AI Tools
            </Typography>
            <Typography variant="caption" sx={{ color: 'white', opacity: 0.95, textShadow: '0 1px 2px rgba(0,0,0,0.2)', fontSize: '0.75rem' }}>
              Quick access to educational assistance
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tools List Section - Scrollable list of AI tool suggestions */}
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          height: '100%'
        }}>
          {/* Map through suggestions to create clickable tool cards */}
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

  // ===== MAIN RENDER =====
  
  /**
   * Main component render
   * Returns the complete AI Assistant interface with:
   * - App bar with navigation and controls
   * - Sidebar with AI tool suggestions (desktop)
   * - Chat area with message history
   * - Input section for user messages
   * - Mobile-responsive design
   */
  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f8fafc',
      overflow: 'hidden'
    }}>
      {/* App Bar - Top navigation with branding and controls */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left side - Branding */}
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
          
          {/* Right side - Action buttons */}
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

      {/* Main Content Area - Contains sidebar and chat */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Suggestions Panel - Desktop sidebar with AI tools */}
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

        {/* Chat Area - Main conversation interface */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Chat Header - Shows AI status and controls */}
          <Box sx={{ 
            p: 1.5, 
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
            
            {/* Chat controls - Mobile menu and clear chat */}
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

          {/* Messages Section - Scrollable chat history */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 1.5,
            bgcolor: '#fafbfc'
          }}>
            {/* Render each message in the conversation */}
            {messages.map((message) => {
              const isAI = message.sender === 'ai';
              const cleanedContent = isAI ? cleanAIResponse(message.content) : message.content;
              return (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1.5,
                  }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      borderRadius: 2,
                      bgcolor: isAI ? 'rgba(232, 244, 253, 0.8)' : 'primary.main',
                      color: isAI ? 'text.primary' : 'white',
                      boxShadow: isAI ? '0 2px 8px rgba(33, 150, 243, 0.08)' : '0 1px 4px rgba(0,0,0,0.08)',
                      border: isAI ? '1.5px solid #90caf9' : undefined,
                      position: 'relative',
                    }}
                  >
                    {isAI && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <SmartToy sx={{ color: '#1976d2', mr: 1, fontSize: 20 }} />
                        <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 600 }}>
                          Elimu Hub AI
                        </Typography>
                      </Box>
                    )}
                    {isAI && message.content.startsWith('__YOUTUBE_VIDEO__:') ? (() => {
                      const videoInfo = JSON.parse(message.content.replace('__YOUTUBE_VIDEO__:', ''));
                      return (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">{videoInfo.title}</Typography>
                          <Typography variant="caption" color="text.secondary">by {videoInfo.channelTitle}</Typography>
                          <iframe
                            width="360"
                            height="215"
                            src={`https://www.youtube.com/embed/${videoInfo.videoId}`}
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title="YouTube video"
                            style={{ borderRadius: 8, marginTop: 8, marginBottom: 8 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Button
                              size="small"
                              variant={videoFeedback[message.id] === 'up' ? 'contained' : 'outlined'}
                              color="success"
                              onClick={() => handleThumbsUp(message.id)}
                            >
                              👍 Helpful
                            </Button>
                            <Button
                              size="small"
                              variant={videoFeedback[message.id] === 'down' ? 'contained' : 'outlined'}
                              color="error"
                              onClick={() => handleThumbsDown(message.id)}
                            >
                              👎 Not helpful
                            </Button>
                            <Button
                              size="small"
                              variant={bookmarkedVideos[message.id] ? 'contained' : 'outlined'}
                              color="primary"
                              onClick={() => handleBookmark(message.id)}
                            >
                              {bookmarkedVideos[message.id] ? '🔖 Saved' : '🔖 Save'}
                            </Button>
                          </Box>
                        </Box>
                      );
                    })() : (
                      <Typography variant="body2" sx={{ lineHeight: 1.5, fontSize: '0.98rem', fontStyle: isAI ? 'italic' : 'normal' }}>
                        {cleanedContent}
                      </Typography>
                    )}
                    {/* AI message actions - Copy, Like, Dislike */}
                    {isAI && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
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
                    {/* References below AI message */}
                    {isAI && extractReferences(message.content).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {extractReferences(message.content).map((ref, idx) => (
                          <Typography
                            key={idx}
                            variant="body2"
                            sx={{ color: 'green', fontStyle: 'italic', wordBreak: 'break-all' }}
                          >
                            <a href={ref.startsWith('http') ? ref : `https://${ref}`} target="_blank" rel="noopener noreferrer" style={{ color: 'green', fontStyle: 'italic', textDecoration: 'underline' }}>
                              {ref}
                            </a>
                          </Typography>
                        ))}
                      </Box>
                    )}
                    {/* Timestamp below message */}
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: isAI ? '#1976d2' : 'white', textAlign: 'right', opacity: 0.7 }}>
                      {message.timestamp instanceof Date ? message.timestamp.toLocaleString() : new Date(message.timestamp).toLocaleString()}
                    </Typography>
                  </Paper>
                </Box>
              );
            })}
            
            {/* Loading indicator - Shows when AI is processing */}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Animated loading dot */}
                    <Box sx={{ 
                      width: 14, 
                      height: 14, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      AI is thinking...
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
            
            {/* Invisible div for auto-scrolling to bottom */}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area - User message input and controls */}
          <Box sx={{ 
            p: 1, 
            borderTop: '1px solid rgba(0,0,0,0.08)',
            bgcolor: 'white',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'center'
          }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            alignItems: 'flex-end',
            bgcolor: '#f8fafc',
            borderRadius: 2,
            p: 1,
            border: '1px solid rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
            maxWidth: '80%',
            width: '100%',
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
              bgcolor: 'white'
            }
          }}>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <TextField
                fullWidth
                placeholder="Ask me anything about curriculum development, scheme of work creation, or teaching strategies..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                multiline
                maxRows={2}
                variant="standard"
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    '&:before': { borderBottom: 'none' },
                    '&:after': { borderBottom: 'none' },
                    '&:hover:before': { borderBottom: 'none' }
                  },
                  '& .MuiInputBase-input': {
                    padding: '6px 0',
                    color: '#1a1a1a'
                  }
                }}
              />
              {inputMessage.length > 0 && (
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: -16, 
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {inputMessage.length} chars
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setInputMessage('')}
                    sx={{ 
                      minWidth: 'auto', 
                      p: 0.4,
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
                px: 1.2,
                py: 0.6,
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
              <Send sx={{ fontSize: '0.9rem' }} />
            </Button>
          </Box>
          
          {/* Quick Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            mt: 1, 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {[
      
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
                  borderRadius: 12,
                  px: 1.2,
                  py: 0.3,
                  fontSize: '0.7rem',
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

      {/* Video Suggestion Prompt Dialog */}
      {showVideoPrompt && (
        <Dialog open onClose={handleDeclineVideo}>
          <DialogTitle>Would you like to see a related video?</DialogTitle>
          <DialogActions>
            <Button onClick={handleDeclineVideo}>No, thanks</Button>
            <Button onClick={handleAcceptVideo} variant="contained">Yes, show video</Button>
          </DialogActions>
        </Dialog>
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
