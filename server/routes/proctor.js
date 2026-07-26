const express = require('express');

module.exports = (prisma, io) => {
  const router = express.Router();

  // Start proctor session
  router.post('/session/start/:examId', async (req, res) => {
    try {
      const { examId } = req.params;
      const userId = req.user.id;

      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) return res.status(404).json({ error: 'Exam not found' });

      if (!exam.requiresProctoring) {
        return res.status(400).json({ error: 'This exam does not require proctoring' });
      }

      const session = await prisma.proctorSession.create({
        data: {
          examId,
          studentId: userId,
          sessionStartTime: new Date(),
          webcamStatus: 'PENDING'
        }
      });

      res.status(201).json({ session });
    } catch (error) {
      console.error('[v0] Start proctor session error:', error);
      res.status(500).json({ error: 'Failed to start session' });
    }
  });

  // Update proctor session with webcam check
  router.post('/session/:sessionId/check-in', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { faceDetected, screenshotUrl } = req.body;

      const session = await prisma.proctorSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      let webcamStatus = 'ACTIVE';
      if (!faceDetected) {
        webcamStatus = 'FAILED';
        session.suspiciousActivities++;
      }

      const updated = await prisma.proctorSession.update({
        where: { id: sessionId },
        data: {
          webcamStatus,
          lastWebcamCheck: new Date(),
          lastScreenshotUrl: screenshotUrl,
          screenshotCount: session.screenshotCount + 1,
          suspiciousActivities: session.suspiciousActivities
        }
      });

      res.json({ session: updated });
    } catch (error) {
      console.error('[v0] Check-in error:', error);
      res.status(500).json({ error: 'Failed to process check-in' });
    }
  });

  // Report suspicious activity
  router.post('/alert', async (req, res) => {
    try {
      const { examId, alertType, severity, description, aiConfidenceScore } = req.body;
      const userId = req.user.id;

      const session = await prisma.proctorSession.findFirst({
        where: { examId, studentId: userId }
      });

      if (!session) {
        return res.status(404).json({ error: 'Proctor session not found' });
      }

      const alert = await prisma.cheatingAlert.create({
        data: {
          examId,
          studentId: userId,
          proctorSessionId: session.id,
          alertType,
          severity,
          description,
          detectionMethod: 'PROCTOR_DETECTED',
          aiConfidenceScore: aiConfidenceScore || null
        }
      });

      // Notify via Socket.io
      io.to(`exam-${examId}`).emit('alert-created', alert);

      res.status(201).json({ alert });
    } catch (error) {
      console.error('[v0] Alert creation error:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  // Get session details
  router.get('/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;

      const session = await prisma.proctorSession.findUnique({
        where: { id: sessionId },
        include: { cheatingAlerts: true }
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      console.error('[v0] Get session error:', error);
      res.status(500).json({ error: 'Failed to fetch session' });
    }
  });

  return router;
};
