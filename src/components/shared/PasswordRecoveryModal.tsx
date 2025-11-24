import React, { useState, useEffect } from 'react';
import { X, Phone, Lock, CheckCircle } from 'lucide-react';
import OTPService from '../../services/otpService';
import { useAuth } from '../../context/AuthContext';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type RecoveryStep = 'phone' | 'otp' | 'password' | 'success';

export default function PasswordRecoveryModal({ isOpen, onClose, onSuccess }: PasswordRecoveryModalProps) {
  const { users, changePassword } = useAuth();
  const [step, setStep] = useState<RecoveryStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [user, setUser] = useState<any>(null);

  const otpService = OTPService.getInstance();

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  if (!isOpen) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Find user by phone
      const foundUser = users.find(u => u.phone === phone);
      if (!foundUser) {
        setError('No account found with this phone number');
        setLoading(false);
        return;
      }

      setUser(foundUser);

      // Send OTP
      const result = await otpService.sendOTP(phone, foundUser.email, foundUser.id);
      if (result.success) {
        setStep('otp');
        setTimer(60);
        setAttempts(0);
        setMessage(`OTP sent to ${phone}`);
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (otp.length !== 6) {
        setError('OTP must be 6 digits');
        setLoading(false);
        return;
      }

      const result = await otpService.verifyOTP(phone, otp);
      if (result.success) {
        setStep('password');
        setMessage('OTP verified successfully');
      } else {
        const newAttempts = otpService.getAttempts(phone);
        setAttempts(newAttempts);
        setError(result.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (!user) {
        setError('User not found');
        setLoading(false);
        return;
      }

      // Change password without verifying old password (recovery flow)
      const success = await changePassword(user.id, '', newPassword, true);
      if (success) {
        setStep('success');
        otpService.clearOTPVerification(phone);
      } else {
        setError('Failed to reset password');
      }
    } catch (err) {
      setError('Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success' && onSuccess) {
      onSuccess();
    }
    setStep('phone');
    setPhone('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setMessage('');
    setTimer(0);
    setAttempts(0);
    setUser(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recover Account</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'phone' && (
          <form onSubmit={handleSendOTP}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter your phone number to receive an OTP and reset your password.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg text-sm">
                  {message}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the OTP sent to {phone}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  {timer > 0 ? `Expires in ${timer}s` : 'OTP expired'}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 text-green-800 px-4 py-3 rounded-lg text-sm">
                  {message}
                </div>
              )}

              {attempts > 0 && (
                <p className="text-sm text-yellow-600">
                  Attempts remaining: {3 - attempts}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setError('');
                  setMessage('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter your new password
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setStep('otp');
                  setError('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Password Reset Successfully</h4>
            <p className="text-gray-600 mb-6">
              Your password has been reset. You can now login with your new password.
            </p>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
