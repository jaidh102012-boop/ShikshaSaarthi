import React, { useState } from 'react';
import { School, Heart } from 'lucide-react';
import RoleSelection from './components/RoleSelection';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import BalloonAnimation from './components/BalloonAnimation';

function AppContent() {
  const { user, role, showWelcome, setShowWelcome } = useAuth();
  const [showAnimation, setShowAnimation] = useState(true);

  if (showAnimation) {
    return <BalloonAnimation onComplete={() => setShowAnimation(false)} />;
  }

  if (showWelcome && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md w-full mx-4">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome!</h2>
            <p className="text-xl text-gray-600 mb-4">Hello, {user.name}</p>
            <p className="text-gray-500 capitalize">Logged in as {role}</p>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!role) {
    return <RoleSelection />;
  }

  if (!user) {
    return <Login role={role} />;
  }

  switch (role) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <RoleSelection />;
  }
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;