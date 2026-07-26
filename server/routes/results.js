const express = require('express');

module.exports = (prisma) => {
  const router = express.Router();

  // Get results for student
  router.get('/my-results', async (req, res) => {
    try {
      const userId = req.user.id;

      const results = await prisma.result.findMany({
        where: { studentId: userId },
        include: { exam: true },
        orderBy: { resultDate: 'desc' }
      });

      res.json(results);
    } catch (error) {
      console.error('[v0] Get results error:', error);
      res.status(500).json({ error: 'Failed to fetch results' });
    }
  });

  // Get result details
  router.get('/:resultId', async (req, res) => {
    try {
      const { resultId } = req.params;
      const userId = req.user.id;

      const result = await prisma.result.findUnique({
        where: { id: resultId },
        include: {
          exam: true,
          studentExam: {
            include: {
              responses: {
                include: {
                  question: {
                    include: { options: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!result) {
        return res.status(404).json({ error: 'Result not found' });
      }

      // Check authorization
      if (result.studentId !== userId && req.user.role === 'STUDENT') {
        return res.status(403).json({ error: 'Not authorized to view this result' });
      }

      res.json(result);
    } catch (error) {
      console.error('[v0] Get result details error:', error);
      res.status(500).json({ error: 'Failed to fetch result' });
    }
  });

  // Get exam results (for teacher)
  router.get('/exam/:examId', async (req, res) => {
    try {
      const { examId } = req.params;

      const results = await prisma.result.findMany({
        where: { examId },
        include: {
          studentExam: {
            include: { student: { select: { name: true, email: true } } }
          }
        },
        orderBy: { percentage: 'desc' }
      });

      res.json(results);
    } catch (error) {
      console.error('[v0] Get exam results error:', error);
      res.status(500).json({ error: 'Failed to fetch exam results' });
    }
  });

  return router;
};
