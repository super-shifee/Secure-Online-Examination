# Online Examination System

A comprehensive, secure online examination platform with advanced proctoring, AI-powered cheating detection, and detailed analytics.

## Features

### Core Features
- **User Management**: Multi-role system (Student, Teacher, Admin)
- **Exam Management**: Create, publish, and manage exams with flexible question types
- **Question Bank**: Support for MCQ, multiple choice, descriptive, code-based questions
- **Exam Taking**: Responsive exam interface with timer, question navigation, and progress tracking
- **Scoring System**: Automatic scoring with support for negative marking
- **Results Management**: Comprehensive result analytics and performance tracking

### Advanced Features
- **Proctoring**: Real-time webcam monitoring and activity tracking
- **AI Cheating Detection**: Machine learning-based detection of suspicious patterns
- **Tab Switch Detection**: Monitors for unauthorized tab switches
- **Multiple Face Detection**: Alerts when multiple faces are detected
- **Activity Logging**: Comprehensive audit trails for all system actions
- **Alerts Management**: Review and manage cheating alerts with evidence

### Analytics & Reporting
- **Dashboard Analytics**: Real-time statistics for teachers and admins
- **Performance Metrics**: Detailed exam analytics and student performance
- **Audit Logs**: Complete system activity tracking
- **Export Reports**: Generate detailed exam reports

## Tech Stack

### Backend
- **Framework**: Express.js 5.x
- **Database**: MySQL with Prisma ORM
- **Authentication**: Better Auth with JWT
- **Real-time**: Socket.io
- **File Storage**: Vercel Blob
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: Next.js 16 with App Router
- **UI Library**: shadcn/ui with Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom hooks
- **Real-time**: Socket.io Client

## Project Structure

```
/vercel/share/v0-project/
├── app/                          # Next.js app directory
│   ├── api/                       # API routes (proxy to backend)
│   ├── login/                     # Login page
│   ├── register/                  # Registration page
│   ├── dashboard/                 # Student dashboard
│   ├── exam/                      # Exam taking interface
│   ├── results/                   # Results page
│   └── layout.tsx                 # Root layout
├── server/                        # Express backend
│   ├── routes/                    # API route handlers
│   │   ├── auth.js               # Authentication routes
│   │   ├── exams.js              # Exam management routes
│   │   ├── students.js           # Student routes
│   │   ├── teachers.js           # Teacher routes
│   │   ├── admin.js              # Admin routes
│   │   ├── proctor.js            # Proctoring routes
│   │   └── results.js            # Results routes
│   ├── middleware/                # Express middleware
│   │   ├── auth.js               # JWT authentication
│   │   └── errorHandler.js       # Global error handling
│   ├── utils/                     # Utility functions
│   │   ├── jwt.js                # JWT token management
│   │   └── password.js           # Password hashing
│   └── index.js                  # Express server entry
├── lib/
│   └── authContext.tsx           # Auth context provider
├── prisma/
│   └── schema.prisma             # Database schema
├── .env.local                    # Environment variables
├── package.json
└── README.md
```

## Database Schema

### Core Tables
- **User**: System users (Student, Teacher, Admin)
- **Exam**: Exam configurations and metadata
- **Question**: Exam questions with support for multiple types
- **QuestionOption**: Multiple choice options for questions
- **StudentExam**: Student exam enrollment and progress
- **ExamResponse**: Student responses to individual questions
- **Result**: Final exam results and scores

### Proctoring Tables
- **ProctorSession**: Proctoring session tracking
- **CheatingAlert**: Suspicious activity alerts
- **AuditLog**: System-wide activity logging
- **Notification**: User notifications

## Setup Instructions

### Prerequisites
- Node.js 18+ and pnpm
- MySQL 8.0+
- Basic knowledge of Express.js and Next.js

### Installation

1. **Clone and Install Dependencies**
```bash
cd /vercel/share/v0-project
pnpm install
```

2. **Configure Environment Variables**
```bash
# Copy and update .env.local
# Update DATABASE_URL with your MySQL connection string
# Generate new JWT and BETTER_AUTH secrets
```

3. **Setup Database**
```bash
# Run Prisma migrations
pnpm exec prisma migrate dev --name init

# (Optional) Seed demo data
pnpm exec prisma db seed
```

4. **Start Development Servers**

**Terminal 1 - Backend (Express)**
```bash
node server/index.js
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend (Next.js)**
```bash
pnpm dev
# App runs on http://localhost:3000
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Exam Endpoints
- `GET /api/exams` - List all exams
- `GET /api/exams/:examId` - Get exam details
- `POST /api/exams` - Create exam (Teacher/Admin)
- `PUT /api/exams/:examId` - Update exam
- `DELETE /api/exams/:examId` - Delete exam
- `POST /api/exams/:examId/publish` - Publish exam

### Student Endpoints
- `GET /api/students/dashboard` - Student dashboard
- `POST /api/students/enroll/:examId` - Enroll in exam
- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update profile

### Results Endpoints
- `GET /api/results/my-results` - Get student results
- `GET /api/results/:resultId` - Get result details
- `GET /api/results/exam/:examId` - Get exam results

### Proctoring Endpoints
- `POST /api/proctor/session/start/:examId` - Start proctoring session
- `POST /api/proctor/session/:sessionId/check-in` - Webcam check-in
- `POST /api/proctor/alert` - Report suspicious activity

## Demo Credentials

Use these credentials to test different user roles:

```
Student: student@example.com / Password123!
Teacher: teacher@example.com / Password123!
Admin: admin@example.com / Password123!
```

## Security Considerations

1. **Password Security**: Passwords are hashed with bcryptjs using 10 salt rounds
2. **JWT Tokens**: All API requests require Bearer token authentication
3. **Input Validation**: Server-side validation on all endpoints
4. **Rate Limiting**: Configurable rate limiting on authentication endpoints
5. **CORS Protection**: Configured CORS headers for secure cross-origin requests
6. **Audit Logging**: All important actions are logged with user, action, and timestamp
7. **Session Security**: Account lockout after 5 failed login attempts
8. **IP Tracking**: Student IP and device information logged during exams

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy Next.js frontend
4. Deploy Express backend separately or use Vercel Functions

### Docker Deployment
Create a `Dockerfile` for containerization:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
EXPOSE 3000 3001
CMD ["pnpm", "dev"]
```

## Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/exam_db

# Server
PORT=3001
NODE_ENV=development

# Authentication
BETTER_AUTH_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=7d

# File Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# SMTP (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Proctoring
ENABLE_WEBCAM_VERIFICATION=true
ENABLE_AI_DETECTION=true
SCREENSHOT_INTERVAL=30000
```

## File Storage

This system uses Vercel Blob for storing:
- Exam documents/PDFs
- Question images and videos
- Proctoring screenshots
- Evidence for cheating alerts
- Generated reports

## Future Enhancements

- [ ] Email notifications for exam reminders
- [ ] Mobile app (React Native)
- [ ] Video question support with playback
- [ ] Detailed analytics dashboard with charts
- [ ] AI-powered answer evaluation for descriptive questions
- [ ] Two-factor authentication
- [ ] Payment integration for premium features
- [ ] Integration with LMS platforms (Moodle, Canvas)
- [ ] Advanced reporting with PDF export
- [ ] Performance optimization for large-scale deployments

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check DATABASE_URL format
- Ensure database exists
- Run migrations: `pnpm exec prisma migrate dev`

### Authentication Errors
- Clear browser localStorage
- Verify JWT_SECRET matches
- Check token expiry
- Ensure BETTER_AUTH_SECRET is set

### API Not Responding
- Verify Express backend is running on port 3001
- Check NEXT_PUBLIC_API_URL in next.config.mjs
- Review server logs for errors
- Ensure CORS is properly configured

## Support

For issues, feature requests, or contributions, please create an issue or pull request in the repository.

## License

MIT License - See LICENSE file for details

## Acknowledgments

Built with:
- Express.js for robust backend
- Next.js for modern frontend
- Prisma ORM for database management
- Socket.io for real-time features
- shadcn/ui for beautiful components
- Tailwind CSS for responsive design
