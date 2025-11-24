import { SystemSettings, AcademicYear, Holiday, SystemNotification, NotificationSettings, ExamTimetableEntry } from '../types/settings';

class SettingsService {
  private static instance: SettingsService;
  private settings: SystemSettings;

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  private getDefaultSettings(): SystemSettings {
    return {
      schoolName: 'KV No.2',
      schoolAddress: 'School Address, City, State - 000000',
      schoolPhone: '+91-XXXXXXXXXX',
      schoolEmail: 'admin@kv2.in',
      principalName: 'Principal Name',
      academicYear: {
        id: 'ay2024-25',
        year: '2024-25',
        startDate: '2024-04-01',
        endDate: '2025-03-31',
        isActive: true
      },
      holidays: [
        {
          id: 'h1',
          name: 'Republic Day',
          date: '2025-01-26',
          type: 'national',
          description: 'National Holiday',
          isActive: true
        },
        {
          id: 'h2',
          name: 'Independence Day',
          date: '2025-08-15',
          type: 'national',
          description: 'National Holiday',
          isActive: true
        },
        {
          id: 'h3',
          name: 'Gandhi Jayanti',
          date: '2025-10-02',
          type: 'national',
          description: 'National Holiday',
          isActive: true
        }
      ],
      notificationSettings: [
        {
          id: 'ns1',
          type: 'attendance',
          enabled: true,
          recipients: ['students', 'parents'],
          template: 'Daily attendance notification'
        },
        {
          id: 'ns2',
          type: 'assignment',
          enabled: true,
          recipients: ['students'],
          template: 'New assignment notification'
        },
        {
          id: 'ns3',
          type: 'exam',
          enabled: true,
          recipients: ['students', 'parents'],
          template: 'Exam schedule notification'
        }
      ],
      systemNotifications: [],
      attendanceSettings: {
        markingDeadline: '10:00',
        lateThreshold: 15,
        autoMarkAbsent: false
      },
      examSettings: {
        passingMarks: 35,
        maxMarks: 100,
        gradingSystem: 'percentage'
      },
      examTimetable: []
    };
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('kv2_system_settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }

  private saveSettings(): void {
    localStorage.setItem('kv2_system_settings', JSON.stringify(this.settings));
  }

  getSettings(): SystemSettings {
    return this.settings;
  }

  updateSchoolInfo(info: Partial<Pick<SystemSettings, 'schoolName' | 'schoolAddress' | 'schoolPhone' | 'schoolEmail' | 'principalName'>>): void {
    this.settings = { ...this.settings, ...info };
    this.saveSettings();
  }

  updateAcademicYear(academicYear: AcademicYear): void {
    this.settings.academicYear = academicYear;
    this.saveSettings();
  }

  addHoliday(holiday: Omit<Holiday, 'id'>): Holiday {
    const newHoliday: Holiday = {
      ...holiday,
      id: `h_${Date.now()}`
    };
    this.settings.holidays.push(newHoliday);
    this.saveSettings();
    return newHoliday;
  }

  updateHoliday(id: string, updates: Partial<Holiday>): void {
    const index = this.settings.holidays.findIndex(h => h.id === id);
    if (index !== -1) {
      this.settings.holidays[index] = { ...this.settings.holidays[index], ...updates };
      this.saveSettings();
    }
  }

  removeHoliday(id: string): void {
    this.settings.holidays = this.settings.holidays.filter(h => h.id !== id);
    this.saveSettings();
  }

  createSystemNotification(notification: Omit<SystemNotification, 'id' | 'createdAt'>): SystemNotification {
    const newNotification: SystemNotification = {
      ...notification,
      id: `sn_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.settings.systemNotifications.unshift(newNotification);
    this.saveSettings();
    return newNotification;
  }

  updateNotificationSettings(settings: NotificationSettings[]): void {
    this.settings.notificationSettings = settings;
    this.saveSettings();
  }

  updateAttendanceSettings(settings: SystemSettings['attendanceSettings']): void {
    this.settings.attendanceSettings = settings;
    this.saveSettings();
  }

  updateExamSettings(settings: SystemSettings['examSettings']): void {
    this.settings.examSettings = settings;
    this.saveSettings();
  }

  getActiveNotifications(): SystemNotification[] {
    const now = new Date();
    return this.settings.systemNotifications.filter(n => 
      n.isActive && (!n.expiresAt || new Date(n.expiresAt) > now)
    );
  }

  getUpcomingHolidays(days: number = 30): Holiday[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.settings.holidays.filter(h => {
      const holidayDate = new Date(h.date);
      return h.isActive && holidayDate >= now && holidayDate <= futureDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  addExamEntry(entry: Omit<ExamTimetableEntry, 'id'>): ExamTimetableEntry {
    const newEntry: ExamTimetableEntry = {
      ...entry,
      id: `exam_${Date.now()}`
    };
    this.settings.examTimetable.push(newEntry);
    this.saveSettings();
    return newEntry;
  }

  updateExamEntry(id: string, updates: Partial<ExamTimetableEntry>): void {
    const index = this.settings.examTimetable.findIndex(e => e.id === id);
    if (index !== -1) {
      this.settings.examTimetable[index] = { ...this.settings.examTimetable[index], ...updates };
      this.saveSettings();
    }
  }

  removeExamEntry(id: string): void {
    this.settings.examTimetable = this.settings.examTimetable.filter(e => e.id !== id);
    this.saveSettings();
  }
}

export default SettingsService;
