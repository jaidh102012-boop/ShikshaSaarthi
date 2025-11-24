import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Class, Assignment, Submission, AttendanceRecord, Timetable, ExamTimetable } from '../types';
import SettingsService from '../services/settingsService';
interface AuthContextType {
  user: User | null;
  role: 'student' | 'teacher' | 'admin' | null;
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  setRole: (role: 'student' | 'teacher' | 'admin' | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  users: User[];
  classes: Class[];
  assignments: Assignment[];
  attendanceRecords: AttendanceRecord[];
  timetables: Timetable[];
  examTimetables: ExamTimetable[];
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;
  addClass: (classData: Class) => void;
  updateClass: (id: string, updates: Partial<Class>) => void;
  removeClass: (id: string) => void;
  addAssignment: (assignment: Assignment) => void;
  addSubmission: (submission: Submission) => void;
  markAttendance: (records: AttendanceRecord[]) => void;
  getAttendanceForDate: (date: string, classId?: string) => AttendanceRecord[];
  saveTimetable: (timetable: Timetable) => void;
  updateTimetable: (id: string, updates: Partial<Timetable>) => void;
  publishTimetable: (id: string) => void;
  saveExamTimetable: (examTimetable: ExamTimetable) => void;
  updateExamTimetable: (id: string, updates: Partial<ExamTimetable>) => void;
  publishExamTimetable: (id: string) => void;
  importBackupData: (data: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate unique IDs
const generateId = (prefix: string) => `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

// Initial admin user - only admin account exists by default
const initialUsers: User[] = [
  {
    id: 'ADMIN001',
    name: 'System Administrator',
    email: 'admin@kv2.com',
    role: 'admin',
    photo: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin' | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [examTimetables, setExamTimetables] = useState<ExamTimetable[]>([]);
  const [settingsService] = useState(() => SettingsService.getInstance());

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('kv2_users');
    const savedClasses = localStorage.getItem('kv2_classes');
    const savedAssignments = localStorage.getItem('kv2_assignments');
    const savedAttendance = localStorage.getItem('kv2_attendance');
    const savedTimetables = localStorage.getItem('kv2_timetables');
    const savedExamTimetables = localStorage.getItem('kv2_exam_timetables');

    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        // Ensure admin account always exists
        const hasAdmin = parsedUsers.some((u: User) => u.email === 'admin@kv2.com');
        if (!hasAdmin) {
          parsedUsers.unshift(initialUsers[0]);
        }
        setUsers(parsedUsers);
      } catch (e) {
        setUsers(initialUsers);
      }
    }

    if (savedClasses) {
      try {
        setClasses(JSON.parse(savedClasses));
      } catch (e) {
        setClasses([]);
      }
    }

    if (savedAssignments) {
      try {
        setAssignments(JSON.parse(savedAssignments));
      } catch (e) {
        setAssignments([]);
      }
    }

    if (savedAttendance) {
      try {
        setAttendanceRecords(JSON.parse(savedAttendance));
      } catch (e) {
        setAttendanceRecords([]);
      }
    }

    if (savedTimetables) {
      try {
        setTimetables(JSON.parse(savedTimetables));
      } catch (e) {
        setTimetables([]);
      }
    }

    if (savedExamTimetables) {
      try {
        setExamTimetables(JSON.parse(savedExamTimetables));
      } catch (e) {
        setExamTimetables([]);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('kv2_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kv2_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('kv2_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('kv2_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('kv2_timetables', JSON.stringify(timetables));
  }, [timetables]);

  useEffect(() => {
    localStorage.setItem('kv2_exam_timetables', JSON.stringify(examTimetables));
  }, [examTimetables]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Get the current role from context
    if (!role) return false;
    
    // Admin login
    if (role === 'admin' && email === 'admin@kv2.com' && password === 'admin@123') {
      const adminUser = users.find(u => u.email === 'admin@kv2.com');
      if (adminUser) {
        setUser(adminUser);
        setShowWelcome(true);
        return true;
      }
    }

    // Regular user login (for now, just check if user exists)
    const foundUser = users.find(u => u.email === email && u.role === role);
    if (foundUser && foundUser.role === role && password === 'password') { // Temporary password for all users
      setUser(foundUser);
      setShowWelcome(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setShowWelcome(false);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    }
  };

  const changePassword = async (userId: string, currentPassword: string, newPassword: string, isRecovery: boolean = false): Promise<boolean> => {
    const userPasswords = JSON.parse(localStorage.getItem('kv2_passwords') || '{}');
    const storedPassword = userPasswords[userId] || 'password';

    // Skip current password check if this is a recovery flow
    if (!isRecovery && currentPassword !== storedPassword) {
      return false;
    }

    userPasswords[userId] = newPassword;
    localStorage.setItem('kv2_passwords', JSON.stringify(userPasswords));
    return true;
  };

  const addUser = (newUser: User) => {
    const userWithId = {
      ...newUser,
      id: newUser.id || generateId(newUser.role === 'teacher' ? 'TCH' : 'STU')
    };
    setUsers(prev => [...prev, userWithId]);
    
    // If adding a teacher with assigned class, create the class if it doesn't exist
    if (newUser.role === 'teacher' && newUser.assignedClass && newUser.assignedSection) {
      const classExists = classes.find(c => 
        c.name === newUser.assignedClass && c.section === newUser.assignedSection
      );
      
      if (!classExists) {
        const newClass = {
          id: generateId('C'),
          name: newUser.assignedClass,
          section: newUser.assignedSection,
          classTeacherId: userWithId.id,
          students: []
        };
        setClasses(prev => [...prev, newClass]);
      } else {
        // Update existing class to assign this teacher as class teacher
        setClasses(prev => prev.map(c => 
          c.name === newUser.assignedClass && c.section === newUser.assignedSection
            ? { ...c, classTeacherId: userWithId.id }
            : c
        ));
      }
    }
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (user && user.id === id) {
      setUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    // Remove user from class student lists
    setClasses(prev => prev.map(c => ({
      ...c,
      students: c.students.filter(studentId => studentId !== id)
    })));
    // Remove attendance records
    setAttendanceRecords(prev => prev.filter(a => a.studentId !== id));
  };

  const addClass = (classData: Class) => {
    const classWithId = {
      ...classData,
      id: classData.id || generateId('C')
    };
    setClasses(prev => [...prev, classWithId]);
  };

  const updateClass = (id: string, updates: Partial<Class>) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    // Remove related assignments
    setAssignments(prev => prev.filter(a => a.classId !== id));
    // Remove related attendance records
    setAttendanceRecords(prev => prev.filter(a => a.classId !== id));
  };

  const addAssignment = (assignment: Assignment) => {
    const assignmentWithId = {
      ...assignment,
      id: assignment.id || generateId('A')
    };
    setAssignments(prev => [...prev, assignmentWithId]);
  };

  const addSubmission = (submission: Submission) => {
    setAssignments(prev => prev.map(a => 
      a.id === submission.assignmentId 
        ? { ...a, submissions: [...a.submissions, submission] }
        : a
    ));
  };

  const markAttendance = (records: AttendanceRecord[]) => {
    const recordsWithIds = records.map(record => ({
      ...record,
      id: record.id || generateId('ATT')
    }));
    
    // Remove existing records for the same date and class
    const date = recordsWithIds[0]?.date;
    const classId = recordsWithIds[0]?.classId;
    
    if (date && classId) {
      setAttendanceRecords(prev => {
        const filtered = prev.filter(a => !(a.date === date && a.classId === classId));
        return [...filtered, ...recordsWithIds];
      });
    }
  };

  const getAttendanceForDate = (date: string, classId?: string) => {
    return attendanceRecords.filter(record => {
      const matchesDate = record.date === date;
      const matchesClass = !classId || record.classId === classId;
      return matchesDate && matchesClass;
    });
  };

  const saveTimetable = (timetable: Timetable) => {
    const timetableWithId = {
      ...timetable,
      id: timetable.id || generateId('TT'),
      createdAt: timetable.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTimetables(prev => {
      const existing = prev.find(t => t.id === timetableWithId.id);
      if (existing) {
        return prev.map(t => t.id === timetableWithId.id ? timetableWithId : t);
      }
      return [...prev, timetableWithId];
    });
  };

  const updateTimetable = (id: string, updates: Partial<Timetable>) => {
    setTimetables(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    ));
  };

  const publishTimetable = (id: string) => {
    updateTimetable(id, { isPublished: true });
  };

  const saveExamTimetable = (examTimetable: ExamTimetable) => {
    const examTTWithId = {
      ...examTimetable,
      id: examTimetable.id || generateId('EXTT'),
      createdAt: examTimetable.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setExamTimetables(prev => {
      const existing = prev.find(t => t.id === examTTWithId.id);
      if (existing) {
        return prev.map(t => t.id === examTTWithId.id ? examTTWithId : t);
      }
      return [...prev, examTTWithId];
    });
  };

  const updateExamTimetable = (id: string, updates: Partial<ExamTimetable>) => {
    setExamTimetables(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    ));
  };

  const publishExamTimetable = (id: string) => {
    updateExamTimetable(id, { isPublished: true });
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      showWelcome,
      setShowWelcome,
      setRole,
      login,
      logout,
      updateProfile,
      changePassword,
      users,
      classes,
      assignments,
      attendanceRecords,
      timetables,
      examTimetables,
      addUser,
      updateUser,
      removeUser,
      addClass,
      updateClass,
      removeClass,
      addAssignment,
      addSubmission,
      markAttendance,
      getAttendanceForDate,
      saveTimetable,
      updateTimetable,
      publishTimetable,
      saveExamTimetable,
      updateExamTimetable,
      publishExamTimetable,
      importBackupData: async (data: any) => {
        try {
          if (data.users && Array.isArray(data.users)) {
            setUsers(data.users);
          }
          if (data.classes && Array.isArray(data.classes)) {
            setClasses(data.classes);
          }
          if (data.assignments && Array.isArray(data.assignments)) {
            setAssignments(data.assignments);
          }
          if (data.attendance && Array.isArray(data.attendance)) {
            setAttendanceRecords(data.attendance);
          }
          if (data.timetables && Array.isArray(data.timetables)) {
            setTimetables(data.timetables);
          }
          if (data.exam_timetables && Array.isArray(data.exam_timetables)) {
            setExamTimetables(data.exam_timetables);
          }
          return true;
        } catch (error) {
          console.error('Import failed:', error);
          return false;
        }
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}