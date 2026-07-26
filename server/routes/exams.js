const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

module.exports = (prisma) => {
  const router = express.Router();

  // Get all exams (with filters)
  router.get('/', authMiddleware(prisma), async (req, res) => {
    try {
      const { subject, status, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      
      if (subject) where.subject = subject;
      if (status === 'upcoming') where.startTime = { gt: new Date() };
      if (status === 'ongoing') {
        where.startTime = { lte: new Date() };
        where.endTime = { gte: new Date() };
      }
      if (status === 'past') where.endTime = { lt: new Date() };

      const exams = await prisma.exam.findMany({
        where,
        include: {
          _count: {
            select: { 
              questions: true,
              studentExams: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { startTime: 'desc' }
      });

      const total = await prisma.exam.count({ where });

      res.json({
        exams,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('[v0] Get exams error:', error);
      res.status(500).json({ error: 'Failed to fetch exams' });
    }
  });

  // Get exam by ID
  router.get('/:examId', authMiddleware(prisma), async (req, res) => {
    try {
      const { examId } = req.params;

      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          questions: {
            select: {
              id: true,
              questionText: true,
              questionType: true,
              marks: true,
              difficulty: true,
              order: true,
              imageUrl: true,
              videoUrl: true
            }
          },
          _count: {
            select: { studentExams: true }
          }
        }
      });

      if (!exam) {
        return res.status(404).json({ error: 'Exam not found' });
      }

      res.json(exam);
    } catch (error) {
      console.error('[v0] Get exam error:', error);
      res.status(500).json({ error: 'Failed to fetch exam' });
    }
  });

  // Create exam (Teacher/Admin only)
  router.post('/', authMiddleware(prisma), roleMiddleware(['TEACHER', 'ADMIN']), async (req, res) => {
    try {
      const {
        title,
        description,
        subject,
        totalMarks,
        duration,
        passingMarks,
        difficultyLevel,
        examType,
        startTime,
        endTime,
        numberOfQuestions,
        randomizeQuestions,
        randomizeOptions,
        requiresProctoring,
        allowNegativeMarking,
        negativeMarkingFactor
      } = req.body;

      // Validation
      if (!title || !subject || !totalMarks || !duration || !startTime || !endTime || !numberOfQuestions) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const exam = await prisma.exam.create({
        data: {
          title,
          description,
          subject,
          totalMarks: parseFloat(totalMarks),
          duration: parseInt(duration),
          passingMarks: parseFloat(passingMarks),
          difficultyLevel: difficultyLevel || 'MEDIUM',
          examType: examType || 'MCQ',
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          numberOfQuestions: parseInt(numberOfQuestions),
          randomizeQuestions: randomizeQuestions !== false,
          randomizeOptions: randomizeOptions !== false,
          requiresProctoring: requiresProctoring === true,
          allowNegativeMarking: allowNegativeMarking === true,
          negativeMarkingFactor: negativeMarkingFactor ? parseFloat(negativeMarkingFactor) : 0.25,
          createdByTeacherId: req.user.id
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATE_EXAM',
          resource: 'EXAM',
          resourceId: exam.id,
          status: 'SUCCESS'
        }
      });

      res.status(201).json({
        message: 'Exam created successfully',
        exam
      });
    } catch (error) {
      console.error('[v0] Create exam error:', error);
      res.status(500).json({ error: 'Failed to create exam' });
    }
  });

  // Update exam (Teacher/Admin only)
  router.put('/:examId', authMiddleware(prisma), roleMiddleware(['TEACHER', 'ADMIN']), async (req, res) => {
    try {
      const { examId } = req.params;
      const { title, description, isPublished, ...updateData } = req.body;

      const exam = await prisma.exam.findUnique({
        where: { id: examId }
      });

      if (!exam) {
        return res.status(404).json({ error: 'Exam not found' });
      }

      // Check authorization
      if (exam.createdByTeacherId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Not authorized to update this exam' });
      }

      const updatedExam = await prisma.exam.update({
        where: { id: examId },
        data: {
          title: title || exam.title,
          description: description !== undefined ? description : exam.description,
          isPublished: isPublished !== undefined ? isPublished : exam.isPublished,
          ...updateData
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE_EXAM',
          resource: 'EXAM',
          resourceId: examId,
          status: 'SUCCESS'
        }
      });

      res.json({
        message: 'Exam updated successfully',
        exam: updatedExam
      });
    } catch (error) {
      console.error('[v0] Update exam error:', error);
      res.status(500).json({ error: 'Failed to update exam' });
    }
  });

  // Delete exam (Teacher/Admin only)
  router.delete('/:examId', authMiddleware(prisma), roleMiddleware(['TEACHER', 'ADMIN']), async (req, res) => {
    try {
      const { examId } = req.params;

      const exam = await prisma.exam.findUnique({
        where: { id: examId }
      });

      if (!exam) {
        return res.status(404).json({ error: 'Exam not found' });
      }

      // Check authorization
      if (exam.createdByTeacherId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Not authorized to delete this exam' });
      }

      // Check if exam has submissions
      const submissionCount = await prisma.studentExam.count({
        where: { examId }
      });

      if (submissionCount > 0) {
        return res.status(400).json({ error: 'Cannot delete exam with submissions' });
      }

      await prisma.exam.delete({
        where: { id: examId }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'DELETE_EXAM',
          resource: 'EXAM',
          resourceId: examId,
          status: 'SUCCESS'
        }
      });

      res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
      console.error('[v0] Delete exam error:', error);
      res.status(500).json({ error: 'Failed to delete exam' });
    }
  });

  // Publish exam
  router.post('/:examId/publish', authMiddleware(prisma), roleMiddleware(['TEACHER', 'ADMIN']), async (req, res) => {
    try {
      const { examId } = req.params;

      const exam = await prisma.exam.findUnique({
        where: { id: examId }
      });

      if (!exam) {
        return res.status(404).json({ error: 'Exam not found' });
      }

      // Check authorization
      if (exam.createdByTeacherId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Not authorized to publish this exam' });
      }

      // Check if exam has questions
      const questionCount = await prisma.question.count({
        where: { examId }
      });

      if (questionCount === 0) {
        return res.status(400).json({ error: 'Cannot publish exam without questions' });
      }

      const updatedExam = await prisma.exam.update({
        where: { id: examId },
        data: { isPublished: true }
      });

      res.json({
        message: 'Exam published successfully',
        exam: updatedExam
      });
    } catch (error) {
      console.error('[v0] Publish exam error:', error);
      res.status(500).json({ error: 'Failed to publish exam' });
    }
  });

  return router;
};
