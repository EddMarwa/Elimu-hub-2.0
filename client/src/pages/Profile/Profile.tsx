import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Chip,
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
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Person,
  Email,
  School,
  LocationOn,
  Phone,
  Notifications,
  Security,
  Palette,
  Language,
  AccessTime,
  SaveAlt,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  school?: string;
  county?: string;
  bio?: string;
  avatar?: string;
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
    timezone: string;
  };
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    school: '',
    county: '',
    bio: '',
    avatar: '',
    preferences: {
      notifications: true,
      darkMode: false,
      language: 'English',
      timezone: 'Africa/Nairobi',
    },
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        school: user.school || '',
        county: user.county || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'English',
          timezone: 'Africa/Nairobi',
        },
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (preference: keyof UserProfile['preferences'], value: any) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preference]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!profile.firstName || !profile.lastName || !profile.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user context
      if (updateUser) {
        await updateUser({
          ...user,
          ...profile
        });
      }
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        school: user.school || '',
        county: user.county || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'English',
          timezone: 'Africa/Nairobi',
        },
      });
    }
    setIsEditing(false);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;

    setUploadingAvatar(true);
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update avatar (in real app, this would be the uploaded file URL)
      const avatarUrl = URL.createObjectURL(selectedFile);
      setProfile(prev => ({ ...prev, avatar: avatarUrl }));
      
      setAvatarDialogOpen(false);
      setSelectedFile(null);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">Please log in to access your profile.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          Profile Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your personal information and preferences
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Personal Information
              </Typography>
              {!isEditing ? (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="School"
                  value={profile.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="County"
                  value={profile.county}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Preferences */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Preferences
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={profile.preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    label="Language"
                  >
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="Kiswahili">Kiswahili</MenuItem>
                    <MenuItem value="French">French</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={profile.preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                    label="Timezone"
                  >
                    <MenuItem value="Africa/Nairobi">Nairobi (GMT+3)</MenuItem>
                    <MenuItem value="Africa/Dar_es_Salaam">Dar es Salaam (GMT+3)</MenuItem>
                    <MenuItem value="Africa/Kampala">Kampala (GMT+3)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.notifications}
                      onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                    />
                  }
                  label="Enable Notifications"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.darkMode}
                      onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                    />
                  }
                  label="Dark Mode"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Avatar Section */}
          <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={profile.avatar}
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: '3rem',
                  border: '4px solid',
                  borderColor: 'primary.main',
                }}
              >
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
                onClick={() => setAvatarDialogOpen(true)}
              >
                <PhotoCamera />
              </IconButton>
            </Box>
            <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
              {profile.firstName} {profile.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user.role?.replace('_', ' ')}
            </Typography>
            <Chip
              icon={<School />}
              label={profile.school || 'School not specified'}
              variant="outlined"
              size="small"
            />
          </Paper>

          {/* Quick Stats */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Account Statistics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <AccessTime />
                </ListItemIcon>
                <ListItemText primary="Member Since" secondary={new Date().toLocaleDateString()} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SaveAlt />
                </ListItemIcon>
                <ListItemText primary="Last Updated" secondary={new Date().toLocaleDateString()} />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="avatar-upload">
              <Button variant="outlined" component="span" startIcon={<PhotoCamera />}>
                Choose Image
              </Button>
            </label>
            {selectedFile && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected: {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAvatarUpload}
            variant="contained"
            disabled={!selectedFile || uploadingAvatar}
            startIcon={uploadingAvatar ? <CircularProgress size={20} /> : <SaveAlt />}
          >
            {uploadingAvatar ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;