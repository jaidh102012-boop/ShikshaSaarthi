import React, { useState, useEffect } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import MedicalLeaveService from '../../services/medicalLeaveService';
import { useAuth } from '../../context/AuthContext';
import { MedicalLeave } from '../../types';

interface MedicalLeaveFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const MedicalLeaveForm: React.FC<MedicalLeaveFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [duration, setDuration] = useState(0);
  const medicalLeaveService = MedicalLeaveService.getInstance();

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const duration = medicalLeaveService.calculateDuration(formData.start_date, formData.end_date);
      setDuration(duration);
    }
  }, [formData.start_date, formData.end_date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setCertificateFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setCertificatePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    setError('');

    if (!formData.start_date || !formData.end_date) {
      setError('Please select both start and end dates');
      return false;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for the medical leave');
      return false;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('Start date cannot be after end date');
      return false;
    }

    if (formData.reason.length < 10) {
      setError('Reason must be at least 10 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setLoading(true);

    try {
      const leave: Omit<MedicalLeave, 'id' | 'created_at' | 'updated_at' | 'submitted_at'> = {
        student_id: user.id,
        class: user.class || '',
        section: user.section || '',
        start_date: formData.start_date,
        end_date: formData.end_date,
        duration_days: duration,
        reason: formData.reason,
        status: 'pending',
        certificate_url: certificatePreview || undefined
      };

      const result = await medicalLeaveService.submitMedicalLeave(leave);

      if (result) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setError('Failed to submit medical leave. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('An error occurred while submitting your medical leave.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Apply for Medical Leave</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {success && (
          <div className="p-6 bg-green-50 border-l-4 border-green-500 flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Medical leave submitted successfully!</h3>
              <p className="text-green-800 text-sm mt-1">Your application has been submitted for review. You'll receive an update soon.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 border-l-4 border-red-500 flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-800 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {duration > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Duration:</span> {duration} day{duration !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave <span className="text-red-600">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Please provide a detailed reason for your medical leave..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 10 characters required</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Certificate (Optional)
            </label>
            <div className="space-y-3">
              {!certificateFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                    id="certificate-input"
                    disabled={loading}
                  />
                  <label htmlFor="certificate-input" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PDF or image (max 5MB)</p>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {certificateFile.type.startsWith('image/') ? (
                        <img src={certificatePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                      ) : (
                        <div className="h-12 w-12 bg-red-100 rounded flex items-center justify-center">
                          <span className="text-red-600 text-sm font-bold">PDF</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{certificateFile.name}</p>
                        <p className="text-xs text-gray-500">{(certificateFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCertificateFile(null);
                        setCertificatePreview('');
                      }}
                      className="text-gray-500 hover:text-gray-700"
                      disabled={loading}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Note:</span> Your medical leave application will be reviewed by the administration. You'll receive an email notification once it's approved or rejected.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !formData.start_date || !formData.end_date || !formData.reason}
            >
              {loading ? 'Submitting...' : 'Submit Medical Leave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalLeaveForm;
