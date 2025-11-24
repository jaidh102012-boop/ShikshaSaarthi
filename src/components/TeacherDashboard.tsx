import React, { useState, useEffect } from 'react';
import { LogOut, Users, Calendar, BookOpen, UserPlus, BarChart3, Info, User, CreditCard as Edit, Save, X, Plus, FileText, Upload, Download, Eye, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Assignment, Submission, FileAttachment, AttendanceRecord } from '../types';
import NotificationBanner from './NotificationBanner';
import TeacherAccountManagement from './teacher/TeacherAccountManagement';
import RealtimeService from '../services/realtimeService';
import AttendanceReports from './shared/AttendanceReports';

export default function TeacherDashboard() {
  const { user, logout, users, classes, assignments, addAssignment, markAttendance, attendanceRecords, addUser } = useAuth();
  const [realtimeService] = useState(() => RealtimeService.getInstance());
  const [updateTimestamp, setUpdateTimestamp] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editingTimetable, setEditingTimetable] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [studentAttendance, setStudentAttendance] = useState<{[key: string]: boolean}>({
    'S001': true,
    'S002': true,
    'S003': false,
    'S004': true
  });
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);

  // Real-time updates listener
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

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [realtimeService]);

  // Get teacher's assigned class and all classes for viewing
  const teacherClass = classes.find(c => c.classTeacherId === user?.id) || 
    (user?.assignedClass && user?.assignedSection ? {
      id: `temp_${user.assignedClass}_${user.assignedSection}`,
      name: user.assignedClass,
      section: user.assignedSection,
      classTeacherId: user.id,
      students: []
    } : null);
  const allClasses = classes;
  const students = users.filter(u => u.role === 'student');

  // Permission checks
  const canEditAttendance = selectedClass && teacherClass && 
    selectedClass === `${teacherClass.name}-${teacherClass.section}`;
  const canCreateStudents = !!teacherClass;
  const canCreateAssignments = true; // All teachers can create assignments for any class

  // Set default selected class to teacher's assigned class
  React.useEffect(() => {
    if (teacherClass && !selectedClass) {
      setSelectedClass(`${teacherClass.name}-${teacherClass.section}`);
    }
  }, [teacherClass, selectedClass]);

  // Real-time class statistics
  const getClassStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.filter(a => a.date === today);
    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
    const totalStudents = students.length;
    
    return {
      totalStudents,
      presentToday,
      absentToday,
      attendanceRate: totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0
    };
  };

  const classStats = getClassStats();

  const classOptions = allClasses.map(c => `${c.name}-${c.section}`);
  
  // Extended timetable with Saturday
  const [timetableData, setTimetableData] = useState([
    { startTime: '08:00', endTime: '08:45', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '' },
    { startTime: '08:45', endTime: '09:30', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '' },
    { startTime: '09:30', endTime: '09:45', monday: 'Short Break', tuesday: 'Short Break', wednesday: 'Short Break', thursday: 'Short Break', friday: 'Short Break', saturday: 'Short Break' },
    { startTime: '09:45', endTime: '10:30', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '' },
    { startTime: '10:30', endTime: '11:15', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '' },
    { startTime: '11:15', endTime: '12:00', monday: 'Long Break', tuesday: 'Long Break', wednesday: 'Long Break', thursday: 'Long Break', friday: 'Long Break', saturday: 'Long Break' },
    { startTime: '12:00', endTime: '12:45', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '' },
    { startTime: '12:45', endTime: '13:30', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '' },
    { startTime: '13:30', endTime: '14:15', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '' },
    { startTime: '14:15', endTime: '15:00', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '' }
  ]);

  // Get students for selected class
  const getStudentsForClass = (classStr: string) => {
    const [className, section] = classStr.split('-');
    return students.filter(s => s.class === className && s.section === section);
  };

  const filteredStudents = selectedClass ? getStudentsForClass(selectedClass) : [];
  
  // Check if current teacher can edit attendance for selected class

  // Real-time attendance management
  const [currentAttendance, setCurrentAttendance] = useState<{[key: string]: 'present' | 'absent' | 'late'}>({});
  const today = new Date().toISOString().split('T')[0];

  // Load today's attendance when class changes
  React.useEffect(() => {
    if (selectedClass) {
      const [className, section] = selectedClass.split('-');
      const classObj = classes.find(c => c.name === className && c.section === section);
      if (classObj) {
        const todayRecords = attendanceRecords.filter(a => 
          a.date === today && a.classId === classObj.id
        );
        const attendanceMap: {[key: string]: 'present' | 'absent' | 'late'} = {};
        todayRecords.forEach(record => {
          attendanceMap[record.studentId] = record.status;
        });
        setCurrentAttendance(attendanceMap);
      }
    }
  }, [selectedClass, attendanceRecords, today, classes]);

  const toggleAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!canEditAttendance) return;
    setCurrentAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const submitAttendance = () => {
    if (!canEditAttendance) return;
    
    const [className, section] = selectedClass.split('-');
    const classObj = classes.find(c => c.name === className && c.section === section);
    if (!classObj || !user) return;

    const records: AttendanceRecord[] = Object.entries(currentAttendance).map(([studentId, status]) => ({
      id: `ATT_${Date.now()}_${studentId}`,
      studentId,
      classId: classObj.id,
      date: today,
      status,
      markedBy: user.id
    }));

    markAttendance(records);
    realtimeService.broadcastAttendanceUpdate(records);
    setAttendanceSubmitted(true);
    setTimeout(() => setAttendanceSubmitted(false), 3000);
  };

  const updateTimetableCell = (rowIndex: number, day: string, value: string) => {
    setTimetableData(prev => prev.map((row, index) =>
      index === rowIndex ? { ...row, [day]: value } : row
    ));
  };

  const updateTimeSlot = (rowIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setTimetableData(prev => prev.map((row, index) =>
      index === rowIndex ? { ...row, [field]: value } : row
    ));
  };

  const CreateStudentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add Student to Your Class</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          if (!teacherClass) return;
          
          const newStudent = {
            id: `STU${Date.now()}`,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            role: 'student',
            class: teacherClass.name,
            section: teacherClass.section,
            parentName: formData.get('parentName') as string,
            parentMobile: formData.get('parentMobile') as string,
            admissionNo: formData.get('admissionNo') as string,
          };
          addUser(newStudent as User);
          setShowCreateStudentModal(false);
        }}>
          <div className="space-y-4">
            <input name="name" placeholder="Student Name" className="w-full px-3 py-2 border rounded-lg" required />
            <input name="email" type="email" placeholder="Student Email" className="w-full px-3 py-2 border rounded-lg" required />
            <input name="parentName" placeholder="Parent Name" className="w-full px-3 py-2 border rounded-lg" required />
            <input name="parentMobile" placeholder="Parent Mobile" className="w-full px-3 py-2 border rounded-lg" required />
            <input name="admissionNo" placeholder="Admission Number" className="w-full px-3 py-2 border rounded-lg" required />
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              Student will be added to: Class {teacherClass?.name}-{teacherClass?.section}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={() => setShowCreateStudentModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Add Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const CreateAssignmentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create New Assignment</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          // Only allow assignment to teacher's assigned class
          const selectedClassId = teacherClass?.id;
          
          if (!selectedClassId || !user) return;
          
          const newAssignment = {
            id: `A${Date.now()}`,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            classId: selectedClassId,
            teacherId: user.id,
            dueDate: formData.get('dueDate') as string,
            attachments: [],
            submissions: [],
            createdAt: new Date().toISOString()
          } as Assignment;
          
          addAssignment(newAssignment);
          realtimeService.broadcastAssignmentUpdate(newAssignment);
          setShowCreateAssignment(false);
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title</label>
              <input 
                name="title" 
                placeholder="Enter assignment title" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <div className="w-full px-3 py-2 border rounded-lg bg-gray-50">
                {teacherClass ? (
                  <span className="text-gray-900">Class {teacherClass.name}-{teacherClass.section}</span>
                ) : (
                  <span className="text-red-600">No class assigned to you</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You can only create assignments for your assigned class
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input 
                name="dueDate" 
                type="datetime-local" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                name="description" 
                rows={4} 
                placeholder="Enter assignment instructions..." 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload files or drag and drop</p>
                <input type="file" multiple className="hidden" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button 
              type="button" 
              onClick={() => setShowCreateAssignment(false)} 
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: Users },
    { id: 'reports', label: 'Attendance Reports', icon: ClipboardList },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'students', label: 'Students', icon: UserPlus },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'about', label: 'About', icon: Info }
  ];

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select Class</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
            {!canEditAttendance && selectedClass && (
              <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                View Only - Not your assigned class
              </span>
            )}
            {canCreateStudents && (
              <button 
                onClick={() => setShowCreateStudentModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </button>
            )}
          </div>
          {attendanceSubmitted && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              ✓ Attendance Submitted Successfully!
            </div>
          )}
        </div>
        
        {!selectedClass ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Please select a class to view attendance</p>
          </div>
        ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-600">{student.id} • {student.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                {canEditAttendance ? (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => toggleAttendance(student.id, 'present')}
                      className={`px-3 py-1 rounded text-sm ${
                        currentAttendance[student.id] === 'present'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => toggleAttendance(student.id, 'absent')}
                      className={`px-3 py-1 rounded text-sm ${
                        currentAttendance[student.id] === 'absent'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => toggleAttendance(student.id, 'late')}
                      className={`px-3 py-1 rounded text-sm ${
                        currentAttendance[student.id] === 'late'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                      }`}
                    >
                      Late
                    </button>
                  </div>
                ) : (
                  <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    currentAttendance[student.id] === 'present'
                      ? 'bg-green-100 text-green-800'
                      : currentAttendance[student.id] === 'late'
                      ? 'bg-yellow-100 text-yellow-800'
                      : currentAttendance[student.id] === 'absent'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {currentAttendance[student.id] || 'Not Marked'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
        
        {canEditAttendance && selectedClass && (
          <div className="mt-6">
          <button 
            onClick={submitAttendance}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Submit Attendance
          </button>
        </div>
        )}
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
          {teacherClass ? (
            <button 
              onClick={() => setShowCreateAssignment(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </button>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
              No class assigned - Contact admin to assign a class
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {assignments.filter(a => a.teacherId === user?.id).map((assignment) => {
            const assignmentClass = allClasses.find(c => c.id === assignment.classId);
            const classStudents = students.filter(s => 
              s.class === assignmentClass?.name && s.section === assignmentClass?.section
            );
            const submissionCount = assignment.submissions.length;
            
            return (
              <div key={assignment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                    <p className="text-sm text-gray-600">
                      Class {assignmentClass?.name}-{assignmentClass?.section} • 
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                    {assignmentClass?.id !== teacherClass?.id && (
                      <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1">
                        ⚠️ This assignment was created for a different class
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setSelectedAssignment(assignment.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Submissions ({submissionCount}/{classStudents.length})
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">{assignment.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      Created: {new Date(assignment.createdAt).toLocaleDateString()}
                    </span>
                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <span className="text-sm text-blue-600">
                        📎 {assignment.attachments.length} attachment(s)
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      submissionCount === classStudents.length 
                        ? 'bg-green-100 text-green-800' 
                        : submissionCount > 0 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {submissionCount}/{classStudents.length} submitted
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {assignments.filter(a => a.teacherId === user?.id).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No assignments created yet</p>
              <p className="text-sm">Create your first assignment to get started</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Assignment Submissions Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assignment Submissions</h3>
              <button 
                onClick={() => setSelectedAssignment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {assignments.find(a => a.id === selectedAssignment)?.submissions.map((submission) => {
                const student = students.find(s => s.id === submission.studentId);
                return (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{student?.name}</p>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {submission.files.map((file) => (
                          <button
                            key={file.id}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {file.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {submission.grade && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">Grade: {submission.grade}/100</span>
                      </div>
                    )}
                    
                    {submission.feedback && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-700">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  const renderTimetable = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Class Timetable Management</h3>
        <div className="flex space-x-2">
          {editingTimetable ? (
            <>
              <button 
                onClick={() => setEditingTimetable(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button 
                onClick={() => setEditingTimetable(false)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </>
          ) : (
            <button 
              onClick={() => setEditingTimetable(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Timetable
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Start Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">End Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Monday</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tuesday</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Wednesday</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Thursday</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Friday</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Saturday</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {timetableData.map((slot, index) => (
              <tr key={index}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {editingTimetable ? (
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    slot.startTime
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {editingTimetable ? (
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    slot.endTime
                  )}
                </td>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                  <td key={day} className="px-4 py-3 text-sm text-gray-600">
                    {editingTimetable ? (
                      <input
                        type="text"
                        value={slot[day as keyof typeof slot] || ''}
                        onChange={(e) => updateTimetableCell(index, day, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      slot[day as keyof typeof slot]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select Class</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>
        </div>
        
        {!selectedClass ? (
          <div className="text-center py-12 text-gray-500">
            <UserPlus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Please select a class to view students</p>
          </div>
        ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                {editingStudent === student.id && canEditAttendance ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                      <input
                        type="text"
                        defaultValue={student.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={student.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Parent Name</label>
                      <input
                        type="text"
                        defaultValue={student.parentName}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Parent Mobile</label>
                      <input
                        type="tel"
                        defaultValue={student.parentMobile}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Admission Number</label>
                      <input
                        type="text"
                        defaultValue={student.admissionNo}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              {canEditAttendance && (
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
              </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">SHIKSHA SAARTHI - Teacher Portal</h1>
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
                      ? 'border-green-500 text-green-600'
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
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-blue-600">{classStats.totalStudents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Present Today</p>
                    <p className="text-2xl font-bold text-green-600">{classStats.presentToday}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Absent Today</p>
                    <p className="text-2xl font-bold text-red-600">{classStats.absentToday}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{classStats.attendanceRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Mark Attendance
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Manage Assignments
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className="flex items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  View Students
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && renderAttendance()}
        {activeTab === 'reports' && <AttendanceReports isTeacher={true} teacherClassId={teacherClass?.id} />}
        {activeTab === 'assignments' && renderAssignments()}
        {activeTab === 'timetable' && renderTimetable()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'profile' && <TeacherAccountManagement />}
        {activeTab === 'about' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">About SHIKSHA SAARTHI School Management System</h2>
                <p className="text-lg text-gray-600 mb-8">
                  A comprehensive digital solution for modern school administration and student management.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Developers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-green-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">Anshaj Pandey</h4>
                    <p className="text-gray-600">Developer</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-green-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">Zaid Huda</h4>
                    <p className="text-gray-600">Developer</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-green-600" />
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
      
      {showCreateAssignment && <CreateAssignmentModal />}
      {showCreateStudentModal && <CreateStudentModal />}
    </div>
  );
}