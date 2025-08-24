import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import userService from '../services/userService';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('Authentication attempt without token');
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify user still exists in database
    const user = await userService.findUserById(decoded.userId);
    if (!user) {
      logger.warn(`Token valid but user not found: ${decoded.userId}`);
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      logger.warn(`Inactive user attempted access: ${user.email}`);
      res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    logger.info(`User authenticated: ${user.email} (${user.role})`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token provided');
      res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token provided');
      res.status(403).json({
        success: false,
        message: 'Token expired'
      });
    } else {
      logger.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
    return;
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('Role check attempted without authentication');
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Insufficient permissions: ${req.user.email} (${req.user.role}) attempted to access ${roles.join(', ')} only endpoint`);
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    logger.info(`Role check passed: ${req.user.email} (${req.user.role})`);
    next();
  };
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await userService.findUserById(decoded.userId);
      
      if (user && user.status === 'ACTIVE') {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role
        };
        logger.info(`Optional auth successful: ${user.email}`);
      }
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    logger.debug('Optional auth failed, continuing without user context');
  }
  
  next();
};
