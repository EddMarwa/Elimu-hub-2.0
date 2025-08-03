import React from 'react';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon, Home } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const routeMap: Record<string, string> = {
  dashboard: 'Dashboard',
  'lesson-plans': 'Lesson Plans',
  'lesson-plan-generator': 'Lesson Plan Generator', 
  'schemes-of-work': 'Schemes of Work',
  'scheme-generator': 'Scheme Generator',
  'scheme-editor': 'Scheme Editor',
  upload: 'Upload',
  reference: 'Reference',
  'cbc-transition': 'CBC Transition',
  documents: 'Documents',
  profile: 'Profile',
  admin: 'Admin',
  users: 'User Management',
  settings: 'System Settings',
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', path: '/dashboard' }
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    if (index === pathSegments.length - 1) {
      // Last item should not be clickable
      breadcrumbItems.push({ label });
    } else {
      breadcrumbItems.push({ label, path: currentPath });
    }
  });

  // Don't show breadcrumbs on dashboard (home) page
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    return null;
  }

  return (
    <Box sx={{ mb: 2, px: { xs: 2, md: 3 }, py: 1 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary',
          },
        }}
      >
        {breadcrumbItems.map((item, index) => {
          if (item.path) {
            return (
              <Link
                key={index}
                color="inherit"
                onClick={() => navigate(item.path!)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                }}
              >
                {index === 0 && <Home sx={{ mr: 0.5, fontSize: 20 }} />}
                {item.label}
              </Link>
            );
          }
          
          return (
            <Typography
              key={index}
              color="text.primary"
              sx={{
                fontWeight: 'medium',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {item.label}
            </Typography>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default Breadcrumb;
