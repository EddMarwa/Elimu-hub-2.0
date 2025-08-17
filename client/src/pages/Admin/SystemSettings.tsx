import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Settings,
  Analytics,
  Security,
  Storage,
  Notifications,
  Backup,
  Restore,
  Refresh,
  Save,
  Warning,
  CheckCircle,
  Error,
  ExpandMore,
  SystemUpdate,
  Database,
  CloudUpload,
  CloudDownload,
  Monitor,
  Speed,
  Memory,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface SystemConfig {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireTwoFactor: boolean;
    passwordPolicy: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    notificationFrequency: string;
  };
  storage: {
    maxStoragePerUser: number;
    backupFrequency: string;
    retentionPolicy: string;
    compressionEnabled: boolean;
  };
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  storageUsed: number;
  systemUptime: number;
  lastBackup: string;
  databaseSize: number;
  cacheHitRate: number;
}

const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      siteName: 'ElimuHub 2.0',
      siteDescription: 'CBC Education Platform',
      maintenanceMode: false,
      maxFileSize: 10,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      requireTwoFactor: false,
      passwordPolicy: 'strong',
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      notificationFrequency: 'daily',
    },
    storage: {
      maxStoragePerUser: 1000,
      backupFrequency: 'daily',
      retentionPolicy: '30 days',
      compressionEnabled: true,
    },
  });

  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalFiles: 0,
    storageUsed: 0,
    systemUptime: 0,
    lastBackup: '',
    databaseSize: 0,
    cacheHitRate: 0,
  });

  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupInProgress, setBackupInProgress] = useState(false);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalUsers: 1250,
        activeUsers: 890,
        totalFiles: 5670,
        storageUsed: 45.2,
        systemUptime: 99.8,
        lastBackup: new Date().toISOString(),
        databaseSize: 2.3,
        cacheHitRate: 94.5,
      });
    } catch (error) {
      toast.error('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('System configuration saved successfully!');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      const newMode = !config.general.maintenanceMode;
      handleConfigChange('general', 'maintenanceMode', newMode);
      
      if (newMode) {
        toast.warning('Maintenance mode enabled. Users will see maintenance page.');
      } else {
        toast.success('Maintenance mode disabled. System is now accessible.');
      }
    } catch (error) {
      toast.error('Failed to toggle maintenance mode');
    }
  };

  const handleSystemBackup = async () => {
    setBackupInProgress(true);
    setBackupProgress(0);
    
    try {
      // Simulate backup process
      for (let i = 0; i <= 100; i += 10) {
        setBackupProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      toast.success('System backup completed successfully!');
      setBackupDialogOpen(false);
    } catch (error) {
      toast.error('Backup failed. Please try again.');
    } finally {
      setBackupInProgress(false);
      setBackupProgress(0);
    }
  };

  const handleSystemRestore = async () => {
    if (!window.confirm('Are you sure you want to restore the system? This will overwrite current data.')) {
      return;
    }
    
    try {
      toast.info('System restore initiated. This may take several minutes.');
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('System restore completed successfully!');
    } catch (error) {
      toast.error('System restore failed.');
    }
  };

  const handleCacheClear = async () => {
    try {
      toast.info('Clearing system cache...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('System cache cleared successfully!');
      loadSystemStats(); // Refresh stats
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  // Check if user has permission to access system settings
  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">
          You don't have permission to access system settings. Only Super Administrators can access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure system-wide settings, monitor performance, and manage system operations
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* System Statistics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                System Overview
              </Typography>
              <Button
                startIcon={<Refresh />}
                onClick={loadSystemStats}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {stats.totalUsers.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {stats.activeUsers.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Users
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {stats.totalFiles.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Files
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {stats.storageUsed} GB
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Storage Used
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Configuration Sections */}
        <Grid item xs={12} md={8}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings />
                <Typography variant="h6">General Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Site Name"
                    value={config.general.siteName}
                    onChange={(e) => handleConfigChange('general', 'siteName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max File Size (MB)"
                    type="number"
                    value={config.general.maxFileSize}
                    onChange={(e) => handleConfigChange('general', 'maxFileSize', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Site Description"
                    multiline
                    rows={2}
                    value={config.general.siteDescription}
                    onChange={(e) => handleConfigChange('general', 'siteDescription', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.general.maintenanceMode}
                        onChange={handleMaintenanceToggle}
                        color="warning"
                      />
                    }
                    label="Maintenance Mode"
                  />
                  {config.general.maintenanceMode && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      System is currently in maintenance mode. Users will see a maintenance page.
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security />
                <Typography variant="h6">Security Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Session Timeout (minutes)"
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Login Attempts"
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Password Policy</InputLabel>
                    <Select
                      value={config.security.passwordPolicy}
                      onChange={(e) => handleConfigChange('security', 'passwordPolicy', e.target.value)}
                      label="Password Policy"
                    >
                      <MenuItem value="basic">Basic (6+ characters)</MenuItem>
                      <MenuItem value="strong">Strong (8+ chars, mixed case, numbers)</MenuItem>
                      <MenuItem value="very-strong">Very Strong (10+ chars, special chars)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.security.requireTwoFactor}
                        onChange={(e) => handleConfigChange('security', 'requireTwoFactor', e.target.checked)}
                      />
                    }
                    label="Require Two-Factor Authentication"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage />
                <Typography variant="h6">Storage Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Storage per User (MB)"
                    type="number"
                    value={config.storage.maxStoragePerUser}
                    onChange={(e) => handleConfigChange('storage', 'maxStoragePerUser', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Backup Frequency</InputLabel>
                    <Select
                      value={config.storage.backupFrequency}
                      onChange={(e) => handleConfigChange('storage', 'backupFrequency', e.target.value)}
                      label="Backup Frequency"
                    >
                      <MenuItem value="hourly">Hourly</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.storage.compressionEnabled}
                        onChange={(e) => handleConfigChange('storage', 'compressionEnabled', e.target.checked)}
                      />
                    }
                    label="Enable File Compression"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              onClick={handleSaveConfig}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadSystemStats}
            >
              Reset to Defaults
            </Button>
          </Box>
        </Grid>

        {/* Quick Actions Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Quick Actions
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Backup />
                </ListItemIcon>
                <ListItemText primary="System Backup" />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={() => setBackupDialogOpen(true)}
                    disabled={backupInProgress}
                  >
                    Start
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Restore />
                </ListItemIcon>
                <ListItemText primary="System Restore" />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    color="warning"
                    onClick={handleSystemRestore}
                  >
                    Restore
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Refresh />
                </ListItemIcon>
                <ListItemText primary="Clear Cache" />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={handleCacheClear}
                  >
                    Clear
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>

          {/* System Health */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              System Health
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="System Uptime" 
                  secondary={`${stats.systemUptime}%`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Speed />
                </ListItemIcon>
                <ListItemText 
                  primary="Cache Hit Rate" 
                  secondary={`${stats.cacheHitRate}%`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Database />
                </ListItemIcon>
                <ListItemText 
                  primary="Database Size" 
                  secondary={`${stats.databaseSize} GB`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Storage Used" 
                  secondary={`${stats.storageUsed} GB`}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Maintenance Mode Dialog */}
      <Dialog open={maintenanceDialogOpen} onClose={() => setMaintenanceDialogOpen(false)}>
        <DialogTitle>Maintenance Mode</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to enable maintenance mode? This will make the system inaccessible to regular users.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMaintenanceToggle} color="warning" variant="contained">
            Enable Maintenance Mode
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>System Backup</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will create a complete backup of the system including all data, files, and configurations.
          </Typography>
          
          {backupInProgress && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Backup Progress: {backupProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={backupProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)} disabled={backupInProgress}>
            Cancel
          </Button>
          <Button
            onClick={handleSystemBackup}
            variant="contained"
            disabled={backupInProgress}
            startIcon={backupInProgress ? <CircularProgress size={20} /> : <Backup />}
          >
            {backupInProgress ? 'Backing Up...' : 'Start Backup'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SystemSettings;
