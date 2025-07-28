import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';

const Register: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            ElimuHub 2.0
          </Typography>
          <Typography variant="h5" align="center" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Registration functionality to be implemented
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;