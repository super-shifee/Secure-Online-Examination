const express = require('express');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { authMiddleware } = require('../middleware/auth');

module.exports = (prisma) => {
  const router = express.Router();

  // Register
  router.post('/register', async (req, res) => {
    try {
      const { email, name, password, confirmPassword, role = 'STUDENT', enrollmentNumber, department } = req.body;

      // Validation
      if (!email || !name || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      if (!validatePasswordStrength(password)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
        });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: role.toUpperCase(),
          enrollmentNumber: role === 'STUDENT' ? enrollmentNumber : undefined,
          department: role === 'STUDENT' ? department : undefined
        }
      });

      // Generate token
      const token = generateToken(user.id);

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('[v0] Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is disabled' });
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(403).json({ error: 'Account temporarily locked. Try again later.' });
      }

      // Compare password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        // Increment login attempts
        const newAttempts = user.loginAttempts + 1;
        let lockedUntil = null;

        if (newAttempts >= 5) {
          // Lock account for 30 minutes
          lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: newAttempts,
            lockedUntil
          }
        });

        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Reset login attempts on successful login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date()
        }
      });

      // Generate token
      const token = generateToken(user.id);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('[v0] Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Get current user
  router.get('/me', authMiddleware(prisma), async (req, res) => {
    try {
      res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          department: req.user.department,
          enrollmentNumber: req.user.enrollmentNumber,
          profileImage: req.user.profileImage
        }
      });
    } catch (error) {
      console.error('[v0] Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Update password
  router.post('/change-password', authMiddleware(prisma), async (req, res) => {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body;
      const userId = req.user.id;

      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'All fields required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New passwords do not match' });
      }

      if (!validatePasswordStrength(newPassword)) {
        return res.status(400).json({ error: 'Password does not meet strength requirements' });
      }

      // Verify old password
      const isOldPasswordValid = await comparePassword(oldPassword, req.user.password);
      
      if (!isOldPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('[v0] Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Logout (mainly for audit logging)
  router.post('/logout', authMiddleware(prisma), async (req, res) => {
    try {
      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'LOGOUT',
          resource: 'AUTH',
          status: 'SUCCESS',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('[v0] Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  return router;
};
