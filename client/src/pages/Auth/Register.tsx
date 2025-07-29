import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
  Avatar,
  Fade,
  Slide,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  School,
  LocationOn,
  Subject
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Kenya counties list
const kenyanCounties = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
  'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui',
  'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

// CBC subjects
const cbcSubjects = [
  'English', 'Kiswahili', 'Mathematics', 'Science & Technology',
  'Social Studies', 'Creative Arts', 'Physical Education',
  'Religious Education', 'Life Skills', 'Pastoral Instruction',
  'Foreign Languages', 'Kenya Sign Language', 'Braille',
  'Indigenous Languages', 'Computer Science', 'Home Science',
  'Agriculture', 'Business Studies', 'Geography', 'History',
  'Government', 'Physics', 'Chemistry', 'Biology'
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  school: string;
  county: string;
  subjects: string[];
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    county: '',
    subjects: []
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError('');
  };

  const handleCountyChange = (event: SelectChangeEvent) => {
    setFormData(prev => ({
      ...prev,
      county: event.target.value
    }));
  };

  const handleSubjectsChange = (event: SelectChangeEvent<typeof formData.subjects>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      subjects: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.school.trim()) {
      setError('School name is required');
      return false;
    }
    if (!formData.county) {
      setError('Please select your county');
      return false;
    }
    if (formData.subjects.length === 0) {
      setError('Please select at least one subject you teach');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateStep3()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        school: formData.school,
        county: formData.county,
        subjects: formData.subjects
      });
      
      setSuccess('Registration successful! Redirecting to dashboard...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          margin: -3,
          padding: 3
        }}
      >
        <Slide direction="down" in={true} timeout={800}>
          <Paper 
            elevation={24} 
            sx={{ 
              padding: 4, 
              width: '100%',
              maxWidth: 600,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Header */}
            <Fade in={true} timeout={1000}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    mx: 'auto',
                    mb: 2,
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    fontSize: '2rem'
                  }}
                >
                  📚
                </Avatar>
                <Typography 
                  component="h1" 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  ElimuHub 2.0
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Join Our Teaching Community
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your account to access CBC resources and lesson plans
                </Typography>
              </Box>
            </Fade>

            {/* Progress Indicator */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              {[1, 2, 3].map((stepNumber) => (
                <Box
                  key={stepNumber}
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: step >= stepNumber ? '#667eea' : '#e0e0e0',
                    color: step >= stepNumber ? 'white' : '#999',
                    mx: 1,
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}
                >
                  {stepNumber}
                </Box>
              ))}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Registration Form */}
            <Fade in={true} timeout={1200}>
              <Box component="form" onSubmit={step === 3 ? handleSubmit : undefined}>
                {/* Alerts */}
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}

                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, color: '#667eea' }}>
                      Personal Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          value={formData.firstName}
                          onChange={handleInputChange('firstName')}
                          required
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          value={formData.lastName}
                          onChange={handleInputChange('lastName')}
                          required
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange('email')}
                          required
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Step 2: Password Setup */}
                {step === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, color: '#667eea' }}>
                      Security Setup
                    </Typography>
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      margin="normal"
                      required
                      disabled={loading}
                      helperText="Password must be at least 6 characters long"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              disabled={loading}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      margin="normal"
                      required
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              disabled={loading}
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                )}

                {/* Step 3: Professional Information */}
                {step === 3 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, color: '#667eea' }}>
                      Professional Information
                    </Typography>
                    <TextField
                      fullWidth
                      label="School Name"
                      value={formData.school}
                      onChange={handleInputChange('school')}
                      margin="normal"
                      required
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <School color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <FormControl fullWidth margin="normal" required>
                      <InputLabel>County</InputLabel>
                      <Select
                        value={formData.county}
                        onChange={handleCountyChange}
                        input={<OutlinedInput label="County" />}
                        disabled={loading}
                        startAdornment={
                          <InputAdornment position="start">
                            <LocationOn color="action" />
                          </InputAdornment>
                        }
                      >
                        {kenyanCounties.map((county) => (
                          <MenuItem key={county} value={county}>
                            {county}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal" required>
                      <InputLabel>Subjects You Teach</InputLabel>
                      <Select
                        multiple
                        value={formData.subjects}
                        onChange={handleSubjectsChange}
                        input={<OutlinedInput label="Subjects You Teach" />}
                        disabled={loading}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip 
                                key={value} 
                                label={value} 
                                size="small"
                                sx={{ backgroundColor: '#667eea', color: 'white' }}
                              />
                            ))}
                          </Box>
                        )}
                        startAdornment={
                          <InputAdornment position="start">
                            <Subject color="action" />
                          </InputAdornment>
                        }
                      >
                        {cbcSubjects.map((subject) => (
                          <MenuItem key={subject} value={subject}>
                            {subject}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  {step > 1 ? (
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      disabled={loading}
                      sx={{ 
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#5a6fd8',
                          backgroundColor: 'rgba(102, 126, 234, 0.04)'
                        }
                      }}
                    >
                      Back
                    </Button>
                  ) : (
                    <Box />
                  )}

                  {step < 3 ? (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={loading}
                      sx={{
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5a6fd8, #6b4190)',
                        }
                      }}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5a6fd8, #6b4190)',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                        },
                        '&:disabled': {
                          background: 'rgba(0, 0, 0, 0.12)',
                        },
                      }}
                    >
                      {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={20} color="inherit" />
                          Creating Account...
                        </Box>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  )}
                </Box>

                {/* Footer Links */}
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate('/login')}
                      sx={{ 
                        color: '#667eea',
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Sign In
                    </Button>
                  </Typography>
                </Box>
              </Box>
            </Fade>
          </Paper>
        </Slide>

        {/* Footer */}
        <Fade in={true} timeout={1600}>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 3, 
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center'
            }}
          >
            © 2025 ElimuHub 2.0 - Empowering Kenyan Teachers with CBC Resources
          </Typography>
        </Fade>
      </Box>
    </Container>
  );
};

export default Register;