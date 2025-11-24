import React, { useState, useEffect } from 'react';
import { Save, X, Lock, Phone, Mail, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PasswordChangeModal from '../shared/PasswordChangeModal';
import ProfilePictureUpload from '../shared/ProfilePictureUpload';

export default function TeacherAccountManagement() {
  const { user, updateProfile, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    subject: user?.subject || '',
    assignedClass: user?.assignedClass || '',
    assignedSection: user?.assignedSection || ''
  });

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      subject: user?.subject || '',
      assignedClass: user?.assignedClass || '',
      assignedSection: user?.assignedSection || ''
    });
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      subject: user?.subject || '',
      assignedClass: user?.assignedClass || '',
      assignedSection: user?.assignedSection || ''
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    if (user) {
      return await changePassword(user.id, currentPassword, newPassword);
    }
    return false;
  };

  const handlePhotoUpload = (photoUrl: string) => {
    updateProfile({ photo: photoUrl });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Account Management</h2>
            <p className="text-gray-600">Manage your profile and account settings</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </button>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Account
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              <div className="flex flex-col items-center">
                <ProfilePictureUpload
                  currentPhoto={user?.photo}
                  onUpload={handlePhotoUpload}
                  isEditing={true}
                />
                <p className="text-sm text-gray-600 mt-4 text-center">
                  {user?.subject && <span className="block font-medium">{user.subject}</span>}
                  {user?.assignedClass && (
                    <span className="block text-xs">Class {user.assignedClass}-{user.assignedSection}</span>
                  )}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="mt-8 space-y-3">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600">User ID</p>
                  <p className="text-sm font-medium text-blue-900">{user?.id}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600">Role</p>
                  <p className="text-sm font-medium text-green-900">Teacher</p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{user?.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{user?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                      {user?.phone || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="h-4 w-4 inline mr-1" />
                    Subject
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                      {user?.subject || 'Not assigned'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Class
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.assignedClass}
                      onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                      placeholder="e.g., 10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                      {user?.assignedClass || 'Not assigned'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.assignedSection}
                      onChange={(e) => setFormData({ ...formData, assignedSection: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Section</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                      {user?.assignedSection || 'Not assigned'}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-gray-600">Role</p>
                    <p className="font-medium text-gray-900">Teacher</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Account Status</p>
                    <p className="font-medium text-green-600">Active</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
      />
    </div>
  );
}
