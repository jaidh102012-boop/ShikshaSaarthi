export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  role: 'student' | 'teacher' | 'admin';
  class?: string;
  section?: string;
  parentName?: string;
  parentMobile?: string;
  admissionNo?: string;
  subject?: string;
  assignedClass?: string;
  assignedSection?: string;
}

export interface Class {
  id: string;
  name: string;
  section: string;
  classTeacherId?: string;
  students: string[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  teacherId: string;
  dueDate: string;
  attachments?: FileAttachment[];
  submissions: Submission[];
  createdAt: string;
}

export interface Submission {
  id: string;
  studentId: string;
  assignmentId: string;
  files: FileAttachment[];
  submittedAt: string;
  grade?: number;
  feedback?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  markedBy: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  [key: string]: string;
}

export interface Timetable {
  id: string;
  classId: string;
  timeSlots: TimeSlot[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamTimetableRow {
  id: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  class: string;
  room: string;
  invigilator: string;
}

export interface ExamTimetable {
  id: string;
  name: string;
  rows: ExamTimetableRow[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalLeave {
  id: string;
  student_id: string;
  class: string;
  section: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  reason: string;
  certificate_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}