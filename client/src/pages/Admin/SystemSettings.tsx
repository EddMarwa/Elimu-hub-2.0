import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Backup,
  Update,
  Analytics,
  Save,
  Refresh,
  Download,
  Upload,
  Delete,
  Info,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  description: string;
  value: string | boolean | number;
  type: 'text' | 'boolean' | 'number' | 'select';
  options?: string[];
  required: boolean;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  user?: string;
  action?: string;
}

const SystemSettings: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [backupDialog, setBackupDialog] = useState(false);

  useEffect(() => {
    // Mock system settings
    const mockSettings: SystemSetting[] = [
      {
        id: '1',
        category: 'general',
        name: 'Site Name',
        description: 'The name of the educational platform',
        value: 'Elimu Hub 2.0',
        type: 'text',
        required: true,
      },
      {
        id: '2',
        category: 'general',
        name: 'Maintenance Mode',
        description: 'Enable maintenance mode to prevent user access',
        value: false,
        type: 'boolean',
        required: false,
      },
      {
        id: '3',
        category: 'general',
        name: 'Default Language',
        description: 'Default language for the platform',
        value: 'English',
        type: 'select',
        options: ['English', 'Swahili', 'French'],
        required: true,
      },
      {
        id: '4',
        category: 'security',
        name: 'Password Minimum Length',
        description: 'Minimum password length for user accounts',
        value: 8,
        type: 'number',
        required: true,
      },
      {
        id: '5',
        category: 'security',
        name: 'Two-Factor Authentication',
        description: 'Require 2FA for admin accounts',
        value: true,
        type: 'boolean',
        required: false,
      },
      {
        id: '6',
        category: 'security',
        name: 'Session Timeout',
        description: 'Session timeout in minutes',
        value: 60,
        type: 'number',
        required: true,
      },
      {
        id: '7',
        category: 'ai',
        name: 'AI Provider',
        description: 'Primary AI service provider',
        value: 'Grok',
        type: 'select',
        options: ['Grok', 'OpenAI', 'Local'],
        required: true,
      },
      {
        id: '8',
        category: 'ai',
        name: 'Max Lesson Plans per Day',
        description: 'Maximum lesson plans a user can generate per day',
        value: 10,
        type: 'number',
        required: true,
      },
      {
        id: '9',
        category: 'ai',
        name: 'AI Content Moderation',
        description: 'Enable AI content moderation for generated content',
        value: true,
        type: 'boolean',
        required: false,
      },
      {
        id: '10',
        category: 'notifications',
        name: 'Email Notifications',
        description: 'Enable email notifications for users',
        value: true,
        type: 'boolean',
        required: false,
      },
      {
        id: '11',
        category: 'notifications',
        name: 'System Alerts',
        description: 'Send system alerts to administrators',
        value: true,
        type: 'boolean',
        required: false,
      },
    ];

    const mockLogs: SystemLog[] = [
      {
        id: '1',
        timestamp: '2025-07-29 14:30:25',
        level: 'INFO',
        message: 'System settings updated',
        user: 'admin@elimuhub.com',
        action: 'SETTINGS_UPDATE',
      },
      {
        id: '2',
        timestamp: '2025-07-29 13:15:10',
        level: 'WARNING',
        message: 'High CPU usage detected',
        action: 'SYSTEM_MONITOR',
      },
      {
        id: '3',
        timestamp: '2025-07-29 12:45:33',
        level: 'INFO',
        message: 'Database backup completed successfully',
        action: 'BACKUP_COMPLETE',
      },
      {
        id: '4',
        timestamp: '2025-07-29 11:20:15',
        level: 'ERROR',
        message: 'Failed to send notification email',
        action: 'EMAIL_ERROR',
      },
      {
        id: '5',
        timestamp: '2025-07-29 10:30:45',
        level: 'INFO',
        message: 'New user registration: teacher@school.edu',
        user: 'system',
        action: 'USER_REGISTRATION',
      },
    ];

    setSettings(mockSettings);
    setLogs(mockLogs);
  }, []);

  const handleSettingChange = (settingId: string, newValue: string | boolean | number) => {
    setSettings(settings.map(setting => 
      setting.id === settingId ? { ...setting, value: newValue } : setting
    ));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    // Simulate saving settings
    console.log('Saving settings:', settings);
    setHasChanges(false);
    // Add success message or notification here
  };

  const handleResetSettings = () => {
    // Reset to original values
    window.location.reload();
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <Warning color="error" />;
      case 'WARNING': return <Warning color="warning" />;
      case 'INFO': return <CheckCircle color="success" />;
      default: return <Info />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'error';
      case 'WARNING': return 'warning';
      case 'INFO': return 'success';
      default: return 'default';
    }
  };

  const categories = [
    { value: 'general', label: 'General', icon: <Settings /> },
    { value: 'security', label: 'Security', icon: <Security /> },
    { value: 'ai', label: 'AI Settings', icon: <Analytics /> },
    { value: 'notifications', label: 'Notifications', icon: <Notifications /> },
  ];

  const filteredSettings = settings.filter(setting => setting.category === selectedCategory);

  // Check if current user has permission
  if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">
          You don't have permission to access system settings.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure and monitor system-wide settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Settings Panel */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold">
                Configuration
              </Typography>
              <Box>
                {hasChanges && (
                  <Button
                    variant="outlined"
                    onClick={handleResetSettings}
                    sx={{ mr: 2 }}
                  >
                    Reset
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveSettings}
                  disabled={!hasChanges}
                >
                  Save Changes
                </Button>
              </Box>
            </Box>

            {/* Category Tabs */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                {categories.map((category) => (
                  <Grid item key={category.value}>
                    <Button
                      variant={selectedCategory === category.value ? 'contained' : 'outlined'}
                      startIcon={category.icon}
                      onClick={() => setSelectedCategory(category.value)}
                    >
                      {category.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Settings Form */}
            <Grid container spacing={3}>
              {filteredSettings.map((setting) => (
                <Grid item xs={12} md={6} key={setting.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {setting.name}
                        {setting.required && <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {setting.description}
                      </Typography>
                      
                      {setting.type === 'boolean' && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={setting.value as boolean}
                              onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
                            />
                          }
                          label={setting.value ? 'Enabled' : 'Disabled'}
                        />
                      )}

                      {setting.type === 'text' && (
                        <TextField
                          fullWidth
                          size="small"
                          value={setting.value as string}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          required={setting.required}
                        />
                      )}

                      {setting.type === 'number' && (
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={setting.value as number}
                          onChange={(e) => handleSettingChange(setting.id, parseInt(e.target.value) || 0)}
                          required={setting.required}
                        />
                      )}

                      {setting.type === 'select' && (
                        <FormControl fullWidth size="small">
                          <Select
                            value={setting.value as string}
                            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          >
                            {setting.options?.map((option) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* System Info & Actions */}
        <Grid item xs={12} lg={4}>
          {/* System Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              System Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Backup />}
                  onClick={() => setBackupDialog(true)}
                >
                  Create Backup
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                >
                  Export Settings
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Upload />}
                >
                  Import Settings
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Refresh />}
                >
                  Clear Cache
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* System Status */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              System Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Server Status
                </Typography>
                <Chip label="Online" color="success" size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Database
                </Typography>
                <Chip label="Connected" color="success" size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  AI Service
                </Typography>
                <Chip label="Active" color="success" size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Storage
                </Typography>
                <Chip label="78% Used" color="warning" size="small" />
              </Grid>
            </Grid>
          </Paper>

          {/* Recent Logs */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              System Logs
            </Typography>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.slice(0, 10).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.level}
                          color={getLogColor(log.level) as any}
                          size="small"
                          icon={getLogIcon(log.level)}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Backup Dialog */}
      <Dialog open={backupDialog} onClose={() => setBackupDialog(false)}>
        <DialogTitle>Create System Backup</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            This will create a full backup of the system including:
          </Typography>
          <ul>
            <li>Database</li>
            <li>User files</li>
            <li>System configuration</li>
            <li>Generated content</li>
          </ul>
          <Alert severity="info" sx={{ mt: 2 }}>
            The backup process may take several minutes to complete.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Schedule />}>
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SystemSettings;
