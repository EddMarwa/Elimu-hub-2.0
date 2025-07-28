import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Typography, Container } from '@mui/material';

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
        <Container maxWidth="lg">
          <Typography variant="h6">
            ElimuHub 2.0 - CBC Lesson Plans & Schemes of Work
          </Typography>
        </Container>
      </Box>
      
      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;