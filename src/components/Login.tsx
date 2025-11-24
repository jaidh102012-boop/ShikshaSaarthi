import React, { useState } from 'react';
import { LogIn, ArrowLeft, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PasswordRecoveryModal from './shared/PasswordRecoveryModal';

interface LoginProps {
  role: 'student' | 'teacher' | 'admin';
}

export default function Login({ role }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const { login, setRole } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDemoCredentials = () => {
    switch (role) {
      case 'student':
        return { email: 'student@kv2.com', password: 'password' };
      case 'teacher':
        return { email: 'teacher@kv2.com', password: 'password' };
      case 'admin':
        return { email: 'admin@kv2.com', password: 'admin@123' };
    }
  };

  const fillDemoCredentials = () => {
    const creds = getDemoCredentials();
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => setRole(null)}
          className="mb-6 flex items-center text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to role selection
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <School className="h-12 w-12 text-indigo-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">SHIKSHA SAARTHI</h1>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 capitalize">{role} Login</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <div>
              <button
                onClick={fillDemoCredentials}
                className="text-sm text-indigo-600 hover:text-indigo-700 underline"
              >
                Fill credentials
              </button>
            </div>
            {role !== 'admin' && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Forgot password? Recover account
                </button>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              {role === 'admin' ? 'Admin Login' : 'Create accounts from Admin panel'}
            </div>
          </div>
        </div>

        <PasswordRecoveryModal
          isOpen={showRecovery}
          onClose={() => setShowRecovery(false)}
          onSuccess={() => {
            setShowRecovery(false);
            setEmail('');
            setPassword('');
          }}
        />
      </div>
    </div>
  );
}