# Online Examination System - Implementation Guide

This guide provides step-by-step instructions for implementing and customizing the Online Examination System.

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Setup Database
```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE exam_db;"

# Update .env.local with your connection string
DATABASE_URL=mysql://root:password@localhost:3306/exam_db

# Run migrations
pnpm exec prisma migrate dev --name init
```

### 3. Start Development Servers
```bash
# Terminal 1: Backend
pnpm run dev:backend

# Terminal 2: Frontend
pnpm dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: `pnpm run prisma:studio`

## Architecture Overview

### Request Flow
```
Frontend (Next.js) 
  ↓
Next.js API Routes (/app/api)
  ↓
Express Backend (server/index.js)
  ↓
MySQL Database (via Prisma)
```

### Authentication Flow
```
1. User submits credentials on Login/Register page
2. Frontend calls /api/auth/login or /api/auth/register
3. Next.js API route proxies to Express backend
4. Backend validates credentials, generates JWT token
5. Token stored in localStorage
6. Subsequent requests include token in Authorization header
```

## Phase-by-Phase Implementation

### Phase 1: Backend Infrastructure ✅ COMPLETED
- Express server setup
- Prisma schema with 14 tables
- Database initialization
- Middleware configuration

### Phase 2: Authentication ✅ COMPLETED
- JWT-based authentication
- Password hashing with bcryptjs
- Login/Register endpoints
- Account lockout after failed attempts
- Audit logging

### Phase 3: Exam Management ✅ COMPLETED
- Create/Update/Delete exams
- Publish exams
- Question management
- Support for multiple question types

### Phase 4: Exam Taking Interface ✅ COMPLETED
- Responsive exam interface
- Question navigation
- Timer with warnings
- Answer tracking
- Progress indicators
- Real-time status updates via Socket.io

### Phase 5: Scoring & Results (READY FOR IMPLEMENTATION)
**Next Steps:**
- Create `/server/routes/scoring.js` for scoring logic
- Implement automatic answer evaluation
- Support for negative marking
- Grade calculation based on passing marks
- Create `/app/results/[resultId]/page.tsx` for result viewing

### Phase 6: Proctoring & Webcam (READY FOR IMPLEMENTATION)
**Next Steps:**
- Integrate react-webcam library
- Implement face detection using face-api.js or ml5.js
- Create `/app/exam/[examId]/proctor/page.tsx` component
- Implement session tracking
- Create screenshot capture logic
- Implement tab switch detection

### Phase 7: AI Cheating Detection (READY FOR IMPLEMENTATION)
**Next Steps:**
- Integrate ML model for pattern detection
- Create `/server/utils/aiDetection.js`
- Analyze behavioral patterns
- Track suspicious activities
- Generate cheating confidence scores

### Phase 8: Admin & Teacher Dashboards (READY FOR IMPLEMENTATION)
**Next Steps:**
- Create `/app/teacher-dashboard/page.tsx`
- Create `/app/admin-dashboard/page.tsx`
- Implement analytics components with Recharts
- Create user management interface
- Alert review system

### Phase 9: Student Dashboard & Analytics (PARTIALLY COMPLETED)
**Completed:**
- Dashboard component with exam list and results
- Basic statistics display

**Remaining:**
- Performance charts
- Detailed analytics
- Exam history

### Phase 10: Real-time Features (READY FOR IMPLEMENTATION)
**Next Steps:**
- Implement Socket.io client in exam interface
- Real-time notifications
- Live question updates
- Time synchronization
- Proctor-student communication

### Phase 11: Deployment & Security (READY FOR IMPLEMENTATION)
**Next Steps:**
- Environment variable configuration
- Database backups
- SSL/TLS setup
- DDoS protection
- Rate limiting configuration
- Monitoring and logging

## Key Implementation Tasks

### Creating New API Endpoints

1. **Create Backend Route** (`server/routes/module.js`):
```javascript
module.exports = (prisma) => {
  const router = require('express').Router();

  router.get('/endpoint', async (req, res) => {
    try {
      // Implementation
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
```

2. **Register Route** (`server/index.js`):
```javascript
app.use('/api/module', moduleRoutes(prisma));
```

3. **Frontend Integration** - Routes automatically proxied via `/app/api/[...path]/route.ts`

### Adding Frontend Pages

1. Create page file: `/app/module/page.tsx`
2. Use `useAuth()` hook for authentication
3. Call API endpoints: `fetch('/api/endpoint')`
4. Handle loading and error states

### Database Migrations

```bash
# Create migration
pnpm exec prisma migrate dev --name migration_name

# Reset database (development only)
pnpm exec prisma migrate reset

# View database
pnpm run prisma:studio
```

## Feature Implementation Examples

### Example 1: Add Question to Exam

**Frontend:**
```typescript
const handleAddQuestion = async (examId: string, question: any) => {
  const response = await fetch(`/api/exams/${examId}/questions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ questions: [question] })
  });
  const data = await response.json();
  return data;
};
```

**Backend:**
Already implemented in `server/routes/teachers.js` - POST `/api/exams/:examId/questions`

### Example 2: Track Student Activity

```typescript
// In exam interface
useEffect(() => {
  const handleTabChange = () => {
    fetch('/api/proctor/alert', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        examId,
        alertType: 'TAB_SWITCH',
        severity: 'MEDIUM',
        description: 'Student switched tabs'
      })
    });
  };

  document.addEventListener('visibilitychange', handleTabChange);
  return () => document.removeEventListener('visibilitychange', handleTabChange);
}, []);
```

## Database Schema Reference

### User Table
- Stores student, teacher, and admin accounts
- Password hashing required
- Account lockout mechanism

### Exam Table
- Exam configuration and settings
- Timestamp tracking
- Proctoring requirements
- Question randomization settings

### Question & QuestionOption Tables
- Flexible question type support
- Multiple choice options
- Explanation for answers
- Media support (images/videos)

### StudentExam Table
- Student exam enrollment
- Progress tracking
- IP and device information
- Time spent tracking

### Result Table
- Final scores and grades
- Performance metrics
- Pass/fail status

### ProctorSession & CheatingAlert Tables
- Webcam verification data
- Suspicious activity alerts
- Evidence storage (screenshot URLs)
- Alert review status

### AuditLog Table
- Complete action tracking
- Security monitoring
- Compliance logging

## API Rate Limiting

Configure in `.env.local`:
```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max 100 requests
```

## File Storage (Vercel Blob)

Files stored in Blob:
- Exam PDFs/documents
- Question media
- Proctoring screenshots
- Generated reports

```typescript
// Upload file
const blob = await put(`exam-${examId}/${filename}`, file, {
  access: 'private',
});

// Get URL
const url = blob.url;
```

## Email Notifications (Optional)

Configure SMTP in `.env.local`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Exam creation and publishing
- [ ] Question addition and modification
- [ ] Student exam enrollment
- [ ] Exam taking (timer, navigation, answers)
- [ ] Result generation and display
- [ ] Proctoring session start
- [ ] Admin dashboard access
- [ ] User management
- [ ] Audit log tracking

### Demo Credentials
```
Student: student@example.com / Password123!
Teacher: teacher@example.com / Password123!
Admin: admin@example.com / Password123!
```

## Performance Optimization Tips

1. **Database Queries**: Use Prisma's `select` to fetch only needed fields
2. **Frontend**: Implement pagination for large lists
3. **Caching**: Use React Query or SWR for server state
4. **Images**: Compress and optimize via Vercel Image Optimization
5. **Bundle Size**: Monitor with `npm run build`

## Security Best Practices

1. **Never expose secrets** in frontend code
2. **Validate all inputs** on both client and server
3. **Use HTTPS** in production
4. **Implement rate limiting** on sensitive endpoints
5. **Log security events** in audit table
6. **Regular backups** of database
7. **Monitor for suspicious patterns** in logs

## Troubleshooting Common Issues

### "Cannot connect to database"
- Verify MySQL is running: `mysql -u root -p -e "SELECT 1;"`
- Check DATABASE_URL format
- Ensure database exists
- Check credentials

### "JWT token invalid"
- Verify JWT_SECRET is set
- Check token hasn't expired
- Clear browser localStorage and re-login
- Verify token format in header

### "Questions not loading in exam"
- Check exam is published
- Verify questions exist for exam
- Check database for question records
- Review server logs

### "Proctoring features not working"
- Ensure ENABLE_WEBCAM_VERIFICATION=true
- Check browser permissions for camera
- Verify Socket.io connection
- Check for CORS issues

## Next Steps

1. **Complete Phase 5**: Implement comprehensive scoring system
2. **Integrate ML Model**: Add AI cheating detection
3. **Webcam Integration**: Add face detection
4. **Teacher Dashboard**: Create full analytics interface
5. **Mobile Responsiveness**: Optimize for mobile devices
6. **Performance Testing**: Load testing with multiple concurrent exams
7. **Production Deployment**: Deploy to Vercel and set up CI/CD

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Socket.io Documentation](https://socket.io/docs/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## Support & Contribution

For questions, issues, or contributions, please refer to the main README.md file.
