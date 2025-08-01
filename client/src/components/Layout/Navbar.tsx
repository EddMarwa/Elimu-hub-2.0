import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  Assignment,
  Description,
  School,
  Settings,
  ExitToApp,
  Notifications,
  SupervisorAccount,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const navigationItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['teacher', 'admin', 'super_admin'] },
    { text: 'Lesson Plans', icon: <Assignment />, path: '/lesson-plans', roles: ['teacher', 'admin', 'super_admin'] },
    { text: 'Lesson Plan Generator', icon: <Assignment />, path: '/lesson-plan-generator', roles: ['teacher', 'admin', 'super_admin'] },
    { text: 'Schemes of Work', icon: <Description />, path: '/schemes-of-work', roles: ['teacher', 'admin', 'super_admin'] },
    { text: 'Scheme Generator', icon: <Description />, path: '/scheme-generator', roles: ['teacher', 'admin', 'super_admin'] },
    { text: 'Documents', icon: <School />, path: '/documents', roles: ['teacher', 'admin', 'super_admin'] },
    { text: 'User Management', icon: <SupervisorAccount />, path: '/admin/users', roles: ['admin', 'super_admin'] },
    { text: 'System Settings', icon: <AdminPanelSettings />, path: '/admin/settings', roles: ['super_admin'] },
  ];

  const filteredNavigationItems = navigationItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const drawer = (
    <Box sx={{ width: 250 }} onClick={handleDrawerToggle}>
      <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" noWrap>
          ElimuHub 2.0
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          CBC Education Platform
        </Typography>
      </Box>
      <Divider />
      <List>
        {filteredNavigationItems.map((item) => (
          <ListItem
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon sx={{ color: 'primary.main' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem onClick={() => navigate('/profile')} sx={{ cursor: 'pointer' }}>
          <ListItemIcon sx={{ color: 'primary.main' }}>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        <ListItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  if (!user) {
    return (
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            ElimuHub 2.0
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => navigate('/login')}
            sx={{ mr: 1 }}
          >
            Login
          </Button>
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={() => navigate('/register')}
            sx={{ 
              borderColor: 'white', 
              '&:hover': { 
                borderColor: 'secondary.main',
                bgcolor: 'secondary.main',
                color: 'primary.main'
              } 
            }}
          >
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            ElimuHub 2.0
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
              {filteredNavigationItems.slice(0, 4).map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  startIcon={item.icon}
                  sx={{
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          <IconButton color="inherit" onClick={handleNotificationClick} sx={{ mr: 1 }}>
            <Badge badgeContent={3} color="secondary">
              <Notifications />
            </Badge>
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {user.role?.replace('_', ' ')}
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={handleProfileMenuOpen}>
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'secondary.main',
                  color: 'primary.main',
                  fontWeight: 'bold'
                }}
              >
                {user.firstName?.[0]}{user.lastName?.[0]}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <AccountCircle sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
          <Settings sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ExitToApp sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 300,
            maxHeight: 400,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              New lesson plan template available
            </Typography>
            <Typography variant="caption" color="text.secondary">
              2 hours ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              Your scheme of work was approved
            </Typography>
            <Typography variant="caption" color="text.secondary">
              1 day ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              System maintenance scheduled
            </Typography>
            <Typography variant="caption" color="text.secondary">
              3 days ago
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationClose}>
          <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center' }}>
            View All Notifications
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navbar;
