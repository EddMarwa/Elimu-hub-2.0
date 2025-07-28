import React from 'react';
import { Typography, Box, Grid, Card, CardContent } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Lesson Plans</Typography>
              <Typography variant="body2" color="text.secondary">
                Create and manage CBC-compliant lesson plans
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Schemes of Work</Typography>
              <Typography variant="body2" color="text.secondary">
                Generate comprehensive schemes of work
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Documents</Typography>
              <Typography variant="body2" color="text.secondary">
                Upload and manage curriculum documents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;