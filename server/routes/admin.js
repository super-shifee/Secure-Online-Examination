const express = require('express');
const { roleMiddleware } = require('../middleware/auth');

module.exports = (prisma) => {
  const router = express.Router();

  router.use(roleMiddleware(['ADMIN']));

  // Get admin dashboard
  router.get('/dashboard', async (req, res) => {
    try {
      const stats = {
        totalUsers: await prisma.user.count(),
        totalExams: await prisma.exam.count(),
        totalResults: await prisma.result.count(),
        alerts: await prisma.cheatingAlert.count({ where: { isReviewed: false } })
      };

      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      res.json({ stats, recentUsers: users });
    } catch (error) {
      console.error('[v0] Admin dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
  });

  // Manage users
  router.get('/users', async (req, res) => {
    try {
      const { role, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = role ? { role: role.toUpperCase() } : {};

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true
        },
        skip,
        take: parseInt(limit)
      });

      const total = await prisma.user.count({ where });

      res.json({
        users,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
      });
    } catch (error) {
      console.error('[v0] Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Deactivate user
  router.put('/users/:userId/deactivate', async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });

      res.json({ message: 'User deactivated', user });
    } catch (error) {
      console.error('[v0] Deactivate user error:', error);
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  });

  // Review cheating alert
  router.put('/alerts/:alertId/review', async (req, res) => {
    try {
      const { alertId } = req.params;
      const { status, notes } = req.body;

      const alert = await prisma.cheatingAlert.update({
        where: { id: alertId },
        data: {
          isReviewed: true,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes
        }
      });

      res.json({ message: 'Alert reviewed', alert });
    } catch (error) {
      console.error('[v0] Review alert error:', error);
      res.status(500).json({ error: 'Failed to review alert' });
    }
  });

  // Get audit logs
  router.get('/audit-logs', async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const logs = await prisma.auditLog.findMany({
        include: { user: { select: { email: true, name: true } } },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.auditLog.count();

      res.json({
        logs,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
      });
    } catch (error) {
      console.error('[v0] Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  return router;
};
