'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';

export default function ExamResultsPage({ params }: { params: { resultId: string } }) {
  const { user } = useAuth();
  const router = useRouter();

  // Mock exam result data
  const mockResult = {
    id: params.resultId,
    examName: 'Mathematics Final Exam',
    studentName: user?.name || 'John Student',
    studentEmail: user?.email || 'student@example.com',
    totalScore: 78,
    maxScore: 100,
    percentage: 78,
    status: 'PASSED',
    completedAt: new Date().toLocaleDateString(),
    duration: '1h 45m',
    totalQuestions: 30,
    correctAnswers: 23,
    wrongAnswers: 5,
    unanswered: 2,
    questions: [
      {
        id: 1,
        type: 'MCQ',
        question: 'What is the derivative of x^2?',
        options: ['x', '2x', 'x^3', '2'],
        userAnswer: '2x',
        correctAnswer: '2x',
        marks: 2,
        isCorrect: true,
      },
      {
        id: 2,
        type: 'MCQ',
        question: 'Solve: 5x + 10 = 30',
        options: ['2', '4', '8', '10'],
        userAnswer: '4',
        correctAnswer: '4',
        marks: 2,
        isCorrect: true,
      },
      {
        id: 3,
        type: 'MCQ',
        question: 'What is the value of sin(90°)?',
        options: ['0', '1', '-1', 'undefined'],
        userAnswer: 'undefined',
        correctAnswer: '1',
        marks: 2,
        isCorrect: false,
      },
      {
        id: 4,
        type: 'DESCRIPTIVE',
        question: 'Explain the concept of integration.',
        userAnswer: 'Integration is the reverse of differentiation...',
        correctAnswer: 'Integration is a mathematical operation that finds the area under curves or reverses differentiation.',
        marks: 5,
        markedMarks: 4,
        isCorrect: false,
      },
      {
        id: 5,
        type: 'MCQ',
        question: 'Calculate: 15% of 200',
        options: ['20', '30', '40', '50'],
        userAnswer: '30',
        correctAnswer: '30',
        marks: 2,
        isCorrect: true,
      },
    ],
  };

  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getQuestionStatusIcon = (isCorrect: boolean) => {
    return isCorrect ? '✓' : '✗';
  };

  const getQuestionStatusColor = (isCorrect: boolean) => {
    return isCorrect ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
            <p className="text-gray-600 mt-1">{mockResult.examName}</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Result Summary Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Score Display */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border-8 border-blue-200 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl font-bold text-blue-600">{mockResult.percentage}</p>
                  <p className="text-gray-600 mt-2">%</p>
                </div>
              </div>
              <div className={`mt-6 px-6 py-3 rounded-lg border ${getStatusColor(mockResult.status)}`}>
                <p className="font-semibold text-lg">{mockResult.status}</p>
              </div>
            </div>

            {/* Result Details */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Total Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockResult.totalScore}/{mockResult.maxScore}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-700 text-sm font-medium">Correct</p>
                  <p className="text-2xl font-bold text-green-600">{mockResult.correctAnswers}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-700 text-sm font-medium">Wrong</p>
                  <p className="text-2xl font-bold text-red-600">{mockResult.wrongAnswers}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Duration</p>
                <p className="text-xl font-bold text-gray-900">{mockResult.duration}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Completed On</p>
                <p className="text-lg font-semibold text-gray-900">{mockResult.completedAt}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-600 text-sm mb-3">Overall Performance</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  mockResult.percentage >= 70 ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${mockResult.percentage}%` }}
              />
            </div>
            <p className="text-gray-600 text-xs mt-2">
              {mockResult.correctAnswers} out of {mockResult.totalQuestions} questions answered correctly
            </p>
          </div>
        </div>

        {/* Question Review Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Question-by-Question Review</h2>
            <p className="text-blue-100 text-sm mt-1">
              Review your answers and learn from your mistakes
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {mockResult.questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 last:border-b-0">
                <button
                  onClick={() =>
                    setExpandedQuestion(expandedQuestion === question.id ? null : question.id)
                  }
                  className="w-full px-6 py-4 flex justify-between items-start hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-2xl font-bold ${getQuestionStatusColor(question.isCorrect)}`}>
                        {getQuestionStatusIcon(question.isCorrect)}
                      </span>
                      <span className="text-gray-600 font-medium">Question {index + 1}</span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {question.type}
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold">{question.question}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">
                        Marks: {question.isCorrect ? question.marks : question.markedMarks || 0}/{question.marks}
                      </span>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedQuestion === question.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedQuestion === question.id && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    {question.type === 'MCQ' && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Options:</p>
                          <div className="space-y-2">
                            {question.options?.map((option, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded border ${
                                  option === question.correctAnswer
                                    ? 'bg-green-50 border-green-300'
                                    : option === question.userAnswer
                                    ? 'bg-red-50 border-red-300'
                                    : 'bg-gray-100 border-gray-300'
                                }`}
                              >
                                <p className="text-sm text-gray-900">
                                  {option === question.correctAnswer && (
                                    <span className="font-semibold text-green-700">✓ </span>
                                  )}
                                  {option === question.userAnswer && option !== question.correctAnswer && (
                                    <span className="font-semibold text-red-700">✗ </span>
                                  )}
                                  {option}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Your Answer: <span className="text-gray-900">{question.userAnswer}</span>
                          </p>
                          <p className="text-sm font-medium text-gray-600 mt-1">
                            Correct Answer: <span className="text-green-700 font-semibold">{question.correctAnswer}</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {question.type === 'DESCRIPTIVE' && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Your Answer:</p>
                          <div className="bg-white p-3 rounded border border-gray-300 text-sm text-gray-900">
                            {question.userAnswer}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Model Answer:</p>
                          <div className="bg-white p-3 rounded border border-green-300 text-sm text-gray-900">
                            {question.correctAnswer}
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                          <p className="text-sm text-blue-900">
                            <span className="font-medium">Marks Awarded:</span> {question.markedMarks || 0}/{question.marks}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button className="bg-blue-600 hover:bg-blue-700">Return to Dashboard</Button>
          </Link>
          <Button variant="outline" onClick={() => window.print()}>
            Print Results
          </Button>
        </div>
      </div>
    </div>
  );
}
