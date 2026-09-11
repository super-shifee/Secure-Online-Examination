'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Exam {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  department?: string;
  course?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startTime?: string;
  endTime?: string;
  questions?: any[];
  createdAt?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
}

interface Attempt {
  attemptId: string;
  examId: string;
  subjectId: string;
  subjectName: string;
  examTitle: string;
  studentId: string;
  score: number;
  totalMarks: number;
  totalQuestions: number;
  submittedAt: string;
  status: 'PENDING' | 'RELEASED';
}

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exams' | 'attempts'>('exams');

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    if (user.role !== 'STUDENT') {
      router.push('/teacher-dashboard');
      return;
    }

    fetchData();
  }, [user, token, router]);

  const fetchData = async () => {
    try {
      // Load exams from localStorage (mock database for preview)
      const examsData = localStorage.getItem('exams');
      const parsedExams = examsData ? JSON.parse(examsData) : [];
      
      // Transform exams to include timing information
      const transformedExams: Exam[] = parsedExams.map((exam: any) => ({
        ...exam,
        // If no startTime/endTime, make it available now for demo
        startTime: exam.startTime || new Date().toISOString(),
        endTime: exam.endTime || new Date(Date.now() + exam.duration * 60000).toISOString(),
        subject: exam.course || exam.department || 'General'
      }));
      
      setExams(transformedExams);

      const attemptsData = localStorage.getItem('exam_attempts');
      const parsedAttempts = attemptsData ? JSON.parse(attemptsData) : [];
      setAttempts(parsedAttempts.filter((attempt: Attempt) => attempt.studentId === user?.id && attempt.status === 'RELEASED'));
    } catch (error) {
      console.error('[v0] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (exam: Exam) => {
    // For demo purposes, show all published exams as available/ongoing
    const startTime = exam.startTime ? new Date(exam.startTime) : new Date();
    const endTime = exam.endTime ? new Date(exam.endTime) : new Date(Date.now() + exam.duration * 60000);
    const now = new Date();

    // Check if student has already taken this exam
    const studentAttempts = attempts.filter((attempt) => attempt.examId === exam.id);
    if (studentAttempts.length > 0) return 'completed';

    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'completed';
    return 'ongoing';
  };

  const hasStudentTakenExam = (examId: string) => {
    return attempts.some(r => r.examId === examId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'ongoing': return 'bg-green-50 border-green-200 text-green-700';
      case 'completed': return 'bg-gray-50 border-gray-200 text-gray-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.name}</p>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Available Exams</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              {exams.filter(e => getExamStatus(e) === 'upcoming').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Exams Completed</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              {attempts.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Average Score</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              {attempts.length > 0
                ? (attempts.reduce((sum, attempt) => sum + (attempt.score / attempt.totalMarks) * 100, 0) / attempts.length).toFixed(1)
                : 'N/A'}
              {attempts.length > 0 && <span className="text-lg">%</span>}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 flex">
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-6 py-4 font-semibold ${
                activeTab === 'exams'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Available Exams
            </button>
            <button
              onClick={() => setActiveTab('attempts')}
              className={`px-6 py-4 font-semibold ${
                activeTab === 'attempts'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Results
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'exams' ? (
              <div className="space-y-4">
                {exams.length === 0 ? (
                  <p className="text-gray-600">No exams available</p>
                ) : (
                  exams.map(exam => {
                    const status = getExamStatus(exam);
                    const alreadyTaken = hasStudentTakenExam(exam.id);
                    return (
                      <div
                        key={exam.id}
                        className={`p-4 rounded-lg border-2 ${getStatusColor(status)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{exam.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {exam.description}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-gray-500">Duration:</span>
                                <p className="font-semibold text-gray-900">{exam.duration} min</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Total Marks:</span>
                                <p className="font-semibold text-gray-900">{exam.totalMarks}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Passing Marks:</span>
                                <p className="font-semibold text-gray-900">{exam.passingMarks}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Questions:</span>
                                <p className="font-semibold text-gray-900">{exam.questions?.length || 0}</p>
                              </div>
                            </div>
                            {exam.course && (
                              <p className="text-xs text-gray-500 mt-2">
                                Course: {exam.course} | Department: {exam.department}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                              status === 'ongoing' ? 'bg-green-200 text-green-800' :
                              status === 'upcoming' ? 'bg-blue-200 text-blue-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {alreadyTaken ? 'Completed' : status}
                            </span>
                            {status === 'ongoing' && !alreadyTaken && (
                              <Link href={`/exam/${exam.id}`} className="block mt-3">
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                  Start Exam
                                </Button>
                              </Link>
                            )}
                            {alreadyTaken && (
                              <div className="block mt-3">
                                <Button className="w-full bg-gray-400 cursor-not-allowed" disabled>
                                  Already Completed
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {attempts.length === 0 ? (
                  <p className="text-gray-600">No attempts yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Exam</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Marks</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Percentage</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts.map((attempt) => {
                          const percentage = (attempt.score / attempt.totalMarks) * 100;
                          return (
                            <tr key={attempt.attemptId} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-4 px-4">{attempt.examTitle}</td>
                              <td className="py-4 px-4 font-semibold">{attempt.score}/{attempt.totalMarks}</td>
                              <td className="py-4 px-4">
                                <span className={`font-semibold ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                                  {percentage.toFixed(2)}%
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${percentage >= 40 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {percentage >= 40 ? 'Passed' : 'Failed'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">
                                {new Date(attempt.submittedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
