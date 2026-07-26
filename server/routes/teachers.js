const express = require('express');

module.exports = (prisma) => {
  const router = express.Router();

  // Get teacher dashboard
  router.get('/dashboard', async (req, res) => {
    try {
      const userId = req.user.id;

      const exams = await prisma.exam.findMany({
        where: { createdByTeacherId: userId },
        include: {
          _count: {
            select: { studentExams: true, questions: true }
          }
        }
      });

      const stats = {
        totalExams: exams.length,
        totalStudents: 0,
        totalSubmissions: 0
      };

      for (const exam of exams) {
        const submissions = await prisma.studentExam.count({ where: { examId: exam.id } });
        stats.totalSubmissions += submissions;
      }

      res.json({ exams, stats });
    } catch (error) {
      console.error('[v0] Teacher dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
  });

  // Add questions to exam
  router.post('/:examId/questions', async (req, res) => {
    try {
      const { examId } = req.params;
      const { questions } = req.body;

      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) return res.status(404).json({ error: 'Exam not found' });

      // Add questions
      const createdQuestions = [];
      for (const q of questions) {
        const question = await prisma.question.create({
          data: {
            examId,
            questionText: q.questionText,
            questionType: q.questionType,
            marks: q.marks,
            difficulty: q.difficulty || 'MEDIUM',
            order: q.order,
            explanation: q.explanation,
            imageUrl: q.imageUrl,
            videoUrl: q.videoUrl
          }
        });

        // Add options
        if (q.options && Array.isArray(q.options)) {
          for (const opt of q.options) {
            await prisma.questionOption.create({
              data: {
                questionId: question.id,
                optionText: opt.optionText,
                optionImageUrl: opt.optionImageUrl,
                isCorrect: opt.isCorrect || false,
                order: opt.order
              }
            });
          }
        }

        createdQuestions.push(question);
      }

      res.status(201).json({ message: 'Questions added', questions: createdQuestions });
    } catch (error) {
      console.error('[v0] Add questions error:', error);
      res.status(500).json({ error: 'Failed to add questions' });
    }
  });

  // Get exam analytics
  router.get('/:examId/analytics', async (req, res) => {
    try {
      const { examId } = req.params;

      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) return res.status(404).json({ error: 'Exam not found' });

      const results = await prisma.result.findMany({
        where: { examId },
        select: { percentage: true, isPassed: true }
      });

      const analytics = {
        totalStudents: results.length,
        averageScore: results.length > 0
          ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2)
          : 0,
        passedStudents: results.filter(r => r.isPassed).length,
        passPercentage: results.length > 0
          ? ((results.filter(r => r.isPassed).length / results.length) * 100).toFixed(2)
          : 0
      };

      res.json(analytics);
    } catch (error) {
      console.error('[v0] Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  return router;
};
