'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  marks: number;
  order: number;
  options: Array<{
    id: string;
    optionText: string;
    order: number;
  }>;
}

interface Exam {
  id: string;
  title: string;
  duration: number;
  totalMarks: number;
  questions: Question[];
  randomizeQuestions: boolean;
  requiresProctoring: boolean;
}

export default function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const [showProctoring, setShowProctoring] = useState(false);

  useEffect(() => {
    // Properly unwrap params promise
    Promise.resolve(params).then(resolvedParams => {
      setExamId(resolvedParams.examId);
    }).catch(error => {
      console.error('[v0] Failed to get exam ID:', error);
      router.push('/dashboard');
    });
  }, [params, router]);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    if (examId) {
      fetchExam();
    }
  }, [user, token, router, examId]);

  const fetchExam = async () => {
    try {
      // Load exam from localStorage (mock database for preview)
      const examsData = localStorage.getItem('exams');
      const exams = examsData ? JSON.parse(examsData) : [];
      
      // Find the exam by ID
      const foundExam = exams.find((exam: any) => exam.id === examId);
      
      if (!foundExam) {
        throw new Error('Exam not found');
      }

      // Transform exam data to match interface
      const transformedExam: Exam = {
        id: foundExam.id,
        title: foundExam.title,
        duration: foundExam.duration,
        totalMarks: foundExam.totalMarks,
        questions: (foundExam.questions || []).map((question: any, questionIndex: number) => ({
          ...question,
          options: (question.options || []).map((option: any, optionIndex: number) =>
            typeof option === 'string'
              ? {
                  id: `${question.id || questionIndex}-option-${optionIndex}`,
                  optionText: option,
                  order: optionIndex,
                }
              : {
                  ...option,
                  id: option.id || `${question.id || questionIndex}-option-${optionIndex}`,
                  optionText: option.optionText ?? option.text ?? '',
                  order: option.order ?? optionIndex,
                },
          ),
        })),
        randomizeQuestions: foundExam.randomizeQuestions || false,
        requiresProctoring: foundExam.requiresProctoring || false
      };

      setExam(transformedExam);
      setTimeRemaining(transformedExam.duration * 60); // Convert to seconds
      setLoading(false);
    } catch (error) {
      console.error('[v0] Fetch exam error:', error);
      alert('Failed to load exam. Redirecting to dashboard.');
      router.push('/dashboard');
    }
  };

  // Timer logic
  useEffect(() => {
    if (!exam || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [exam, submitted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      const isSelected = currentAnswers.includes(optionId);

      return {
        ...prev,
        [questionId]: isSelected
          ? currentAnswers.filter(id => id !== optionId)
          : [...currentAnswers, optionId]
      };
    });
  };

  const handleSubmit = async () => {
    try {
      if (!exam || !examId) return;

      // Calculate score
      let totalScore = 0;
      exam.questions.forEach(question => {
        const studentAnswer = answers[question.id] || [];
        // For demo: simple scoring - if student selected any option, give marks
        if (studentAnswer.length > 0) {
          totalScore += question.marks;
        }
      });

      // Create result object
      const result = {
        id: Math.random().toString(36).substr(2, 9),
        examId: examId,
        studentId: user?.id,
        studentName: user?.name,
        answers,
        totalScore,
        totalMarks: exam.totalMarks,
        timeSpent: exam.duration * 60 - timeRemaining,
        submittedAt: new Date().toISOString(),
        status: totalScore >= exam.totalMarks * 0.4 ? 'PASSED' : 'FAILED' // Assuming 40% is passing
      };

      // Store result in localStorage
      const resultsData = localStorage.getItem('exam_results');
      const results = resultsData ? JSON.parse(resultsData) : [];
      results.push(result);
      localStorage.setItem('exam_results', JSON.stringify(results));

      setSubmitted(true);
      alert(`Exam submitted! Your score: ${totalScore}/${exam.totalMarks}`);
      router.push('/dashboard');
    } catch (error) {
      console.error('[v0] Submit error:', error);
      alert('Failed to submit exam. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Failed to load exam</p>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const timeWarning = timeRemaining < 300; // 5 minutes

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
            <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
          </div>

          <div className={`text-center px-4 py-2 rounded-lg ${timeWarning ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-sm font-semibold ${timeWarning ? 'text-red-700' : 'text-blue-700'}`}>
              {formatTime(timeRemaining)}
            </p>
            <p className="text-xs text-gray-600">Time Remaining</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {currentQuestion.questionText}
                </h2>
                <p className="text-sm text-gray-600">
                  Marks: <span className="font-semibold">{currentQuestion.marks}</span>
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQuestion.options?.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={answers[currentQuestion.id]?.includes(option.id) || false}
                      onChange={() => handleSelectOption(currentQuestion.id, option.id)}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                    />
                    <span className="ml-3 text-gray-700">{option.optionText}</span>
                  </label>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <Button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                >
                  Previous
                </Button>

                <Button
                  onClick={() => setCurrentQuestionIndex(Math.min(exam.questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === exam.questions.length - 1}
                  variant="outline"
                >
                  Next
                </Button>

                {currentQuestionIndex === exam.questions.length - 1 && (
                  <Button
                    onClick={handleSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Submit Exam
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-4 lg:grid-cols-5 gap-2">
                {exam.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-8 h-8 rounded text-sm font-semibold transition ${
                      idx === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : answers[q.id]
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-xs text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Current</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
