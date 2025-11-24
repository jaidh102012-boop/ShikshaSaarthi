import { AttendanceRecord } from '../types';

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
}

export interface MonthlyAttendance {
  month: string;
  year: number;
  stats: AttendanceStats;
  records: AttendanceRecord[];
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  yearlyStats: AttendanceStats;
  monthlyBreakdown: MonthlyAttendance[];
}

class AttendanceAnalyticsService {
  private static instance: AttendanceAnalyticsService;

  static getInstance(): AttendanceAnalyticsService {
    if (!AttendanceAnalyticsService.instance) {
      AttendanceAnalyticsService.instance = new AttendanceAnalyticsService();
    }
    return AttendanceAnalyticsService.instance;
  }

  calculateStats(records: AttendanceRecord[]): AttendanceStats {
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const totalDays = records.length;

    return {
      totalDays,
      presentDays: presentDays + lateDays,
      absentDays,
      lateDays,
      percentage: totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0
    };
  }

  getMonthlyAttendance(
    records: AttendanceRecord[],
    month: number,
    year: number
  ): MonthlyAttendance {
    const monthRecords = records.filter(r => {
      const date = new Date(r.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      month: monthNames[month],
      year,
      stats: this.calculateStats(monthRecords),
      records: monthRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }

  getYearlyAttendance(records: AttendanceRecord[], year: number): AttendanceRecord[] {
    return records.filter(r => {
      const date = new Date(r.date);
      return date.getFullYear() === year;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getStudentYearlySummary(
    studentId: string,
    studentName: string,
    studentClass: string,
    studentSection: string,
    allRecords: AttendanceRecord[],
    year: number
  ): StudentAttendanceSummary {
    const studentRecords = this.getYearlyAttendance(
      allRecords.filter(r => r.studentId === studentId),
      year
    );

    const monthlyBreakdown: MonthlyAttendance[] = [];
    for (let month = 0; month < 12; month++) {
      const monthlyData = this.getMonthlyAttendance(studentRecords, month, year);
      if (monthlyData.records.length > 0) {
        monthlyBreakdown.push(monthlyData);
      }
    }

    return {
      studentId,
      studentName,
      class: studentClass,
      section: studentSection,
      yearlyStats: this.calculateStats(studentRecords),
      monthlyBreakdown
    };
  }

  getClassMonthlyStats(
    classId: string,
    allRecords: AttendanceRecord[],
    month: number,
    year: number
  ): AttendanceRecord[] {
    return allRecords.filter(r => {
      const date = new Date(r.date);
      return r.classId === classId &&
             date.getMonth() === month &&
             date.getFullYear() === year;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getClassYearlyStats(
    classId: string,
    allRecords: AttendanceRecord[],
    year: number
  ): AttendanceRecord[] {
    return allRecords.filter(r => {
      const date = new Date(r.date);
      return r.classId === classId && date.getFullYear() === year;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getAvailableYears(records: AttendanceRecord[]): number[] {
    const years = new Set<number>();
    records.forEach(r => {
      years.add(new Date(r.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }

  getAvailableMonths(records: AttendanceRecord[], year: number): number[] {
    const months = new Set<number>();
    records.forEach(r => {
      const date = new Date(r.date);
      if (date.getFullYear() === year) {
        months.add(date.getMonth());
      }
    });
    return Array.from(months).sort((a, b) => b - a);
  }

  exportAttendanceReport(summary: StudentAttendanceSummary): string {
    let report = `Attendance Report for ${summary.studentName}\n`;
    report += `Class: ${summary.class}-${summary.section}\n`;
    report += `Student ID: ${summary.studentId}\n\n`;
    report += `Yearly Statistics:\n`;
    report += `Total Days: ${summary.yearlyStats.totalDays}\n`;
    report += `Present Days: ${summary.yearlyStats.presentDays}\n`;
    report += `Absent Days: ${summary.yearlyStats.absentDays}\n`;
    report += `Late Days: ${summary.yearlyStats.lateDays}\n`;
    report += `Attendance Percentage: ${summary.yearlyStats.percentage}%\n\n`;
    report += `Monthly Breakdown:\n`;

    summary.monthlyBreakdown.forEach(month => {
      report += `\n${month.month} ${month.year}:\n`;
      report += `  Present: ${month.stats.presentDays} days\n`;
      report += `  Absent: ${month.stats.absentDays} days\n`;
      report += `  Percentage: ${month.stats.percentage}%\n`;
    });

    return report;
  }
}

export default AttendanceAnalyticsService;
