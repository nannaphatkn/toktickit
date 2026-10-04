import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { authenticateUser, JWT_SECRET } from '../middleware/authMiddleware';

const router = Router();

// Password complexity regex: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+={}\[\]:;<>,.~/\\]).{8,}$/;

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive. Please contact system administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticateUser, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        error: 'New password does not meet security requirements. It must be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from current password.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    const payload = {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      mustChangePassword: false,
    };

    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      message: 'Password changed successfully.',
      token: newToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        mustChangePassword: false,
      },
    });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Internal server error changing password.' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully.' });
});

export default router;
