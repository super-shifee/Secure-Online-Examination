const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { createServer } = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Prisma
const prisma = new PrismaClient();

// Import routes
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const adminRoutes = require('./routes/admin');
const proctorRoutes = require('./routes/proctor');
const resultRoutes = require('./routes/results');

// Import middleware
const { authMiddleware } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const server = createServer(app);

// Socket.io setup
const io = socketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Static files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes(prisma));
app.use('/api/exams', examRoutes(prisma));
app.use('/api/students', authMiddleware(prisma), studentRoutes(prisma));
app.use('/api/teachers', authMiddleware(prisma), teacherRoutes(prisma));
app.use('/api/admin', authMiddleware(prisma), adminRoutes(prisma));
app.use('/api/proctor', authMiddleware(prisma), proctorRoutes(prisma, io));
app.use('/api/results', authMiddleware(prisma), resultRoutes(prisma));

// Socket.io events
io.on('connection', (socket) => {
  console.log('[v0] New socket connection:', socket.id);

  socket.on('join-exam', (data) => {
    const { examId, studentId } = data;
    socket.join(`exam-${examId}`);
    socket.emit('joined-exam', { success: true });
    console.log(`[v0] Student ${studentId} joined exam ${examId}`);
  });

  socket.on('question-update', (data) => {
    const { examId, questionNumber } = data;
    io.to(`exam-${examId}`).emit('question-changed', { questionNumber });
  });

  socket.on('time-warning', (data) => {
    const { examId } = data;
    io.to(`exam-${examId}`).emit('time-alert', { message: 'Time is running out!' });
  });

  socket.on('proctor-alert', (data) => {
    const { examId, alert } = data;
    io.to(`exam-${examId}`).emit('suspicious-activity', alert);
  });

  socket.on('disconnect', () => {
    console.log('[v0] Socket disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[v0] Server running on port ${PORT}`);
  console.log(`[v0] Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[v0] SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[v0] HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io, prisma };
