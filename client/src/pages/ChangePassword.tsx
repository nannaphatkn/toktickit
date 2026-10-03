import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { changePassword } = useAuth();
  const navigate = useNavigate();

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigitOrSpecial = /[\d@$!%*?&^#()_\-+={}\[\]:;<>,.~/\\]/.test(newPassword);
  const matchesConfirm = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid = hasMinLength && hasUpper && hasLower && hasDigitOrSpecial && matchesConfirm && currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError('Please ensure all password security requirements are met.');
      return;
    }

    setIsSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to update password.');
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#006B3C] flex items-center justify-center text-white text-2xl font-bold shadow-md">
            🔐
          </div>
          <span className="text-3xl font-extrabold text-[#006B3C] tracking-tight">TokTickIT</span>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-800">
          Change Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          You must change your temporary initial password before entering the application.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-start gap-3 text-sm" role="alert">
              <span className="text-lg">⚠️</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-semibold text-slate-700">
                Current (temporary) password
              </label>
              <div className="mt-1">
                <input
                  id="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-[#006B3C] focus:outline-none focus:ring-2 focus:ring-[#006B3C]/20 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700">
                New password
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-[#006B3C] focus:outline-none focus:ring-2 focus:ring-[#006B3C]/20 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                Confirm new password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-[#006B3C] focus:outline-none focus:ring-2 focus:ring-[#006B3C]/20 sm:text-sm"
                />
              </div>
            </div>

            {/* Password requirement rules checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="font-semibold text-slate-700 mb-1">Password must:</div>
              <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span>{hasMinLength ? '✓' : '○'}</span> Be at least 8 characters long
              </div>
              <div className={`flex items-center gap-2 ${hasUpper && hasLower ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span>{hasUpper && hasLower ? '✓' : '○'}</span> Include upper and lower case letters
              </div>
              <div className={`flex items-center gap-2 ${hasDigitOrSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span>{hasDigitOrSpecial ? '✓' : '○'}</span> Include a number and a special character
              </div>
              <div className={`flex items-center gap-2 ${matchesConfirm ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span>{matchesConfirm ? '✓' : '○'}</span> Passwords match
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="flex w-full justify-center rounded-lg bg-[#006B3C] py-3 px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#00542f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006B3C] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Updating Password...' : 'Save & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
