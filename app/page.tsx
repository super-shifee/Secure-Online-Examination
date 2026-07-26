'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';

export default function Page() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ExamPortal</h1>
          <div className="space-x-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Secure Online Examinations
        </h2>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          A comprehensive platform for conducting secure online exams with advanced proctoring,
          AI-powered cheating detection, and detailed analytics.
        </p>

        {!isAuthenticated && (
          <div className="space-x-4">
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="px-8 py-3 text-lg">
                Create Account
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Advanced Proctoring',
                description: 'Real-time webcam monitoring and suspicious activity detection'
              },
              {
                title: 'AI Cheating Detection',
                description: 'Machine learning algorithms to detect unusual patterns and behaviors'
              },
              {
                title: 'Flexible Question Types',
                description: 'Multiple choice, descriptive, code-based, and match-the-following'
              },
              {
                title: 'Comprehensive Analytics',
                description: 'Detailed performance metrics and result analysis for teachers'
              },
              {
                title: 'Secure & Reliable',
                description: 'Enterprise-grade security with audit logs and encryption'
              },
              {
                title: 'Easy Management',
                description: 'Intuitive interface for creating and managing exams and results'
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2024 ExamPortal. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
