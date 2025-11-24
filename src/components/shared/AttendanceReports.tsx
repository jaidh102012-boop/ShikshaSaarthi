import React, { useState, useMemo } from 'react';
import { ChevronLeft, Download, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AttendanceAnalyticsService, { StudentAttendanceSummary } from '../../services/attendanceAnalyticsService';

interface AttendanceReportsProps {
  isTeacher?: boolean;
  teacherClassId?: string;
}

type ViewLevel = 'classes' | 'students' | 'studentDetails';

export default function AttendanceReports({ isTeacher = false, teacherClassId }: AttendanceReportsProps) {
  const { users, attendanceRecords, classes } = useAuth();
  const [viewLevel, setViewLevel] = useState<ViewLevel>('classes');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'month' | 'year'>('year');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const analyticsService = AttendanceAnalyticsService.getInstance();

  const classesWithAttendance = useMemo(() => {
    let relevantClasses = classes;
    if (isTeacher && teacherClassId) {
      relevantClasses = classes.filter(c => c.id === teacherClassId);
    }

    return relevantClasses.map(classItem => {
      const classStudents = users.filter(u =>
        u.role === 'student' &&
        u.class === classItem.name &&
        u.section === classItem.section
      );

      const classRecords = attendanceRecords.filter(r => r.classId === classItem.id);
      const stats = analyticsService.calculateStats(classRecords);

      return {
        id: classItem.id,
        name: classItem.name,
        section: classItem.section,
        studentCount: classStudents.length,
        percentage: stats.percentage,
        presentDays: stats.presentDays,
        absentDays: stats.absentDays,
        totalDays: stats.totalDays
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [classes, users, attendanceRecords, isTeacher, teacherClassId]);

  const studentsInSelectedClass = useMemo(() => {
    if (!selectedClass) return [];
    const classItem = classes.find(c => c.id === selectedClass);
    if (!classItem) return [];

    const classStudents = users.filter(u =>
      u.role === 'student' &&
      u.class === classItem.name &&
      u.section === classItem.section
    );

    const year = selectedDate.getFullYear();
    let month: number | null = null;
    let day: number | null = null;

    if (selectedPeriod === 'month') {
      month = selectedDate.getMonth();
    } else if (selectedPeriod === 'day') {
      month = selectedDate.getMonth();
      day = selectedDate.getDate();
    }

    return classStudents.map(student => {
      let records = attendanceRecords.filter(r => r.studentId === student.id && r.classId === selectedClass);

      if (day !== null) {
        records = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getDate() === day &&
                 recordDate.getMonth() === month &&
                 recordDate.getFullYear() === year;
        });
      } else if (month !== null) {
        records = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getMonth() === month &&
                 recordDate.getFullYear() === year;
        });
      } else {
        records = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getFullYear() === year;
        });
      }

      const stats = analyticsService.calculateStats(records);
      return {
        id: student.id,
        name: student.name,
        admissionNo: student.admissionNo,
        percentage: stats.percentage,
        presentDays: stats.presentDays,
        absentDays: stats.absentDays,
        totalDays: stats.totalDays
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [selectedClass, classes, users, attendanceRecords, selectedDate, selectedPeriod]);

  const selectedStudentDetails = useMemo(() => {
    if (!selectedStudent || !selectedClass) return null;
    const student = users.find(u => u.id === selectedStudent);
    if (!student) return null;

    const year = selectedDate.getFullYear();
    let records = attendanceRecords.filter(
      r => r.studentId === selectedStudent && r.classId === selectedClass
    );

    if (selectedPeriod === 'year') {
      records = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getFullYear() === year;
      });

      const monthlyBreakdown: { [key: string]: typeof records } = {};
      records.forEach(record => {
        const recordDate = new Date(record.date);
        const monthKey = recordDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!monthlyBreakdown[monthKey]) {
          monthlyBreakdown[monthKey] = [];
        }
        monthlyBreakdown[monthKey].push(record);
      });

      return {
        student,
        period: 'year',
        records: records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        monthlyBreakdown,
        stats: analyticsService.calculateStats(records)
      };
    } else if (selectedPeriod === 'month') {
      const month = selectedDate.getMonth();
      records = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === month &&
               recordDate.getFullYear() === year;
      });

      return {
        student,
        period: 'month',
        periodLabel: selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        records: records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        stats: analyticsService.calculateStats(records)
      };
    } else {
      records = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getDate() === selectedDate.getDate() &&
               recordDate.getMonth() === selectedDate.getMonth() &&
               recordDate.getFullYear() === year;
      });

      return {
        student,
        period: 'day',
        periodLabel: selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        records: records,
        stats: analyticsService.calculateStats(records)
      };
    }
  }, [selectedStudent, selectedClass, users, attendanceRecords, selectedDate, selectedPeriod]);

  const handleBackNavigation = () => {
    if (viewLevel === 'studentDetails') {
      setViewLevel('students');
      setSelectedStudent(null);
    } else if (viewLevel === 'students') {
      setViewLevel('classes');
      setSelectedClass(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-l-4 border-green-600';
      case 'absent': return 'bg-red-100 text-red-800 border-l-4 border-red-600';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-600';
      default: return 'bg-gray-100 text-gray-800 border-l-4 border-gray-600';
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600 bg-green-50';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {viewLevel === 'classes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Reports</h3>
            <p className="text-sm text-gray-600">Select a class to view attendance details</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classesWithAttendance.map(classItem => (
              <button
                key={classItem.id}
                onClick={() => {
                  setSelectedClass(classItem.id);
                  setViewLevel('students');
                }}
                className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300 text-left"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{classItem.name}-{classItem.section}</h4>
                    <p className="text-sm text-gray-600 mt-1">{classItem.studentCount} students</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>

                <div className={`inline-block px-4 py-2 rounded-lg font-bold ${getAttendanceColor(classItem.percentage)}`}>
                  {classItem.percentage}%
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-600">Present</p>
                    <p className="font-semibold text-green-600">{classItem.presentDays}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Absent</p>
                    <p className="font-semibold text-red-600">{classItem.absentDays}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {viewLevel === 'students' && selectedClass && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <button
                onClick={handleBackNavigation}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Student Attendance</h3>
                <p className="text-sm text-gray-600">{classesWithAttendance.find(c => c.id === selectedClass)?.name}-{classesWithAttendance.find(c => c.id === selectedClass)?.section}</p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setSelectedPeriod('year')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedPeriod === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedPeriod === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setSelectedPeriod('day')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedPeriod === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Day
              </button>

              <div className="ml-auto">
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentsInSelectedClass.map(student => (
              <button
                key={student.id}
                onClick={() => {
                  setSelectedStudent(student.id);
                  setViewLevel('studentDetails');
                }}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300 text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">{student.name}</p>
                      {student.admissionNo && <p className="text-xs text-gray-600">Adm: {student.admissionNo}</p>}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>

                <div className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${getAttendanceColor(student.percentage)}`}>
                  {student.percentage}%
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Present</p>
                    <p className="font-semibold text-green-600">{student.presentDays}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Absent</p>
                    <p className="font-semibold text-red-600">{student.absentDays}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {viewLevel === 'studentDetails' && selectedStudentDetails && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <button
                onClick={handleBackNavigation}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedStudentDetails.student.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedStudentDetails.periodLabel || `${selectedDate.getFullYear()}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Total Days</p>
                <p className="text-3xl font-bold text-blue-600">{selectedStudentDetails.stats.totalDays}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Present</p>
                <p className="text-3xl font-bold text-green-600">{selectedStudentDetails.stats.presentDays}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Absent</p>
                <p className="text-3xl font-bold text-red-600">{selectedStudentDetails.stats.absentDays}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Attendance</p>
                <p className="text-3xl font-bold text-blue-600">{selectedStudentDetails.stats.percentage}%</p>
              </div>
            </div>
          </div>

          {selectedStudentDetails.period === 'year' && selectedStudentDetails.monthlyBreakdown && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Monthly Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(selectedStudentDetails.monthlyBreakdown).map(([monthKey, records]) => {
                  const monthStats = analyticsService.calculateStats(records);
                  return (
                    <div key={monthKey} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="font-medium text-gray-900 mb-3">{monthKey}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Present:</span>
                          <span className="font-semibold text-green-600">{monthStats.presentDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Absent:</span>
                          <span className="font-semibold text-red-600">{monthStats.absentDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Percentage:</span>
                          <span className="font-semibold text-blue-600">{monthStats.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedStudentDetails.records.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                {selectedStudentDetails.period === 'day' ? 'Attendance Status' : 'Daily Records'}
              </h4>
              <div className="space-y-2">
                {selectedStudentDetails.records.map(record => (
                  <div
                    key={record.id}
                    className={`p-4 rounded-lg ${getStatusColor(record.status)} flex items-center justify-between`}
                  >
                    <div>
                      <p className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <span className="font-bold text-sm">
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
              {selectedStudentDetails.records.length === 0 && (
                <p className="text-center text-gray-600 py-8">No attendance records found</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
