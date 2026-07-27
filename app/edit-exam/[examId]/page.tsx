'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';
import { useRouter, useParams } from 'next/navigation';

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
}

export default function EditExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [totalMarks, setTotalMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('40');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'MCQ',
    marks: 1,
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load exam data
  useEffect(() => {
    const loadExam = () => {
      try {
        const exams = localStorage.getItem('exams');
        const examsList = exams ? JSON.parse(exams) : [];
        const foundExam = examsList.find((e: Exam) => e.id === examId);

        if (!foundExam) {
          setErrorMessage('Exam not found');
          setIsLoading(false);
          return;
        }

        setExam(foundExam);
        setExamTitle(foundExam.title);
        setExamDescription(foundExam.description);
        setDuration(foundExam.duration.toString());
        setTotalMarks(foundExam.totalMarks.toString());
        setPassingMarks(foundExam.passingMarks.toString());
        setDepartment(foundExam.department);
        setCourse(foundExam.course);
        setQuestions(foundExam.questions);
      } catch (error) {
        console.error('[v0] Error loading exam:', error);
        setErrorMessage('Failed to load exam');
      } finally {
        setIsLoading(false);
      }
    };

    loadExam();
  }, [examId]);

  const handleAddQuestion = () => {
    const newErrors: Record<string, string> = {};

    if (!currentQuestion.text?.trim()) {
      newErrors.text = 'Question text is required';
    }

    if (currentQuestion.type === 'MCQ') {
      if (!currentQuestion.options || currentQuestion.options.length < 2) {
        newErrors.options = 'At least 2 options are required';
      }
      if (currentQuestion.correctAnswer === undefined) {
        newErrors.correctAnswer = 'Correct answer must be selected';
      }
    }

    if (!currentQuestion.marks || currentQuestion.marks < 1) {
      newErrors.marks = 'Marks must be at least 1';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newQuestion: Question = {
      id: currentQuestion.id || Math.random().toString(36).substr(2, 9),
      type: currentQuestion.type as Question['type'],
      text: currentQuestion.text!,
      marks: currentQuestion.marks!,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
    };

    const updatedQuestions = questions.map((q) =>
      q.id === newQuestion.id ? newQuestion : q
    );

    if (!questions.find((q) => q.id === newQuestion.id)) {
      updatedQuestions.push(newQuestion);
    }

    setQuestions(updatedQuestions);
    setCurrentQuestion({ type: 'MCQ', marks: 1 });
    setShowQuestionForm(false);
    setErrors({});
  };

  const handleEditQuestion = (question: Question) => {
    setCurrentQuestion(question);
    setShowQuestionForm(true);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSaveExam = async () => {
    setIsSaving(true);
    setErrorMessage('');
    const newErrors: Record<string, string> = {};

    if (!examTitle.trim()) newErrors.title = 'Exam title is required';
    if (!duration || parseInt(duration) < 1) newErrors.duration = 'Duration must be at least 1 minute';
    if (!totalMarks || parseInt(totalMarks) < 1) newErrors.totalMarks = 'Total marks must be at least 1';
    if (!passingMarks || parseInt(passingMarks) < 0)
      newErrors.passingMarks = 'Passing marks must be at least 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSaving(false);
      return;
    }

    if (questions.length === 0) {
      setErrorMessage('Please add at least one question before saving the exam.');
      setIsSaving(false);
      return;
    }

    const totalQuestionMarks = calculateCurrentTotalMarks();
    if (totalQuestionMarks !== parseInt(totalMarks)) {
      setErrorMessage(`Question marks (${totalQuestionMarks}) must equal total marks (${totalMarks}). Please adjust your questions.`);
      setIsSaving(false);
      return;
    }

    try {
      const updatedExam = {
        ...exam,
        title: examTitle,
        description: examDescription,
        duration: parseInt(duration),
        totalMarks: parseInt(totalMarks),
        passingMarks: parseInt(passingMarks),
        department,
        course,
        questions,
        updatedAt: new Date(),
      };

      const exams = localStorage.getItem('exams');
      const examsList = exams ? JSON.parse(exams) : [];
      const updatedExams = examsList.map((e: Exam) =>
        e.id === examId ? updatedExam : e
      );
      localStorage.setItem('exams', JSON.stringify(updatedExams));

      setSuccessMessage('Exam updated successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/teacher-dashboard');
      }, 2000);
    } catch (error) {
      setErrorMessage('Failed to save exam. Please try again.');
      console.error('[v0] Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateCurrentTotalMarks = () => {
    return questions.reduce((sum, q) => sum + q.marks, 0);
  };

  if (isLoading) {
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
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-700 mb-4">{errorMessage || 'Exam not found'}</p>
          <Link href="/teacher-dashboard">
            <Button className="bg-blue-600 hover:bg-blue-700">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 mb-8 rounded-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Edit Exam</h1>
          <Link href="/teacher-dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="col-span-2 space-y-6">
            {/* Exam Details */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title *</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g., Java Programming Final Exam"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    placeholder="Exam instructions and description..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g., Computer Science"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g., CS 101"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Settings */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Settings</h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks *</label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.totalMarks && <p className="text-red-500 text-sm mt-1">{errors.totalMarks}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passing Marks *</label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.passingMarks && <p className="text-red-500 text-sm mt-1">{errors.passingMarks}</p>}
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Questions ({questions.length}) - {calculateCurrentTotalMarks()} / {totalMarks} marks
                </h2>
                <Button
                  onClick={() => {
                    setCurrentQuestion({ type: 'MCQ', marks: 1 });
                    setShowQuestionForm(!showQuestionForm);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {showQuestionForm ? 'Cancel' : 'Add Question'}
                </Button>
              </div>

              {errors.questions && <p className="text-red-500 text-sm mb-4">{errors.questions}</p>}

              {/* Question Form */}
              {showQuestionForm && (
                <div className="border-2 border-blue-200 rounded-lg p-6 mb-6 bg-blue-50">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question Type *</label>
                      <select
                        value={currentQuestion.type}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            type: e.target.value as Question['type'],
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="MCQ">Multiple Choice</option>
                        <option value="DESCRIPTIVE">Descriptive</option>
                        <option value="CODE">Code</option>
                        <option value="MATCH">Match the Following</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                      <textarea
                        value={currentQuestion.text || ''}
                        onChange={(e) =>
                          setCurrentQuestion({ ...currentQuestion, text: e.target.value })
                        }
                        placeholder="Enter the question..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.text && <p className="text-red-500 text-sm mt-1">{errors.text}</p>}
                    </div>

                    {currentQuestion.type === 'MCQ' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                        <div className="space-y-2">
                          {(currentQuestion.options || []).map((option, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(currentQuestion.options || [])];
                                  newOptions[idx] = e.target.value;
                                  setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                }}
                                placeholder={`Option ${idx + 1}`}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={currentQuestion.correctAnswer === idx}
                                onChange={() =>
                                  setCurrentQuestion({ ...currentQuestion, correctAnswer: idx })
                                }
                                className="mt-3"
                              />
                            </div>
                          ))}
                          <Button
                            onClick={() => {
                              const newOptions = [...(currentQuestion.options || []), ''];
                              setCurrentQuestion({ ...currentQuestion, options: newOptions });
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            Add Option
                          </Button>
                        </div>
                        {errors.options && <p className="text-red-500 text-sm mt-1">{errors.options}</p>}
                        {errors.correctAnswer && (
                          <p className="text-red-500 text-sm mt-1">{errors.correctAnswer}</p>
                        )}
                      </div>
                    )}

                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marks *</label>
                      <input
                        type="number"
                        value={currentQuestion.marks}
                        onChange={(e) =>
                          setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })
                        }
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.marks && <p className="text-red-500 text-sm mt-1">{errors.marks}</p>}
                    </div>

                    <Button
                      onClick={handleAddQuestion}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {questions.find((q) => q.id === (currentQuestion.id || '')) ? 'Update Question' : 'Add Question'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Q{idx + 1} ({q.type}) - {q.marks} marks
                        </p>
                        <p className="text-gray-700 mt-1">{q.text}</p>
                        {q.type === 'MCQ' && q.options && (
                          <div className="mt-2 space-y-1">
                            {q.options.map((opt, i) => (
                              <p key={i} className="text-sm text-gray-600">
                                {String.fromCharCode(65 + i)}) {opt}
                                {i === q.correctAnswer && (
                                  <span className="text-green-600 font-medium"> ✓ (Correct)</span>
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEditQuestion(q)}
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleRemoveQuestion(q.id)}
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                onClick={handleSaveExam}
                disabled={isSaving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save & Publish Exam'}
              </Button>
              <Link href="/teacher-dashboard" className="flex-1">
                <Button variant="outline" className="w-full font-semibold py-2.5 rounded-lg" disabled={isSaving}>
                  Cancel
                </Button>
              </Link>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exam Title:</span>
                  <span className="font-medium text-gray-900">{examTitle || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-gray-900">{department || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Course:</span>
                  <span className="font-medium text-gray-900">{course || 'Not set'}</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">{duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Marks:</span>
                  <span className="font-medium text-gray-900">{totalMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Passing Marks:</span>
                  <span className="font-medium text-gray-900">{passingMarks}</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-medium text-gray-900">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Marks:</span>
                  <span
                    className={`font-medium ${
                      calculateCurrentTotalMarks() === parseInt(totalMarks)
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {calculateCurrentTotalMarks()}/{totalMarks}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
