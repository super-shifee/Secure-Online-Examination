'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  type: 'MCQ' | 'DESCRIPTIVE' | 'CODE' | 'MATCH';
  text: string;
  options?: string[];
  correctAnswer?: string | number;
  marks: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  department: string;
  course: string;
  questions: Question[];
  createdBy: string;
  createdAt: string;
  status: string;
  totalQuestions?: number;
  totalStudents?: number;
  completedStudents?: number;
  averageScore?: number;
}

interface Submission {
  attemptId: string;
  examId: string;
  subjectId?: string;
  subjectName?: string;
  examTitle: string;
  studentId: string;
  studentName?: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
  status: 'PENDING' | 'RELEASED';
}

export default function TeacherDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [activeTab, setActiveTab] = useState<'exams' | 'results' | 'analytics'>('exams');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'TEACHER')) {
      router.push('/login');
      return;
    }

    // Load exams from localStorage
    const loadExams = () => {
      try {
        const storedExams = localStorage.getItem('exams');
        const examsList = storedExams ? JSON.parse(storedExams) : [];
        
        // Map stored exams to display format with mock student data
        const formattedExams = examsList.map((exam: Exam) => ({
          ...exam,
          totalQuestions: exam.questions?.length || 0,
          totalStudents: Math.floor(Math.random() * 50) + 10,
          completedStudents: Math.floor(Math.random() * 30) + 5,
          averageScore: Math.floor(Math.random() * 40) + 60,
        }));
        
        setExams(formattedExams);
        const storedSubmissions = localStorage.getItem('exam_attempts');
        const parsedSubmissions = storedSubmissions ? JSON.parse(storedSubmissions) : [];
        setSubmissions(parsedSubmissions.filter((submission: Submission) =>
          formattedExams.some((exam: Exam) => exam.id === submission.examId)
        ));
      } catch (error) {
        console.error('[v0] Error loading exams:', error);
        setExams([]);
      } finally {
        setLoadingExams(false);
      }
    };

    loadExams();
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">ExamPortal</h1>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Teacher</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="text-red-600 hover:text-red-700">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h2>
          <p className="text-gray-600">Manage your exams, view student results, and analyze performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">Total Exams</p>
            <p className="text-3xl font-bold text-gray-900">{exams.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{exams.reduce((sum, e) => sum + (e.totalStudents || 0), 0)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">Completions</p>
            <p className="text-3xl font-bold text-gray-900">{exams.reduce((sum, e) => sum + (e.completedStudents || 0), 0)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">Avg Score</p>
            <p className="text-3xl font-bold text-gray-900">
              {exams.length > 0 
                ? Math.round((exams.reduce((sum, e) => sum + (e.averageScore || 0), 0)) / exams.length)
                : 0}%
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 flex">
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'exams'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Exams
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'results'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Student Results
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analytics
            </button>
          </div>

          <div className="p-6">
            {/* Exams Tab */}
            {activeTab === 'exams' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Created Exams</h3>
                  <Link href="/create-exam">
                    <Button className="bg-blue-600 hover:bg-blue-700">Create New Exam</Button>
                  </Link>
                </div>

                {loadingExams ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading exams...</p>
                  </div>
                ) : exams.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No exams created yet</p>
                    <Link href="/create-exam">
                      <Button className="bg-blue-600 hover:bg-blue-700">Create Your First Exam</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exams.map((exam) => (
                      <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{exam.title}</h4>
                            <p className="text-gray-600 text-sm mt-1">{exam.description}</p>
                            <div className="flex gap-6 mt-3 text-sm text-gray-600">
                              <span>Duration: {exam.duration} min</span>
                              <span>Questions: {exam.totalQuestions}</span>
                              <span>Students: {exam.totalStudents}</span>
                              <span className="text-blue-600">Completed: {exam.completedStudents}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/edit-exam/${exam.id}`}>
                              <Button variant="outline" className="text-sm">Edit</Button>
                            </Link>
                            <Link href={`/exam-results/${exam.id}`}>
                              <Button variant="outline" className="text-sm">Results</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Student Results</h3>
                <div className="space-y-4">
                  {submissions.length === 0 ? (
                    <p className="text-gray-600">No student submissions yet.</p>
                  ) : (
                    submissions.map((submission) => (
                      <div key={submission.attemptId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{submission.examTitle}</h4>
                            <p className="text-sm text-gray-600">
                              Student: {submission.studentName || submission.studentId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {submission.subjectName || 'General'} · Attempt {submission.attemptId}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xl font-bold text-blue-600">{submission.score}/{submission.totalMarks}</p>
                              <p className="text-sm text-gray-600">{submission.status}</p>
                            </div>
                            <Link href={`/exam-results/${submission.attemptId}`}>
                              <Button className="bg-blue-600 hover:bg-blue-700">View Result</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Completion Rate</h4>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{
                          width: `${
                            exams.length > 0
                              ? Math.round(
                                  (exams.reduce((sum, e) => sum + (e.completedStudents || 0), 0) /
                                    exams.reduce((sum, e) => sum + (e.totalStudents || 0), 0)) *
                                    100
                                )
                              : 0
                          }%`
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {exams.reduce((sum, e) => sum + (e.completedStudents || 0), 0)} of{' '}
                      {exams.reduce((sum, e) => sum + (e.totalStudents || 0), 0)} students
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Score Distribution</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Excellent (90-100%)</span>
                        <span className="font-semibold">35%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Good (75-89%)</span>
                        <span className="font-semibold">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average (60-74%)</span>
                        <span className="font-semibold">15%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Below Average (&lt;60%)</span>
                        <span className="font-semibold">5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
