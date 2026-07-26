const express = require('express');

module.exports = (prisma) => {
  const router = express.Router();

  // Get student dashboard
  router.get('/dashboard', async (req, res) => {
    try {
      const userId = req.user.id;

      const enrolledExams = await prisma.studentExam.findMany({
        where: { studentId: userId },
        include: {
          exam: true,
          result: true
        }
      });

      const results = await prisma.result.findMany({
        where: { studentId: userId },
        include: { exam: true },
        orderBy: { resultDate: 'desc' }
      });

      res.json({
        enrolledExams,
        results,
        stats: {
          totalExams: enrolledExams.length,
          completedExams: enrolledExams.filter(e => e.status === 'SUBMITTED').length,
          averageScore: results.length > 0 
            ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2)
            : 0
        }
      });
    } catch (error) {
      console.error('[v0] Dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
  });

  // Enroll in exam
  router.post('/enroll/:examId', async (req, res) => {
    try {
      const { examId } = req.params;
      const userId = req.user.id;

      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) return res.status(404).json({ error: 'Exam not found' });

      if (new Date() < exam.startTime) {
        return res.status(400).json({ error: 'Exam has not started yet' });
      }

      const existing = await prisma.studentExam.findUnique({
        where: { studentId_examId: { studentId: userId, examId } }
      });

      if (existing) {
        return res.status(400).json({ error: 'Already enrolled in this exam' });
      }

      const studentExam = await prisma.studentExam.create({
        data: {
          studentId: userId,
          examId,
          status: 'NOT_STARTED',
          ipAddress: req.ip,
          deviceInfo: req.headers['user-agent']
        }
      });

      res.status(201).json({ message: 'Enrolled successfully', studentExam });
    } catch (error) {
      console.error('[v0] Enrollment error:', error);
      res.status(500).json({ error: 'Enrollment failed' });
    }
  });

  // Get student profile
  router.get('/profile', async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          department: true,
          enrollmentNumber: true,
          phoneNumber: true,
          profileImage: true,
          createdAt: true
        }
      });

      res.json(user);
    } catch (error) {
      console.error('[v0] Profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Update student profile
  router.put('/profile', async (req, res) => {
    try {
      const { name, phoneNumber, profileImage } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: name || undefined,
          phoneNumber: phoneNumber || undefined,
          profileImage: profileImage || undefined
        }
      });

      res.json({ message: 'Profile updated', user });
    } catch (error) {
      console.error('[v0] Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  return router;
};
