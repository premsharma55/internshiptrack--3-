import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { student, setStudent, logout } = useAuth();
  const navigate = useNavigate();

  const [deadlineAlertDays, setDeadlineAlertDays] = useState(String(student?.deadlineAlertDays ?? 3));
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefFeedback, setPrefFeedback] = useState(null);
  const [prefError, setPrefError] = useState(null);

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [savingPw, setSavingPw] = useState(false);
  const [pwFeedback, setPwFeedback] = useState(null);
  const [pwError, setPwError] = useState(null);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    if (savingPrefs) return;

    const days = Number(deadlineAlertDays);
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      setPrefError('Deadline reminder window must be between 1 and 30 days.');
      return;
    }

    setSavingPrefs(true);
    setPrefError(null);
    setPrefFeedback(null);
    try {
      const res = await api.put('/students/profile', {
        deadlineAlertDays: days,
      });
      setStudent(res.data.student);
      setPrefFeedback('Reminder preferences saved.');
    } catch (err) {
      setPrefError(getApiError(err, 'Unable to save reminder preferences.'));
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (savingPw) return;

    if (!pwForm.currentPassword) {
      setPwError('Please enter your current password.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setSavingPw(true);
    setPwError(null);
    setPwFeedback(null);
    try {
      await api.put('/auth/password', pwForm);
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setPwFeedback('Your password has been updated.');
    } catch (err) {
      setPwError(getApiError(err, 'Unable to update password.'));
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="font-display text-xl font-bold text-gray-900 pb-3 border-b border-gray-200">Settings</h2>

      <section className="bg-white border border-gray-300 rounded p-5">
        <h3 className="font-display text-base font-bold text-gray-900 pb-3 border-b border-gray-200">
          Deadline Reminders
        </h3>

        {prefError && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{prefError}</span>
          </div>
        )}
        {prefFeedback && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{prefFeedback}</span>
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label htmlFor="alert-days" className="block text-sm font-semibold text-gray-700 mb-1">
              Days before deadline
            </label>
            <input
              id="alert-days"
              type="number"
              min={1}
              max={30}
              value={deadlineAlertDays}
              onChange={(e) => setDeadlineAlertDays(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums"
            />
          </div>
          <button
            type="submit"
            disabled={savingPrefs}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-60"
          >
            {savingPrefs && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Save</span>
          </button>
        </form>
      </section>

      <section className="bg-white border border-gray-300 rounded p-5">
        <h3 className="font-display text-base font-bold text-gray-900 pb-3 border-b border-gray-200">
          Change Password
        </h3>

        {pwError && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pwError}</span>
          </div>
        )}
        {pwFeedback && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{pwFeedback}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="mt-4 space-y-4 max-w-md">
          <div>
            <label htmlFor="cur-pw" className="block text-sm font-semibold text-gray-700 mb-1">
              Current Password
            </label>
            <input
              id="cur-pw"
              type="password"
              required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label htmlFor="new-pw" className="block text-sm font-semibold text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="new-pw"
              type="password"
              required
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label htmlFor="conf-pw" className="block text-sm font-semibold text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="conf-pw"
              type="password"
              required
              value={pwForm.confirmNewPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
            />
          </div>
          <button
            type="submit"
            disabled={savingPw}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-neutral-900 rounded hover:bg-neutral-800 disabled:opacity-60"
          >
            {savingPw && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Update Password</span>
          </button>
        </form>
      </section>

      <section className="bg-white border border-gray-300 rounded p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold text-gray-900">Active Session</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Signed in as <span className="font-medium text-gray-700">{student?.email}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-semibold text-red-700 bg-white border border-red-300 rounded hover:bg-red-50"
        >
          Sign Out
        </button>
      </section>
    </div>
  );
}
