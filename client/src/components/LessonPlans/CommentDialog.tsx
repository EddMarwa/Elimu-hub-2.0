import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Person, Star } from '@mui/icons-material';
import { lessonPlansAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface Comment {
  id: string;
  content: string;
  rating: number;
  userId: string;
  lessonPlanId: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface CommentDialogProps {
  open: boolean;
  onClose: () => void;
  lessonPlanId: string;
  lessonPlanTitle: string;
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  open,
  onClose,
  lessonPlanId,
  lessonPlanTitle,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && lessonPlanId) {
      loadComments();
    }
  }, [open, lessonPlanId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await lessonPlansAPI.getComments(lessonPlanId);
      setComments(response.data.data);
    } catch (error) {
      console.error('Error loading comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || newRating === 0) {
      setError('Please provide both a comment and rating');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await lessonPlansAPI.addComment(lessonPlanId, {
        content: newComment,
        rating: newRating,
      });
      
      toast.success('Review submitted successfully');
      setNewComment('');
      setNewRating(0);
      loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewComment('');
    setNewRating(0);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Reviews & Ratings - {lessonPlanTitle}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Add New Comment */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add Your Review
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={newRating}
              onChange={(_, value) => setNewRating(value || 0)}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Your Review"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts about this lesson plan..."
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.trim() || newRating === 0}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit Review'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Comments List */}
        <Typography variant="h6" gutterBottom>
          All Reviews ({comments.length})
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={3}>
            No reviews yet. Be the first to review this lesson plan!
          </Typography>
        ) : (
          <List>
            {comments.map((comment, index) => (
              <React.Fragment key={comment.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">
                          {comment.user?.firstName} {comment.user?.lastName}
                        </Typography>
                        <Rating value={comment.rating} readOnly size="small" />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                          {comment.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < comments.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentDialog;
