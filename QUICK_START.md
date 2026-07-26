# Quick Start Guide - Online Examination System

## 30-Second Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Update .env.local with your MySQL connection
DATABASE_URL=mysql://root:password@localhost:3306/exam_db

# 3. Run migrations
pnpm exec prisma migrate dev

# 4. Start backend (Terminal 1)
pnpm run dev:backend

# 5. Start frontend (Terminal 2)
pnpm dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: `pnpm run prisma:studio`

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | student@example.com | Password123! |
| Teacher | teacher@example.com | Password123! |
| Admin | admin@example.com | Password123! |

## Core URLs

### Student
- Dashboard: `/dashboard` - View exams and results
- Take Exam: `/exam/[examId]` - Take an exam
- View Results: Results shown in dashboard

### Teacher
- Dashboard: `/teacher-dashboard` - Manage exams (to be built)
- Create Exam: Part of dashboard (to be built)

### Admin
- Dashboard: `/admin-dashboard` - System management (to be built)
- Users: `/admin-dashboard/users` (to be built)

## Key Files

| File | Purpose |
|------|---------|
| `server/index.js` | Express backend entry point |
| `app/layout.tsx` | Root layout |
| `app/page.tsx` | Landing page |
| `app/dashboard/page.tsx` | Student dashboard |
| `app/exam/[examId]/page.tsx` | Exam interface |
| `lib/authContext.tsx` | Authentication provider |
| `prisma/schema.prisma` | Database schema |
| `.env.local` | Configuration |

## API Endpoints Quick Reference

```
AUTH:
  POST   /api/auth/login
  POST   /api/auth/register
  GET    /api/auth/me
  POST   /api/auth/logout

EXAMS:
  GET    /api/exams
  GET    /api/exams/:examId
  POST   /api/exams (Teacher/Admin)
  PUT    /api/exams/:examId (Teacher/Admin)
  DELETE /api/exams/:examId (Teacher/Admin)

STUDENT:
  GET    /api/students/dashboard
  POST   /api/students/enroll/:examId

RESULTS:
  GET    /api/results/my-results
  GET    /api/results/:resultId

PROCTOR:
  POST   /api/proctor/session/start/:examId
  POST   /api/proctor/alert
```

## Useful Commands

```bash
# Development
pnpm dev              # Start frontend
pnpm run dev:backend  # Start backend
pnpm run dev:all      # Start both (requires concurrently)

# Database
pnpm run prisma:migrate    # Create migrations
pnpm run prisma:studio     # Open Prisma Studio
pnpm exec prisma db seed   # Seed test data

# Building
pnpm build            # Build Next.js
pnpm start            # Production server

# Utilities
pnpm exec prisma generate  # Generate Prisma client
```

## Project Structure at a Glance

```
Frontend (Next.js)
  ├── app/                    # Pages and routes
  ├── components/ui/          # shadcn UI components
  ├── lib/authContext.tsx    # Authentication
  └── app/api/               # API routes (proxy to backend)

Backend (Express)
  ├── server/index.js        # Server entry point
  ├── server/routes/         # API endpoints
  ├── server/middleware/     # Auth & error handling
  └── server/utils/          # Utilities (JWT, password)

Database
  └── prisma/schema.prisma   # Database schema

Config
  ├── .env.local             # Environment variables
  ├── next.config.mjs        # Next.js config
  ├── package.json           # Dependencies
  └── tsconfig.json          # TypeScript config
```

## Common Tasks

### Add a New Student Account
1. Go to `/register`
2. Select "Student" role
3. Fill enrollment number and department
4. Submit

### Create an Exam (Teacher)
1. Login as teacher
2. Go to teacher dashboard (to be built)
3. Click "Create Exam"
4. Fill exam details
5. Add questions

### View Exam Results (Student)
1. Login as student
2. Go to dashboard
3. Click "Results" tab
4. View your results

### Review Cheating Alerts (Admin)
1. Login as admin
2. Go to admin dashboard (to be built)
3. Click "Alerts"
4. Review suspicious activities

## Troubleshooting

### "Cannot connect to database"
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify connection string in .env.local
DATABASE_URL=mysql://root:password@localhost:3306/exam_db

# Run migrations
pnpm exec prisma migrate dev
```

### "Port 3000 already in use"
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or use a different port
pnpm dev -p 3002
```

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### "Token invalid or expired"
```
- Clear browser localStorage
- Login again
- Copy new token
```

## Environment Variables

```env
# Database (required)
DATABASE_URL=mysql://user:password@localhost:3306/exam_db

# Server
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=generate-a-random-string
BETTER_AUTH_SECRET=another-random-string

# Optional
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
ENABLE_WEBCAM_VERIFICATION=true
ENABLE_AI_DETECTION=true
```

## Development Tips

1. **Use Prisma Studio** to visualize database
   ```bash
   pnpm run prisma:studio
   ```

2. **Check API responses** in browser console
   ```javascript
   fetch('/api/exams')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

3. **Monitor backend** for errors
   ```
   Check server terminal for [v0] debug messages
   ```

4. **Use React DevTools** to inspect components
   ```
   Extension: React Developer Tools
   ```

## Next Steps

1. ✅ Verify both servers running
2. ✅ Test login with demo credentials
3. ✅ Create and take a test exam
4. ✅ View results
5. 🔲 Implement scoring system
6. 🔲 Add proctoring/webcam
7. 🔲 Add AI detection
8. 🔲 Build teacher dashboard
9. 🔲 Build admin dashboard
10. 🔲 Deploy to production

## Documentation

For more details, see:
- `README.md` - Full project documentation
- `IMPLEMENTATION_GUIDE.md` - Detailed implementation instructions
- `DELIVERABLES.md` - Complete deliverables list
- Code comments throughout the project

## Support

Questions? Check the logs:
```bash
# Backend errors
node server/index.js

# Frontend errors
pnpm dev
# Look for errors in terminal or browser console
```

---

**Happy coding!** Start with logging in and taking a test exam to see the system in action.
