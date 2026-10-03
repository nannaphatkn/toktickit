import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role, Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { authenticateUser, requirePasswordChanged, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Protect all Admin routes: Must be authenticated, password changed, and role = ADMINISTRATOR
router.use(authenticateUser);
router.use(requirePasswordChanged);
router.use(requireRole(Role.ADMINISTRATOR));

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+={}\[\]:;<>,.~/\\]).{8,}$/;

/**
 * GET /api/admin/users
 * Returns list of users with search and role filter
 */
router.get('/users', async (req: Request, res: Response) => {
  const { search, role } = req.query;

  try {
    const where: Prisma.UserWhereInput = {};

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (role && typeof role === 'string' && role !== 'ALL') {
      if (Object.values(Role).includes(role as Role)) {
        where.role = role as Role;
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { createdTickets: true, assignedTickets: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return res.status(500).json({ error: 'Failed to fetch user list.' });
  }
});

/**
 * POST /api/admin/users
 * Create a new user with one permitted role and an initial password
 */
router.post('/users', async (req: Request, res: Response) => {
  const { fullName, email, role, isActive = true, initialPassword } = req.body;

  if (!fullName || !email || !role || !initialPassword) {
    return res.status(400).json({ error: 'Full name, email, role, and initial password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  if (!Object.values(Role).includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  if (!PASSWORD_REGEX.test(initialPassword)) {
    return res.status(400).json({
      error: 'Initial password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
    });
  }

  try {
    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const createdUser = await prisma.user.create({
      data: {
        fullName: cleanName,
        email: cleanEmail,
        role: role as Role,
        isActive: Boolean(isActive),
        mustChangePassword: true, // Force password change on first login
        passwordHash,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ message: 'User created successfully.', user: createdUser });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Edit basic user account info (fullName, email, role, isActive)
 */
router.patch('/users/:id', async (req: Request, res: Response) => {
  const targetId = parseInt(req.params.id, 10);
  if (isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  const { fullName, email, role, isActive } = req.body;

  try {
    const userToUpdate = await prisma.user.findUnique({ where: { id: targetId } });
    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Safety Check 1: Prevent Administrator from deactivating their own account
    if (req.user!.id === targetId && isActive === false) {
      return res.status(400).json({ error: 'Safety Rule Violation: You cannot deactivate your own logged-in Administrator account.' });
    }

    // Safety Check 2: Prevent removing or deactivating the last active Administrator
    if (
      (isActive === false || (role && role !== Role.ADMINISTRATOR)) &&
      userToUpdate.role === Role.ADMINISTRATOR &&
      userToUpdate.isActive === true
    ) {
      const activeAdminCount = await prisma.user.count({
        where: { role: Role.ADMINISTRATOR, isActive: true },
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          error: 'Safety Rule Violation: Cannot deactivate or remove the role of the last active Administrator in the system.',
        });
      }
    }

    const dataToUpdate: Prisma.UserUpdateInput = {};

    if (fullName !== undefined) dataToUpdate.fullName = fullName.trim();
    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== userToUpdate.email) {
        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
          return res.status(400).json({ error: 'A user with this email address already exists.' });
        }
        dataToUpdate.email = cleanEmail;
      }
    }
    if (role !== undefined) {
      if (!Object.values(Role).includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified.' });
      }
      dataToUpdate.role = role as Role;
    }
    if (isActive !== undefined) {
      dataToUpdate.isActive = Boolean(isActive);
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: dataToUpdate,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        updatedAt: true,
      },
    });

    return res.json({ message: 'User account updated successfully.', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user account.' });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Set a new initial password for a user account, forcing password change on next login
 */
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  const targetId = parseInt(req.params.id, 10);
  if (isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  const { initialPassword } = req.body;
  if (!initialPassword) {
    return res.status(400).json({ error: 'New initial password is required.' });
  }

  if (!PASSWORD_REGEX.test(initialPassword)) {
    return res.status(400).json({
      error: 'Initial password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
    });
  }

  try {
    const userToUpdate = await prisma.user.findUnique({ where: { id: targetId } });
    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    await prisma.user.update({
      where: { id: targetId },
      data: {
        passwordHash,
        mustChangePassword: true, // Forces user to change password on next login
      },
    });

    return res.json({ message: 'Initial password reset successfully. User will be required to change password on next login.' });
  } catch (error) {
    console.error('Error resetting initial password:', error);
    return res.status(500).json({ error: 'Failed to reset initial password.' });
  }
});

export default router;
