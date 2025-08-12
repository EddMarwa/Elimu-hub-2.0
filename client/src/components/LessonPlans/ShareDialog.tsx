import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Share, ContentCopy, Email, Link } from '@mui/icons-material';
import { lessonPlansAPI } from '../../services/api';
import { toast } from 'react-toastify';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  lessonPlanId: string;
  lessonPlanTitle: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  lessonPlanId,
  lessonPlanTitle,
}) => {
  const [shareType, setShareType] = useState<'link' | 'email'>('link');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const shareUrl = `${window.location.origin}/lesson-plans/${lessonPlanId}`;

  const handleShare = async () => {
    if (shareType === 'email' && !email.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (shareType === 'email') {
        await lessonPlansAPI.shareLessonPlan(lessonPlanId, {
          email,
          message,
          type: 'email'
        });
        toast.success('Lesson plan shared via email');
      } else {
        // For link sharing, we just copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      }

      onClose();
    } catch (error) {
      console.error('Error sharing lesson plan:', error);
      setError('Failed to share lesson plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleClose = () => {
    setEmail('');
    setMessage('');
    setError('');
    setShareType('link');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Share Lesson Plan
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Share "{lessonPlanTitle}" with others
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Share Type Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Share Method</InputLabel>
          <Select
            value={shareType}
            onChange={(e) => setShareType(e.target.value as 'link' | 'email')}
            label="Share Method"
          >
            <MenuItem value="link">
              <Box display="flex" alignItems="center" gap={1}>
                <Link />
                Share Link
              </Box>
            </MenuItem>
            <MenuItem value="email">
              <Box display="flex" alignItems="center" gap={1}>
                <Email />
                Share via Email
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {shareType === 'link' ? (
          /* Link Sharing */
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Direct Link
            </Typography>
            <Box display="flex" gap={1} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                fullWidth
                value={shareUrl}
                InputProps={{ readOnly: true }}
                size="small"
              />
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={handleCopyLink}
              >
                Copy
              </Button>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
              }
              label="Make this lesson plan publicly accessible"
            />
            
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Anyone with the link can view and download this lesson plan
            </Typography>
          </Box>
        ) : (
          /* Email Sharing */
          <Box>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Message (Optional)"
              multiline
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              sx={{ mb: 2 }}
            />
            
            <Typography variant="caption" color="text.secondary">
              The recipient will receive an email with a link to this lesson plan
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleShare}
          variant="contained"
          startIcon={<Share />}
          disabled={submitting || (shareType === 'email' && !email.trim())}
        >
          {submitting ? <CircularProgress size={20} /> : 'Share'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
