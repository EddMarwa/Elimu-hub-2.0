import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import LoginNew from './pages/Auth/LoginNew';
import Register from './pages/Auth/Register';
import RegisterNew from './pages/Auth/RegisterNew';
import Dashboard from './pages/Dashboard/Dashboard';
import DashboardEnhanced from './pages/Dashboard/DashboardEnhanced';
import UserManagement from './pages/Admin/UserManagement';
import SystemSettings from './pages/Admin/SystemSettings';
import Documents from './pages/Documents/Documents';
import SchemesOfWork from './pages/SchemesOfWork/SchemesOfWork';
import Profile from './pages/Profile/Profile';
import AIAssistant from './pages/AIAssistant/AIAssistant';
import Reference from './pages/Reference/Reference';
import BlankPage from './pages/BlankPage/BlankPage';
import SchemeOfWorkGenerator from './pages/SchemeOfWorkGenerator/SchemeOfWorkGenerator';
import SchemeOfWorkEditor from './pages/SchemeOfWorkEditor/SchemeOfWorkEditor';
import CBCTransition from './pages/CBCTransition/CBCTransition';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/Common/LoadingSpinner';
import { UserRole } from './types';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        {/* Public Home Page */}
        <Route 
          path="/" 
          element={!user ? <Home /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Public routes - Using new UI components */}
        <Route 
          path="/login" 
          element={!user ? <LoginNew /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!user ? <RegisterNew /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Legacy routes for testing */}
        <Route 
          path="/login-old" 
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register-old" 
          element={!user ? <Register /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register-old" 
          element={!user ? <Register /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={user ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardEnhanced />} />
          <Route path="dashboard-legacy" element={<Dashboard />} />
          
          {/* Admin routes */}
          <Route 
            path="admin/users" 
            element={
              user && [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role) ? 
              <UserManagement /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="admin/settings" 
            element={
              user && user.role === UserRole.SUPER_ADMIN ? 
              <SystemSettings /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
          
          {/* Regular app routes */}
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="reference" element={<Reference />} />
          <Route path="scheme-generator" element={<SchemeOfWorkGenerator />} />
          <Route path="scheme-editor" element={<SchemeOfWorkEditor />} />
          <Route path="cbc-transition" element={<CBCTransition />} />
          <Route path="documents" element={<Documents />} />
          <Route path="schemes-of-work" element={<SchemesOfWork />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Box>
  );
};

export default App;