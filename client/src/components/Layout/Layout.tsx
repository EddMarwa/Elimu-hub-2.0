import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';
import Breadcrumb from '../Common/Breadcrumb';
import FloatingNavigation from '../Common/FloatingNavigation';

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', overflowX: 'hidden' }}>
      {/* Navigation Bar */}
      <Navbar />
      
      {/* Breadcrumb Navigation */}
      <Breadcrumb />
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          p: { xs: 1, sm: 2, md: 3 },
          pt: { xs: 0.5, sm: 1, md: 2 }, // Reduced top padding since breadcrumb provides spacing
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)', // Subtract navbar height
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 0.5, sm: 2, md: 3 } }}>
          <Outlet />
        </Container>
      </Box>
      
      {/* Floating Navigation */}
      <FloatingNavigation />
    </Box>
  );
};

export default Layout;