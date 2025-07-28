import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Documents from './pages/Documents/Documents';
import LessonPlans from './pages/LessonPlans/LessonPlans';
import SchemesOfWork from './pages/SchemesOfWork/SchemesOfWork';
import Profile from './pages/Profile/Profile';
import Upload from './pages/Upload/Upload';
import Reference from './pages/Reference/Reference';
import LessonPlanGenerator from './pages/LessonPlanGenerator/LessonPlanGenerator';
import SchemeOfWorkEditor from './pages/SchemeOfWorkEditor/SchemeOfWorkEditor';
import CBCTransition from './pages/CBCTransition/CBCTransition';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/Common/LoadingSpinner';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={user ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="reference" element={<Reference />} />
          <Route path="lesson-plan-generator" element={<LessonPlanGenerator />} />
          <Route path="scheme-of-work-editor" element={<SchemeOfWorkEditor />} />
          <Route path="cbc-transition" element={<CBCTransition />} />
          <Route path="documents" element={<Documents />} />
          <Route path="lesson-plans" element={<LessonPlans />} />
          <Route path="schemes-of-work" element={<SchemesOfWork />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
};

export default App;