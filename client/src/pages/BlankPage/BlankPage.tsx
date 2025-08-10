import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const BlankPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Page Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This feature is under development.
        </Typography>
      </Box>
    </Container>
  );
};

export default BlankPage;
