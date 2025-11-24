import React from 'react';
import { Users, GraduationCap, Shield, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoleSelection() {
  const { setRole } = useAuth();

  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'View attendance, timetables and manage profile',
      icon: GraduationCap,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'Manage attendance, timetables and student records',
      icon: Users,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'admin',
      title: 'Admin',
      description: 'Complete school management and oversight',
      icon: Shield,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <School className="h-16 w-16 text-indigo-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-800">SHIKSHA SAARTHI</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">School Management System</h2>
          <p className="text-gray-600">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => setRole(role.id as any)}
                className={`${role.color} ${role.hoverColor} text-white p-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}
              >
                <div className="text-center">
                  <IconComponent className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-3">{role.title}</h3>
                  <p className="text-sm opacity-90">{role.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}