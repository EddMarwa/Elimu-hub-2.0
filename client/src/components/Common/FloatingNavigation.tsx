import React, { useState } from 'react';
import {
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Zoom,
  useScrollTrigger,
  Box,
} from '@mui/material';
import {
  KeyboardArrowUp,
  Assignment,
  AutoAwesome,
  Description,
  Psychology,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface FloatingNavigationProps {
  window?: () => Window;
}

const FloatingNavigation: React.FC<FloatingNavigationProps> = (props) => {
  const { window } = props;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
    disableHysteresis: true,
    threshold: 100,
  });

  const scrollToTop = () => {
    const anchor = document.querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }
  };

  const speedDialActions = [
    {
      icon: <Assignment />,
      name: 'New Scheme of Work',
      action: () => navigate('/scheme-generator'),
    },
    {
      icon: <Description />,
      name: 'New Scheme of Work',
      action: () => navigate('/scheme-generator'),
    },
    {
      icon: <Psychology />,
      name: 'AI Assistant',
      action: () => navigate('/ai-assistant'),
    },
    {
      icon: <AutoAwesome />,
      name: 'Quick Generate',
      action: () => navigate('/ai-assistant'),
    },
  ];

  const filteredActions = speedDialActions.filter(() => 
    user?.role && ['teacher', 'admin', 'super_admin'].includes(user.role)
  );

  if (!user) return null;

  return (
    <>
      {/* Back to top anchor */}
      <Box id="back-to-top-anchor" />
      
      {/* Speed Dial for quick actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ 
          position: 'fixed', 
          bottom: 80, 
          right: 16,
          zIndex: 1000,
          '& .MuiSpeedDial-fab': {
            bgcolor: 'secondary.main',
            '&:hover': {
              bgcolor: 'secondary.dark',
            },
          },
        }}
        icon={<SpeedDialIcon />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        direction="up"
      >
        {filteredActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.action();
              setOpen(false);
            }}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            }}
          />
        ))}
      </SpeedDial>

      {/* Back to top button */}
      <Zoom in={trigger}>
        <Fab
          onClick={scrollToTop}
          color="primary"
          size="small"
          aria-label="scroll back to top"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Zoom>
    </>
  );
};

export default FloatingNavigation;
