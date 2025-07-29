import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Navigation Bar */}
      <Navbar />
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          p: { xs: 2, md: 3 },
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)', // Subtract navbar height
        }}
      >
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;