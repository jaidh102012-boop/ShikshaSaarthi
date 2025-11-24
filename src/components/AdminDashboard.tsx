import React, { useState } from 'react';
import { LogOut, Users, GraduationCap, BarChart3, Settings, TrendingUp, Calendar, Info, User, CreditCard as Edit, Save, X, Plus, School, Database, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User as UserType, Class, ExamTimetable } from '../types';
import { AttendanceRecord } from '../types';
import BackupManagement from './admin/BackupManagement';
import SystemSettings from './admin/SystemSettings';
import ExamTimetableComponent from './ExamTimetable';
import NotificationBanner from './NotificationBanner';
import AttendanceReports from './shared/AttendanceReports';

export default function AdminDashboard() {
  const { user, logout, users, classes, addUser, updateUser, removeUser, addClass, updateClass, removeClass, attendanceRecords, examTimetables, saveExamTimetable, updateExamTimetable, publishExamTimetable } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserType, setNewUserType] = useState<'teacher' | 'student'>('teacher');
  const [selectedClass, setSelectedClass] = useState('');
  const [showCreateExamTimetable, setShowCreateExamTimetable] = useState(false);
  const [editingExamTimetable, setEditingExamTimetable] = useState<string | null>(null);
  const [realTimeStats, setRealTimeStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    todayAttendance: 0
  });

  // Real-time stats calculation
  React.useEffect(() => {
    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.filter(a => a.date === today);
    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const totalStudentsToday = todayAttendance.length;
    
    setRealTimeStats({
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      todayAttendance: totalStudentsToday > 0 ? Math.round((presentToday / totalStudentsToday) * 100) : 0
    });
  }, [users, classes, attendanceRecords]);

  // Real-time class attendance calculation
  const getClassAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return classes.map(cls => {
      const classStudents = users.filter(u => 
        u.role === 'student' && u.class === cls.name && u.section === cls.section
      );
      const todayAttendance = attendanceRecords.filter(a => 
        a.date === today && a.classId === cls.id
      );
      const present = todayAttendance.filter(a => a.status === 'present').length;
      const total = classStudents.length;
      
      return {
        class: `${cls.name}-${cls.section}`,
        total,
        present,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0
      };
    });
  };

  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'attendance', label: 'Live Attendance', icon: TrendingUp },
    { id: 'reports', label: 'Attendance Reports', icon: ClipboardList },
    { id: 'exams', label: 'Exam Timetable', icon: Calendar },
    { id: 'backup', label: 'Data Backup', icon: Database },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info }
  ];

  const AddUserModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add New {newUserType === 'teacher' ? 'Teacher' : 'Student'}</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const newUser: UserType = {
            id: newUserType === 'teacher' ? `TCH${Date.now()}` : `STU${Date.now()}`,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            role: newUserType as 'teacher' | 'student',
            ...(newUserType === 'teacher' ? {
              subject: formData.get('subject') as string,
              assignedClass: formData.get('assignedClass') as string,
              assignedSection: formData.get('assignedSection') as string,
            } : {
              class: formData.get('class') as string,
              section: formData.get('section') as string,
              parentName: formData.get('parentName') as string,
              parentMobile: formData.get('parentMobile') as string,
              admissionNo: formData.get('admissionNo') as string,
            })
          };
          addUser(newUser);
          setShowAddUserModal(false);
        }}>
          <div className="space-y-4">
            <input name="name" placeholder="Full Name" className="w-full px-3 py-2 border rounded-lg" required />
            <input name="email" type="email" placeholder="Email" className="w-full px-3 py-2 border rounded-lg" required />
            <input name="phone" type="tel" placeholder="Phone Number" className="w-full px-3 py-2 border rounded-lg" required />
            
            {newUserType === 'teacher' ? (
              <>
                <input name="subject" placeholder="Subject" className="w-full px-3 py-2 border rounded-lg" required />
                <div className="grid grid-cols-2 gap-2">
                  <select name="assignedClass" className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select Class</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <select name="assignedSection" className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select Section</option>
                    {['A','B','C'].map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <select name="class" className="w-full px-3 py-2 border rounded-lg" required>
                    <option value="">Select Class</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <select name="section" className="w-full px-3 py-2 border rounded-lg" required>
                    <option value="">Select Section</option>
                    {['A','B','C'].map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
                <input name="parentName" placeholder="Parent Name" className="w-full px-3 py-2 border rounded-lg" required />
                <input name="parentMobile" placeholder="Parent Mobile" className="w-full px-3 py-2 border rounded-lg" required />
                <input name="admissionNo" placeholder="Admission Number" className="w-full px-3 py-2 border rounded-lg" required />
              </>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Add {newUserType === 'teacher' ? 'Teacher' : 'Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderLiveAttendance = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Live Daily Attendance</h3>
        
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
            <p className="text-sm opacity-90">Today's Attendance</p>
            <p className="text-2xl font-bold">{realTimeStats.todayAttendance}%</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
            <p className="text-sm opacity-90">Students Present</p>
            <p className="text-2xl font-bold">{attendanceRecords.filter(a => 
              a.date === new Date().toISOString().split('T')[0] && a.status === 'present'
            ).length}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
            <p className="text-sm opacity-90">Students Absent</p>
            <p className="text-2xl font-bold">{attendanceRecords.filter(a => 
              a.date === new Date().toISOString().split('T')[0] && a.status === 'absent'
            ).length}</p>
          </div>
        </div>

        {/* Class-wise Attendance */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-800">Class-wise Breakdown</h4>
          {getClassAttendance().map((classData) => (
            <div key={classData.class} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Class {classData.class}</p>
                <p className="text-sm text-gray-600">
                  {classData.present}/{classData.total} students present
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{classData.percentage}%</p>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${classData.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTeachers = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Teacher Management</h3>
          <button 
            onClick={() => {
              setNewUserType('teacher');
              setShowAddUserModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </button>
        </div>
        <div className="space-y-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                {editingTeacher === teacher.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                      <input
                        type="text"
                        defaultValue={teacher.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
                      <input
                        type="text"
                        defaultValue={teacher.subject}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={teacher.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Assigned Class</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          defaultValue={teacher.assignedClass || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select Class</option>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                        <select
                          defaultValue={teacher.assignedSection || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select Section</option>
                          {['A','B','C'].map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">{teacher.name}</p>
                    <p className="text-sm text-gray-600">{teacher.id} • {teacher.subject}</p>
                    <p className="text-xs text-gray-500">
                      {teacher.assignedClass && teacher.assignedSection 
                        ? `Class Teacher: ${teacher.assignedClass}-${teacher.assignedSection}` 
                        : 'No assigned class'}
                    </p>
                    <p className="text-xs text-gray-500">{teacher.email}</p>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {editingTeacher === teacher.id ? (
                  <>
                    <button 
                      onClick={() => setEditingTeacher(null)}
                      className="text-gray-600 hover:text-gray-700 text-sm flex items-center"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                    <button 
                      onClick={() => setEditingTeacher(null)}
                      className="text-green-600 hover:text-green-700 text-sm flex items-center"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setEditingTeacher(teacher.id)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                )}
                <button 
                  onClick={() => removeUser(teacher.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Student Management</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Classes</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(cls => 
                ['A','B','C'].map(sec => (
                  <option key={`${cls}-${sec}`} value={`${cls}-${sec}`}>Class {cls}-{sec}</option>
                ))
              ).flat()}
            </select>
            <button 
              onClick={() => {
                setNewUserType('student');
                setShowAddUserModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {students.filter(student => 
            !selectedClass || `${student.class}-${student.section}` === selectedClass
          ).map((student) => (
            <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                {editingStudent === student.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                      <input
                        type="text"
                        defaultValue={student.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={student.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
                      <select
                        defaultValue={student.class}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
                      <select
                        defaultValue={student.section}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {['A','B','C'].map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Parent Name</label>
                      <input
                        type="text"
                        defaultValue={student.parentName}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Parent Mobile</label>
                      <input
                        type="tel"
                        defaultValue={student.parentMobile}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Admission Number</label>
                      <input
                        type="text"
                        defaultValue={student.admissionNo}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.id} • Class {student.class}-{student.section}</p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                    <p className="text-xs text-gray-500">Parent: {student.parentName} • {student.parentMobile} • Admission: {student.admissionNo}</p>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {editingStudent === student.id ? (
                  <>
                    <button 
                      onClick={() => setEditingStudent(null)}
                      className="text-gray-600 hover:text-gray-700 text-sm flex items-center"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                    <button 
                      onClick={() => setEditingStudent(null)}
                      className="text-green-600 hover:text-green-700 text-sm flex items-center"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setEditingStudent(student.id)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                )}
                <button 
                  onClick={() => removeUser(student.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">SHIKSHA SAARTHI - Admin Portal</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex space-x-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Notifications */}
        <div className="mb-6">
          <NotificationBanner />
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Students</p>
                    <p className="text-2xl font-bold text-blue-600">{realTimeStats.totalStudents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Teachers</p>
                    <p className="text-2xl font-bold text-green-600">{realTimeStats.totalTeachers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Classes</p>
                    <p className="text-2xl font-bold text-purple-600">{realTimeStats.totalClasses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overall Attendance</p>
                    <p className="text-2xl font-bold text-yellow-600">{Math.round(
                      attendanceRecords.length > 0 
                        ? (attendanceRecords.filter(a => a.status === 'present').length / attendanceRecords.length) * 100
                        : 0
                    )}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
                    <p className="text-2xl font-bold text-indigo-600">{realTimeStats.todayAttendance}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Live Attendance
                </button>
                <button
                  onClick={() => setActiveTab('teachers')}
                  className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Manage Teachers
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className="flex items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Manage Students
                </button>
                <button
                  onClick={() => setActiveTab('teachers')}
                  className="flex items-center justify-center p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <School className="h-5 w-5 mr-2" />
                  View Classes by Teachers
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && renderLiveAttendance()}

        {activeTab === 'reports' && <AttendanceReports isTeacher={false} />}

        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Exam Timetable Management</h3>
                <button
                  onClick={() => {
                    const newExamTT: ExamTimetable = {
                      id: `EXTT${Date.now()}`,
                      name: `Exam Timetable - ${new Date().toLocaleDateString()}`,
                      rows: [],
                      isPublished: false,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    saveExamTimetable(newExamTT);
                    setEditingExamTimetable(newExamTT.id);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Timetable
                </button>
              </div>

              {examTimetables.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No exam timetables yet. Click "Create New Timetable" to start.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {examTimetables.map((examTT) => (
                    <div key={examTT.id} className="border rounded-lg p-6">
                      {editingExamTimetable === examTT.id ? (
                        <ExamTimetableComponent
                          examTimetable={examTT}
                          onUpdate={(updates) => updateExamTimetable(examTT.id, updates)}
                          onPublish={() => {
                            publishExamTimetable(examTT.id);
                            setEditingExamTimetable(null);
                          }}
                          isEditing={true}
                        />
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{examTT.name}</h4>
                              <p className="text-sm text-gray-600">
                                {examTT.rows.length} exams scheduled
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              {!examTT.isPublished && (
                                <button
                                  onClick={() => setEditingExamTimetable(examTT.id)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                              {examTT.isPublished && (
                                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                  Published
                                </span>
                              )}
                            </div>
                          </div>
                          <ExamTimetableComponent
                            examTimetable={examTT}
                            onUpdate={(updates) => updateExamTimetable(examTT.id, updates)}
                            onPublish={() => publishExamTimetable(examTT.id)}
                            isEditing={false}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'backup' && <BackupManagement />}
        {activeTab === 'teachers' && renderTeachers()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'settings' && <SystemSettings />}
        {activeTab === 'classes' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Class Overview</h3>
            <div className="text-center py-12 text-gray-500">
              <School className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Classes are now managed through Teacher assignments</p>
              <p className="text-sm">Go to Teachers tab to assign classes to teachers</p>
              <button
                onClick={() => setActiveTab('teachers')}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Manage Teachers & Classes
              </button>
            </div>
          </div>
        )}
        {activeTab === 'about' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">About SHIKSHA SAARTHI School Management System</h2>
                <p className="text-lg text-gray-600 mb-8">
                  A comprehensive digital solution for modern school administration and student management.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-8 mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Developers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-purple-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">Anshaj Pandey</h4>
                    <p className="text-gray-600">Developer</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-purple-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">Zaid Huda</h4>
                    <p className="text-gray-600">Developer</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-purple-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">Aayush Rai</h4>
                    <p className="text-gray-600">Developer</p>
                  </div>
                </div>
              </div>
              
              <div className="text-left space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Our Mission</h3>
                  <p className="text-gray-600">
                    To revolutionize school management through innovative technology, making education administration 
                    more efficient, transparent, and accessible for students, teachers, and administrators.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Key Features</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Real-time attendance tracking and monitoring</li>
                    <li>• Comprehensive student and teacher profile management</li>
                    <li>• Interactive timetable and exam schedule management</li>
                    <li>• Role-based access control for enhanced security</li>
                    <li>• Live dashboard with analytics and insights</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {showAddUserModal && <AddUserModal />}
    </div>
  );
}