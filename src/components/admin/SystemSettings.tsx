import React, { useState, useEffect } from 'react';
import { Save, Plus, X, Calendar, Bell, Settings as SettingsIcon, School, Clock, BookOpen, Trash2, CreditCard as Edit } from 'lucide-react';
import SettingsService from '../../services/settingsService';
import { SystemSettings as SystemSettingsType, Holiday, SystemNotification, NotificationSettings, ExamTimetableEntry } from '../../types/settings';
import { useAuth } from '../../context/AuthContext';

export default function SystemSettings() {
  const { user } = useAuth();
  const [settingsService] = useState(() => SettingsService.getInstance());
  const [settings, setSettings] = useState<SystemSettingsType>(settingsService.getSettings());
  const [activeTab, setActiveTab] = useState<'school' | 'academic' | 'holidays' | 'notifications' | 'attendance' | 'exams'>('school');
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [showCreateNotification, setShowCreateNotification] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<string | null>(null);
  const [showAddExam, setShowAddExam] = useState(false);
  const [editingExam, setEditingExam] = useState<string | null>(null);

  useEffect(() => {
    setSettings(settingsService.getSettings());
  }, [settingsService]);

  const handleSchoolInfoUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const updates = {
      schoolName: formData.get('schoolName') as string,
      schoolAddress: formData.get('schoolAddress') as string,
      schoolPhone: formData.get('schoolPhone') as string,
      schoolEmail: formData.get('schoolEmail') as string,
      principalName: formData.get('principalName') as string,
    };
    settingsService.updateSchoolInfo(updates);
    setSettings(settingsService.getSettings());
    alert('School information updated successfully!');
  };

  const handleAcademicYearUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const academicYear = {
      id: settings.academicYear.id,
      year: formData.get('year') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      isActive: true
    };
    settingsService.updateAcademicYear(academicYear);
    setSettings(settingsService.getSettings());
    alert('Academic year updated successfully!');
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const holiday = {
      name: formData.get('name') as string,
      date: formData.get('date') as string,
      type: formData.get('type') as 'national' | 'festival' | 'school' | 'other',
      description: formData.get('description') as string,
      isActive: true
    };
    settingsService.addHoliday(holiday);
    setSettings(settingsService.getSettings());
    setShowAddHoliday(false);
  };

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const recipients = Array.from(formData.getAll('recipients')) as ('students' | 'teachers' | 'parents' | 'all')[];
    
    const notification = {
      title: formData.get('title') as string,
      message: formData.get('message') as string,
      type: formData.get('type') as 'info' | 'warning' | 'success' | 'error',
      recipients,
      createdBy: user?.id || 'admin',
      isActive: true,
      expiresAt: formData.get('expiresAt') as string || undefined
    };
    
    settingsService.createSystemNotification(notification);
    setSettings(settingsService.getSettings());
    setShowCreateNotification(false);
    alert('Notification sent successfully!');
  };

  const tabs = [
    { id: 'school', label: 'School Info', icon: School },
    { id: 'academic', label: 'Academic Year', icon: Calendar },
    { id: 'holidays', label: 'Holidays', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'exams', label: 'Exams', icon: BookOpen }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            <p className="text-gray-600">Configure school-wide settings and notifications</p>
          </div>
          <div className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Admin Only</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 border-b">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

      {/* School Info Tab */}
      {activeTab === 'school' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">School Information</h3>
          <form onSubmit={handleSchoolInfoUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                <input
                  name="schoolName"
                  type="text"
                  defaultValue={settings.schoolName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Principal Name</label>
                <input
                  name="principalName"
                  type="text"
                  defaultValue={settings.principalName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">School Address</label>
                <textarea
                  name="schoolAddress"
                  rows={3}
                  defaultValue={settings.schoolAddress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Phone</label>
                <input
                  name="schoolPhone"
                  type="tel"
                  defaultValue={settings.schoolPhone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Email</label>
                <input
                  name="schoolEmail"
                  type="email"
                  defaultValue={settings.schoolEmail}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save School Information
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Academic Year Tab */}
      {activeTab === 'academic' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Academic Year Settings</h3>
          <form onSubmit={handleAcademicYearUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                <input
                  name="year"
                  type="text"
                  defaultValue={settings.academicYear.year}
                  placeholder="2024-25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  name="startDate"
                  type="date"
                  defaultValue={settings.academicYear.startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  name="endDate"
                  type="date"
                  defaultValue={settings.academicYear.endDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Update Academic Year
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Holiday Management</h3>
            <button
              onClick={() => setShowAddHoliday(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </button>
          </div>

          <div className="space-y-3">
            {settings.holidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{holiday.name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(holiday.date).toLocaleDateString()} • {holiday.type}
                  </p>
                  {holiday.description && (
                    <p className="text-xs text-gray-500">{holiday.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingHoliday(holiday.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      settingsService.removeHoliday(holiday.id);
                      setSettings(settingsService.getSettings());
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">System Notifications</h3>
              <button
                onClick={() => setShowCreateNotification(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Notification
              </button>
            </div>

            <div className="space-y-3">
              {settings.systemNotifications.slice(0, 10).map((notification) => (
                <div key={notification.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                      notification.type === 'success' ? 'bg-green-100 text-green-800' :
                      notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {notification.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>To: {notification.recipients.join(', ')}</span>
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Settings Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Attendance Settings</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const attendanceSettings = {
              markingDeadline: formData.get('markingDeadline') as string,
              lateThreshold: parseInt(formData.get('lateThreshold') as string),
              autoMarkAbsent: formData.get('autoMarkAbsent') === 'on'
            };
            settingsService.updateAttendanceSettings(attendanceSettings);
            setSettings(settingsService.getSettings());
            alert('Attendance settings updated successfully!');
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendance Marking Deadline
                </label>
                <input
                  name="markingDeadline"
                  type="time"
                  defaultValue={settings.attendanceSettings.markingDeadline}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Late Threshold (minutes)
                </label>
                <input
                  name="lateThreshold"
                  type="number"
                  defaultValue={settings.attendanceSettings.lateThreshold}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="0"
                  max="60"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    name="autoMarkAbsent"
                    type="checkbox"
                    defaultChecked={settings.attendanceSettings.autoMarkAbsent}
                    className="mr-2"
                  />
                  <span className="text-sm">Auto-mark students as absent after deadline</span>
                </label>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Attendance Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exam Timetable Tab */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Exam Timetable</h3>
            <button
              onClick={() => setShowAddExam(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Exam
            </button>
          </div>

          {settings.examTimetable.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No exam entries yet</p>
              <button
                onClick={() => setShowAddExam(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add First Exam
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Section</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.examTimetable.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{exam.class}</td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{exam.section}</td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{exam.subject}</td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                        {new Date(exam.date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{exam.time}</td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{exam.duration}</td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{exam.room || '-'}</td>
                      <td className="border border-gray-300 px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingExam(exam.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              settingsService.removeExamEntry(exam.id);
                              setSettings(settingsService.getSettings());
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Holiday Modal */}
      {showAddHoliday && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Holiday</h3>
            <form onSubmit={handleAddHoliday}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name</label>
                  <input
                    name="name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    name="date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="national">National Holiday</option>
                    <option value="festival">Festival</option>
                    <option value="school">School Holiday</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    name="description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddHoliday(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Send System Notification</h3>
            <form onSubmit={handleCreateNotification}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    name="title"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    name="message"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="info">Information</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                  <div className="space-y-2">
                    {['students', 'teachers', 'parents', 'all'].map((recipient) => (
                      <label key={recipient} className="flex items-center">
                        <input
                          name="recipients"
                          type="checkbox"
                          value={recipient}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{recipient}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
                  <input
                    name="expiresAt"
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateNotification(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Exam Modal */}
      {(showAddExam || editingExam) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">{editingExam ? 'Edit Exam' : 'Add Exam'}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const examEntry = {
                class: formData.get('class') as string,
                section: formData.get('section') as string,
                subject: formData.get('subject') as string,
                date: formData.get('date') as string,
                time: formData.get('time') as string,
                duration: formData.get('duration') as string,
                room: formData.get('room') as string || undefined,
              };

              if (editingExam) {
                settingsService.updateExamEntry(editingExam, examEntry);
                setEditingExam(null);
              } else {
                settingsService.addExamEntry(examEntry);
                setShowAddExam(false);
              }
              setSettings(settingsService.getSettings());
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      name="class"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      defaultValue={editingExam ? settings.examTimetable.find(e => e.id === editingExam)?.class : ''}
                      required
                    >
                      <option value="">Select Class</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <select
                      name="section"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      defaultValue={editingExam ? settings.examTimetable.find(e => e.id === editingExam)?.section : ''}
                      required
                    >
                      <option value="">Select Section</option>
                      {['A','B','C'].map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    name="subject"
                    type="text"
                    defaultValue={editingExam ? settings.examTimetable.find(e => e.id === editingExam)?.subject : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Mathematics"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      name="date"
                      type="date"
                      defaultValue={editingExam ? settings.examTimetable.find(e => e.id === editingExam)?.date : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      name="time"
                      type="time"
                      defaultValue={editingExam ? settings.examTimetable.find(e => e.id === editingExam)?.time : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      name="duration"
                      type="text"
                      defaultValue={editingExam ? settings.examTimetable.find(e => e.id === editingExam)?.duration : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="3 hours"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                    <input
                      name="room"
                      type="text"
                      defaultValue={editingExam ? settings.examTimetable.find(e => e.id === editingExam)?.room : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Room 101"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExam(false);
                    setEditingExam(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingExam ? 'Update' : 'Add'} Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
