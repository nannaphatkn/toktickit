import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';

export const JWT_SECRET = process.env.JWT_SECRET || 'toktickit-dev-jwt-secret-key-2026';

export interface AuthUserPayload {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  mustChangePassword: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'] as string;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;

    // Verify user is still active in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, mustChangePassword: true },
    });

    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ error: 'Account is inactive or no longer exists.' });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: dbUser.role,
      mustChangePassword: dbUser.mustChangePassword,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

export const requirePasswordChanged = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.mustChangePassword) {
    return res.status(403).json({
      error: 'Password change required',
      mustChangePassword: true,
      message: 'You must change your initial password before accessing application functions.',
    });
  }
  next();
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to access this resource.' });
    }

    next();
  };
};
