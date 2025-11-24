import React, { useState, useEffect } from 'react';
import { LogOut, User, Calendar, BookOpen, BarChart3, Clock, AlertCircle, Info, FileText, Upload, Download, RefreshCw, MessageCircle, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StudentProfile from './student/StudentProfile';
import SaarthiFloatingButton from './student/SaarthiFloatingButton';
import MedicalLeaveView from './student/MedicalLeaveView';
import { Assignment, Submission } from '../types';
import SettingsService from '../services/settingsService';
import RealtimeService from '../services/realtimeService';
import NotificationBanner from './NotificationBanner';

export default function StudentDashboard() {
  const { user, logout, assignments, users, classes, attendanceRecords } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState('connected');
  const [updateTimestamp, setUpdateTimestamp] = useState<Date>(new Date());
  const [realtimeService] = useState(() => RealtimeService.getInstance());

  // Set up real-time listeners
  useEffect(() => {
    const unsubscribe1 = realtimeService.onAttendanceUpdate(() => {
      setUpdateTimestamp(new Date());
    });

    const unsubscribe2 = realtimeService.onAssignmentUpdate(() => {
      setUpdateTimestamp(new Date());
    });

    const unsubscribe3 = realtimeService.onTimetableUpdate(() => {
      setUpdateTimestamp(new Date());
    });

    const unsubscribe4 = realtimeService.onGradeUpdate(() => {
      setUpdateTimestamp(new Date());
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      unsubscribe4();
    };
  }, [realtimeService]);

  // Real-time attendance calculation for current student
  const getStudentAttendanceData = () => {
    if (!user) return { totalDays: 0, presentDays: 0, absentDays: 0, percentage: 0 };

    const studentAttendance = attendanceRecords.filter(record => record.studentId === user.id);
    const presentDays = studentAttendance.filter(record => record.status === 'present').length;
    const absentDays = studentAttendance.filter(record => record.status === 'absent').length;
    const lateDays = studentAttendance.filter(record => record.status === 'late').length;
    const totalDays = studentAttendance.length;

    return {
      totalDays,
      presentDays: presentDays + lateDays, // Count late as present
      absentDays,
      lateDays,
      percentage: totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0
    };
  };

  const attendanceData = getStudentAttendanceData();

  // Real-time holidays from settings
  const [settingsService] = useState(() => SettingsService.getInstance());
  const [holidays, setHolidays] = useState<any[]>([]);

  useEffect(() => {
    const upcomingHolidays = settingsService.getUpcomingHolidays(90); // Next 90 days
    setHolidays(upcomingHolidays);
  }, [settingsService, updateTimestamp]);

  // Sample timetable - in real implementation, this would come from database
  const getMyClassTimetable = () => {
    // This would be fetched from database based on student's class
    return [
      { time: '08:00-08:45', monday: 'Math', tuesday: 'English', wednesday: 'Physics', thursday: 'Chemistry', friday: 'Biology', saturday: 'Sports' },
      { time: '08:45-09:30', monday: 'English', tuesday: 'Math', wednesday: 'Chemistry', thursday: 'Physics', friday: 'Math', saturday: 'Art' },
      { time: '09:30-09:45', monday: 'Short Break', tuesday: 'Short Break', wednesday: 'Short Break', thursday: 'Short Break', friday: 'Short Break', saturday: 'Short Break' },
      { time: '09:45-10:30', monday: 'Physics', tuesday: 'Biology', wednesday: 'Math', thursday: 'English', friday: 'Chemistry', saturday: 'Music' },
      { time: '10:30-11:15', monday: 'Chemistry', tuesday: 'Physics', wednesday: 'English', thursday: 'Math', friday: 'English', saturday: 'Library' },
      { time: '11:15-12:00', monday: 'Long Break', tuesday: 'Long Break', wednesday: 'Long Break', thursday: 'Long Break', friday: 'Long Break', saturday: 'Long Break' },
      { time: '12:00-12:45', monday: 'History', tuesday: 'Geography', wednesday: 'Biology', thursday: 'Computer', friday: 'Art', saturday: 'Games' },
      { time: '12:45-13:30', monday: 'Geography', tuesday: 'History', wednesday: 'Computer', thursday: 'Biology', friday: 'Music', saturday: 'Study' },
      { time: '13:30-14:15', monday: 'Computer', tuesday: 'Art', wednesday: 'History', thursday: 'Geography', friday: 'Physics', saturday: 'Activity' },
      { time: '14:15-15:00', monday: 'Study', tuesday: 'Games', wednesday: 'Music', thursday: 'Study', friday: 'Games', saturday: 'Assembly' }
    ];
  };

  const myClassTimetable = getMyClassTimetable();

  // Sample exam schedule - in real implementation, this would come from database
  const getMyExamSchedule = () => {
    // This would be fetched from database based on student's class
    return [
      { date: '2025-02-10', subject: 'Mathematics', time: '09:00-12:00', room: 'Room 101' },
      { date: '2025-02-12', subject: 'English', time: '09:00-12:00', room: 'Room 102' },
      { date: '2025-02-14', subject: 'Physics', time: '09:00-12:00', room: 'Room 103' },
      { date: '2025-02-16', subject: 'Chemistry', time: '09:00-12:00', room: 'Room 104' }
    ];
  };

  const examTimetable = getMyExamSchedule();

  // Real-time absence data based on attendance records
  const getMyAbsenceReasons = () => {
    if (!user) return [];
    
    const myAbsences = attendanceRecords.filter(record => 
      record.studentId === user.id && record.status === 'absent'
    );
    
    // In real implementation, absence reasons would be stored separately
    // For now, we'll show the absence dates with generic reasons
    return myAbsences.slice(0, 5).map(absence => ({
      date: absence.date,
      reason: 'Absence recorded', // This would come from a separate absence reasons table
      status: 'Recorded'
    }));
  };

  const absenceReasons = getMyAbsenceReasons();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'medical-leave', label: 'Medical Leave', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'saarthi', label: 'SAARTHI', icon: MessageCircle },
    { id: 'about', label: 'About', icon: Info }
  ];

  // Get assignments for student's class
  const studentClass = classes.find(c => 
    c.name === user?.class && c.section === user?.section
  );
  const studentAssignments = assignments.filter(a => a.classId === studentClass?.id);

  // Google Drive integration for file upload
  const uploadToGoogleDrive = async (file: File) => {
    // This is a placeholder for Google Drive integration
    // In a real implementation, you would use Google Drive API
    console.log('Uploading to Google Drive:', file.name);
    
    // Simulate upload process
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `drive_${Date.now()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: `https://drive.google.com/file/d/mock_${Date.now()}/view`
        });
      }, 2000);
    });
  };

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">My Assignments</h3>
        
        <div className="space-y-4">
          {studentAssignments.map((assignment) => {
            const teacher = users.find(u => u.id === assignment.teacherId);
            const mySubmission = assignment.submissions.find(s => s.studentId === user?.id);
            const isOverdue = new Date(assignment.dueDate) < new Date();
            
            return (
              <div key={assignment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                    <p className="text-sm text-gray-600">
                      By {teacher?.name} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {mySubmission ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        ✓ Submitted
                      </span>
                    ) : isOverdue ? (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        Overdue
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">{assignment.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-blue-600">📎 Attachments:</span>
                        {assignment.attachments.map((file) => (
                          <button
                            key={file.id}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {file.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {!mySubmission && !isOverdue && (
                      <button 
                        onClick={() => setSelectedAssignment(assignment.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Submit
                      </button>
                    )}
                    
                    {mySubmission && (
                      <div className="text-sm text-gray-600">
                        Submitted: {new Date(mySubmission.submittedAt).toLocaleDateString()}
                        {mySubmission.grade && (
                          <span className="ml-2 font-medium">Grade: {mySubmission.grade}/100</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {mySubmission?.feedback && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Teacher Feedback:</p>
                    <p className="text-sm text-blue-800">{mySubmission.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
          
          {studentAssignments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No assignments available</p>
              <p className="text-sm">Check back later for new assignments</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Assignment Submission Modal with Google Drive Integration */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Submit Assignment</h3>
              <button 
                onClick={() => setSelectedAssignment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const files = formData.getAll('files') as File[];
              
              // Upload files to Google Drive
              const uploadedFiles = await Promise.all(
                files.map(file => uploadToGoogleDrive(file))
              );
              
              // Handle submission logic here with Google Drive links
              console.log('Files uploaded to Google Drive:', uploadedFiles);
              setSelectedAssignment(null);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Files to Google Drive
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload files or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Files will be uploaded to Google Drive automatically
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported: PDF, Word, Excel, Images
                    </p>
                    <input 
                      type="file" 
                      name="files"
                      multiple 
                      className="mt-2 block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments (Optional)
                  </label>
                  <textarea 
                    rows={3} 
                    placeholder="Add any comments about your submission..." 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Your files will be automatically uploaded to Google Drive and shared with your teacher.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  type="button" 
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Submit to Google Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Realtime Status Bar */}
      <div className="bg-green-50 border-b border-green-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700">Real-time sync active</span>
          </div>
          <span className="text-green-600 text-xs">
            Last update: {updateTimestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">SHIKSHA SAARTHI - Student Portal</h1>
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
                      ? 'border-indigo-500 text-indigo-600'
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

        {activeTab === 'profile' ? (
          <StudentProfile />
        ) : activeTab === 'assignments' ? (
          renderAssignments()
        ) : activeTab === 'medical-leave' ? (
          <MedicalLeaveView />
        ) : activeTab === 'saarthi' ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">SAARTHI - Study Assistant</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Welcome to SAARTHI, your AI-powered study assistant. Ask questions about your subjects, get help with concepts, upload study materials, and receive personalized learning support.
            </p>
            <div className="h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">Open SAARTHI Chat</p>
                <p className="text-sm text-gray-500 mb-4">Use the floating button in the bottom-right corner to chat with SAARTHI</p>
                <button
                  onClick={() => {
                    const floatingButton = document.querySelector('[title="Open SAARTHI Study Assistant"]') as HTMLButtonElement;
                    if (floatingButton) floatingButton.click();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'about' ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">About SHIKSHA SAARTHI School Management System</h2>
                <p className="text-lg text-gray-600 mb-8">
                  A comprehensive digital solution for modern school administration and student management.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-8 mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Developers</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">Anshaj Pandey</h4>
                    <p className="text-gray-600">Developer</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">Zaid Huda</h4>
                    <p className="text-gray-600">Developer</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">Aayush Rai</h4>
                    <p className="text-gray-600">Developer</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">Ayush K Rajeesh</h4>
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
                    <li>• Google Drive integration for assignment submissions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Attendance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Attendance %</p>
                    <p className="text-2xl font-bold text-green-600">{attendanceData.percentage}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Present Days</p>
                    <p className="text-2xl font-bold text-blue-600">{attendanceData.presentDays}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Absent Days</p>
                    <p className="text-2xl font-bold text-red-600">{attendanceData.absentDays}</p>
                  </div>
                </div>
              </div>

              {attendanceData.lateDays > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Late Days</p>
                      <p className="text-2xl font-bold text-yellow-600">{attendanceData.lateDays}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Clock className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Days</p>
                    <p className="text-2xl font-bold text-gray-600">{attendanceData.totalDays}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Holidays */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Holidays</h3>
              <div className="space-y-3">
                {holidays.map((holiday, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{holiday.name}</p>
                      <p className="text-sm text-gray-600">{new Date(holiday.date).toLocaleDateString()}</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                      {holiday.type}
                    </span>
                  </div>
                ))}
                {holidays.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p>No upcoming holidays</p>
                  </div>
                )}
              </div>
            </div>

            {/* Class Timetable */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Class Timetable ({user?.class}-{user?.section})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Monday</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tuesday</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Wednesday</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Thursday</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Friday</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Saturday</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {myClassTimetable.map((slot, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{slot.time}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{slot.monday}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{slot.tuesday}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{slot.wednesday}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{slot.thursday}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{slot.friday}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{slot.saturday}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exam Timetable */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Exam Schedule</h3>
              <div className="space-y-3">
                {examTimetable.map((exam, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div>
                      <p className="font-medium text-gray-900">{exam.subject}</p>
                      <p className="text-sm text-gray-600">{new Date(exam.date).toLocaleDateString()} • {exam.time}</p>
                    </div>
                    <span className="text-sm text-gray-600">{exam.room}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Absence Reasons */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Absence History</h3>
              <div className="space-y-3">
                {absenceReasons.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No absence records found</p>
                    <p className="text-sm">Perfect attendance!</p>
                  </div>
                ) : (
                absenceReasons.map((absence, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{new Date(absence.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">{absence.reason}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      absence.status === 'Approved' || absence.status === 'Recorded'
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {absence.status}
                    </span>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SAARTHI Floating Button - Always visible */}
      <SaarthiFloatingButton />
    </div>
  );
}