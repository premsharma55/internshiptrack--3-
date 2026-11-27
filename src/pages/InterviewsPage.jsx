import { AlertCircle, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getApiError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { INTERVIEW_MODES, INTERVIEW_STATUSES } from '../constants';

function getTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function InterviewsPage() {
  const [tab, setTab] = useState('upcoming');
  const [interviews, setInterviews] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [form, setForm] = useState({
    internshipId: '',
    interviewDate: getTodayDate(),
    interviewTime: '10:00',
    interviewMode: 'Online',
    meetingLink: '',
    location: '',
    interviewRound: 'Technical Round 1',
    status: 'Scheduled',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [ivRes, appRes] = await Promise.all([
        api.get('/interviews'),
        api.get('/internships', { params: { limit: 100 } }),
      ]);
      setInterviews(ivRes.data.interviews || []);
      setInternships(appRes.data.internships || []);
    } catch (err) {
      setError(getApiError(err, 'Failed to load interviews and deadlines.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingInterview(null);
    setForm({
      internshipId: internships[0] ? String(internships[0].id) : '',
      interviewDate: getTodayDate(),
      interviewTime: '10:00',
      interviewMode: 'Online',
      meetingLink: '',
      location: '',
      interviewRound: 'Technical Round 1',
      status: 'Scheduled',
      notes: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (iv) => {
    setEditingInterview(iv);
    setForm({
      internshipId: String(iv.internshipId),
      interviewDate: iv.interviewDate,
      interviewTime: iv.interviewTime,
      interviewMode: iv.interviewMode,
      meetingLink: iv.meetingLink,
      location: iv.location,
      interviewRound: iv.interviewRound,
      status: iv.status,
      notes: iv.notes,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveInterview = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.internshipId) {
      setFormError('Please select an internship application.');
      return;
    }
    if (!form.interviewRound.trim()) {
      setFormError('Interview round is required.');
      return;
    }
    if (form.interviewMode === 'Online' && !form.meetingLink.trim()) {
      setFormError('Meeting link is required for an online interview.');
      return;
    }
    if (form.interviewMode === 'Offline' && !form.location.trim()) {
      setFormError('Location is required for an offline interview.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        internshipId: Number(form.internshipId),
      };
      if (editingInterview) {
        await api.put(`/interviews/${editingInterview.id}`, payload);
      } else {
        await api.post('/interviews', payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(getApiError(err, 'Failed to save interview schedule.'));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async (iv) => {
    try {
      await api.put(`/interviews/${iv.id}`, {
        internshipId: iv.internshipId,
        interviewDate: iv.interviewDate,
        interviewTime: iv.interviewTime,
        interviewMode: iv.interviewMode,
        meetingLink: iv.meetingLink,
        location: iv.location,
        interviewRound: iv.interviewRound,
        status: 'Completed',
        notes: iv.notes,
      });
      await loadData();
    } catch (err) {
      setError(getApiError(err, 'Failed to update interview status.'));
    }
  };

  const handleDeleteInterview = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/interviews/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(getApiError(err, 'Failed to delete interview.'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const today = getTodayDate();
  const upcomingInterviews = interviews.filter(
    (iv) => iv.status === 'Scheduled' && iv.interviewDate >= today
  );
  const completedInterviews = interviews.filter(
    (iv) => iv.status !== 'Scheduled' || iv.interviewDate < today
  );

  const internshipsWithDeadlines = internships
    .filter((app) => Boolean(app.deadline))
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-200">
        <h2 className="font-display text-xl font-bold text-gray-900">Interviews &amp; Deadlines</h2>
        <button
          type="button"
          onClick={openCreateModal}
          disabled={internships.length === 0}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          Schedule Interview
        </button>
      </div>

      {internships.length === 0 && !loading && (
        <div className="p-4 rounded bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between gap-4">
          <span>Add at least one internship application before scheduling an interview.</span>
          <Link
            to="/applications/new"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 rounded hover:bg-amber-800 whitespace-nowrap"
          >
            Add Internship
          </Link>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Simple Traditional Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            tab === 'upcoming'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming ({upcomingInterviews.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('completed')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            tab === 'completed'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed ({completedInterviews.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('deadlines')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            tab === 'deadlines'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Deadlines ({internshipsWithDeadlines.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-gray-300 rounded animate-pulse" />
          ))}
        </div>
      ) : tab === 'deadlines' ? (
        <section className="bg-white border border-gray-300 rounded overflow-hidden">
          {internshipsWithDeadlines.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-600">No deadlines tracked</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {internshipsWithDeadlines.map((app) => {
                const isClosed = ['Selected', 'Rejected', 'Withdrawn'].includes(app.status);
                const diffDays = Math.ceil(
                  (new Date(`${app.deadline}T00:00:00`).getTime() -
                    new Date(`${today}T00:00:00`).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const isExpired = !isClosed && diffDays < 0;
                const isUrgent = !isClosed && diffDays >= 0 && diffDays <= 5;

                return (
                  <div
                    key={app.id}
                    className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/applications/${app.id}`}
                        className="font-semibold text-gray-900 hover:text-blue-700 hover:underline truncate block"
                      >
                        {app.companyName} — {app.position}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span>{app.companyLocation}</span>
                        <span>·</span>
                        <StatusBadge status={app.status} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-left sm:text-right">
                        <p
                          className={`text-sm font-mono tabular-nums font-semibold ${
                            isExpired
                              ? 'text-red-600'
                              : isUrgent
                                ? 'text-amber-700'
                                : 'text-gray-900'
                          }`}
                        >
                          {app.deadline}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isClosed
                            ? 'Application closed'
                            : isExpired
                              ? `Expired ${Math.abs(diffDays)} day(s) ago`
                              : diffDays === 0
                                ? 'Due today'
                                : `Due in ${diffDays} day(s)`}
                        </p>
                      </div>
                      <Link
                        to={`/applications/${app.id}`}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="bg-white border border-gray-300 rounded overflow-hidden">
          {(tab === 'upcoming' ? upcomingInterviews : completedInterviews).length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-600">
              {tab === 'upcoming' ? 'No upcoming interviews' : 'No completed interviews'}
            </p>
          ) : (
            <div className="divide-y divide-gray-200">
              {(tab === 'upcoming' ? upcomingInterviews : completedInterviews).map((iv) => (
                <div
                  key={iv.id}
                  className="p-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/applications/${iv.internshipId}`}
                        className="font-display font-bold text-base text-gray-900 hover:text-blue-700 hover:underline"
                      >
                        {iv.companyName}
                      </Link>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm font-medium text-gray-700">{iv.position}</span>
                    </div>
                    <p className="text-sm font-medium text-blue-700 mt-0.5">{iv.interviewRound}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span className="font-mono tabular-nums font-medium">
                        {iv.interviewDate} at {iv.interviewTime}
                      </span>
                      <span>Mode: {iv.interviewMode}</span>
                      <span>Status: {iv.status}</span>
                      {iv.interviewMode === 'Offline' && iv.location && <span>Location: {iv.location}</span>}
                    </div>
                    {iv.notes && <p className="mt-1.5 text-xs text-gray-600">{iv.notes}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium shrink-0">
                    {iv.interviewMode === 'Online' && iv.meetingLink && (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        Join Link
                      </a>
                    )}
                    {iv.status === 'Scheduled' && (
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(iv)}
                        className="text-emerald-700 hover:underline"
                      >
                        Mark Completed
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(iv)}
                      className="text-gray-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(iv)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Create / Edit Interview Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white border border-gray-300 rounded-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-gray-900">
                {editingInterview ? 'Edit Interview Schedule' : 'Schedule Interview'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveInterview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Internship Application *
                </label>
                <select
                  required
                  value={form.internshipId}
                  onChange={(e) => setForm((p) => ({ ...p, internshipId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white"
                >
                  {internships.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.companyName} — {app.position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Date *</label>
                  <input
                    type="date"
                    required
                    value={form.interviewDate}
                    onChange={(e) => setForm((p) => ({ ...p, interviewDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Time *</label>
                  <input
                    type="time"
                    required
                    value={form.interviewTime}
                    onChange={(e) => setForm((p) => ({ ...p, interviewTime: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Round *</label>
                  <input
                    type="text"
                    required
                    value={form.interviewRound}
                    onChange={(e) => setForm((p) => ({ ...p, interviewRound: e.target.value }))}
                    placeholder="e.g., Technical Round 1, HR Round"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Mode *</label>
                  <select
                    value={form.interviewMode}
                    onChange={(e) => setForm((p) => ({ ...p, interviewMode: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white"
                  >
                    {INTERVIEW_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.interviewMode === 'Online' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Link *</label>
                  <input
                    type="url"
                    required
                    value={form.meetingLink}
                    onChange={(e) => setForm((p) => ({ ...p, meetingLink: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Interview Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Building, room, or office address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
              )}

              {editingInterview && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white"
                  >
                    {INTERVIEW_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Interviewer name, focus topics, documents to carry..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingInterview ? 'Update Interview' : 'Schedule Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Interview Schedule"
        description={
          deleteTarget
            ? `Remove the ${deleteTarget.interviewRound} interview with ${deleteTarget.companyName} on ${deleteTarget.interviewDate}?`
            : ''
        }
        loading={deleting}
        onConfirm={handleDeleteInterview}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
