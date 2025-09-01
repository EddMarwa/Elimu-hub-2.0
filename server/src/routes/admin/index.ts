import { Router } from 'express';
import userRoutes from './users';
import systemRoutes from './system';
import auditRoutes from './audit';

const router = Router();



// Admin routes
router.use('/users', userRoutes);
router.use('/system', systemRoutes);
router.use('/audit', auditRoutes);

// Admin dashboard info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is working',
    endpoints: {
      users: '/api/admin/users',
      system: '/api/admin/system',
      audit: '/api/admin/audit'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
