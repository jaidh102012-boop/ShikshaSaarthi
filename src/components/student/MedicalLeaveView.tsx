import React, { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import MedicalLeaveService from '../../services/medicalLeaveService';
import MedicalLeaveForm from './MedicalLeaveForm';
import { useAuth } from '../../context/AuthContext';
import { MedicalLeave } from '../../types';

const MedicalLeaveView: React.FC = () => {
  const { user } = useAuth();
  const [medicalLeaves, setMedicalLeaves] = useState<MedicalLeave[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const medicalLeaveService = MedicalLeaveService.getInstance();

  useEffect(() => {
    loadMedicalLeaves();
  }, []);

  const loadMedicalLeaves = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const leaves = await medicalLeaveService.getStudentMedicalLeaves(user.id);
      setMedicalLeaves(leaves);
    } catch (error) {
      console.error('Failed to load medical leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSuccess = () => {
    loadMedicalLeaves();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 w-fit';
    switch (status) {
      case 'approved':
        return <span className={`${baseClass} bg-green-100 text-green-800`}><CheckCircle className="h-4 w-4" /> Approved</span>;
      case 'rejected':
        return <span className={`${baseClass} bg-red-100 text-red-800`}><XCircle className="h-4 w-4" /> Rejected</span>;
      case 'pending':
        return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}><AlertCircle className="h-4 w-4" /> Pending</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Medical Leave Applications</h3>
          <p className="text-sm text-gray-600 mt-1">Apply for and track your medical leave requests</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          New Application
        </button>
      </div>

      {showForm && (
        <MedicalLeaveForm onClose={handleFormClose} onSuccess={handleFormSuccess} />
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="inline-block">
            <div className="h-8 w-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 mt-4">Loading your applications...</p>
        </div>
      ) : medicalLeaves.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
          <p className="text-gray-600 mb-6">You haven't submitted any medical leave applications yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Submit Your First Application
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {medicalLeaves.map((leave) => (
            <div key={leave.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">
                      {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">{leave.duration_days} day{leave.duration_days !== 1 ? 's' : ''} medical leave</p>
                </div>
                {getStatusBadge(leave.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Reason</p>
                  <p className="text-gray-900 font-medium">{leave.reason}</p>
                </div>
                <div>
                  <p className="text-gray-600">Submitted</p>
                  <p className="text-gray-900 font-medium">{new Date(leave.submitted_at).toLocaleDateString()}</p>
                </div>
              </div>

              {leave.remarks && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600 font-medium mb-1">Admin Remarks</p>
                  <p className="text-sm text-gray-800">{leave.remarks}</p>
                </div>
              )}

              {leave.certificate_url && (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Medical certificate attached</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalLeaveView;
