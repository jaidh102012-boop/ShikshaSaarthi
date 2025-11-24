export interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'festival' | 'school' | 'other';
  description?: string;
  isActive: boolean;
}

export interface NotificationSettings {
  id: string;
  type: 'attendance' | 'assignment' | 'exam' | 'holiday' | 'general';
  enabled: boolean;
  recipients: ('students' | 'teachers' | 'parents')[];
  template: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  recipients: ('students' | 'teachers' | 'parents' | 'all')[];
  createdAt: string;
  createdBy: string;
  isActive: boolean;
  expiresAt?: string;
}

export interface ExamTimetableEntry {
  id: string;
  class: string;
  section: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  room?: string;
}

export interface SystemSettings {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  principalName: string;
  academicYear: AcademicYear;
  holidays: Holiday[];
  notificationSettings: NotificationSettings[];
  systemNotifications: SystemNotification[];
  attendanceSettings: {
    markingDeadline: string; // Time like "10:00"
    lateThreshold: number; // Minutes
    autoMarkAbsent: boolean;
  };
  examSettings: {
    passingMarks: number;
    maxMarks: number;
    gradingSystem: 'percentage' | 'grade' | 'both';
  };
  examTimetable: ExamTimetableEntry[];
}
</parameter>