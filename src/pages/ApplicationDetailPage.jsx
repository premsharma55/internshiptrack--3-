import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getApiError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { APPLICATION_STATUSES, INTERVIEW_MODES } from '../constants';

function getTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [internship, setInternship] = useState(null);
  const [history, setHistory] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('Applied');
  const [statusDate, setStatusDate] = useState(getTodayDate());
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [ivForm, setIvForm] = useState({
    interviewDate: getTodayDate(),
    interviewTime: '10:00',
    interviewMode: 'Online',
    meetingLink: '',
    location: '',
    interviewRound: 'Technical Round 1',
    notes: '',
  });
  const [savingInterview, setSavingInterview] = useState(false);
  const [ivError, setIvError] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get(`/internships/${id}`);
      setInternship(res.data.internship);
      setSelectedStatus(res.data.internship.status);
      setHistory(res.data.history || []);
      setInterviews(res.data.interviews || []);
    } catch (err) {
      setError(getApiError(err, 'Failed to load internship details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!internship || updatingStatus) return;
    setUpdatingStatus(true);
    setStatusFeedback(null);
    setError(null);
    try {
      const res = await api.patch(`/internships/${internship.id}/status`, {
        status: selectedStatus,
        changedAt: statusDate,
        notes: statusNote.trim(),
      });
      setInternship(res.data.internship);
      setHistory(res.data.history || []);
      setStatusNote('');
      setStatusFeedback('Application status updated.');
    } catch (err) {
      setError(getApiError(err, 'Unable to update application status.'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!internship || savingInterview) return;
    setIvError(null);
    setSavingInterview(true);
    try {
      await api.post('/interviews', {
        internshipId: internship.id,
        ...ivForm,
      });
      setShowInterviewModal(false);
      setIvForm({
        interviewDate: getTodayDate(),
        interviewTime: '10:00',
        interviewMode: 'Online',
        meetingLink: '',
        location: '',
        interviewRound: 'Technical Round 1',
        notes: '',
      });
      await loadDetails();
    } catch (err) {
      setIvError(getApiError(err, 'Failed to schedule interview.'));
    } finally {
      setSavingInterview(false);
    }
  };

  const handleDelete = async () => {
    if (!internship || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/internships/${internship.id}`);
      navigate('/applications', { replace: true });
    } catch (err) {
      setError(getApiError(err, 'Failed to delete internship application.'));
      setShowDeleteConfirm(false);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-white border border-gray-300 rounded animate-pulse" />
        <div className="h-64 bg-white border border-gray-300 rounded animate-pulse" />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-gray-300 rounded p-8 text-center">
        <h2 className="font-display text-lg font-bold text-gray-900">Application Not Found</h2>
        <p className="text-sm text-gray-600 mt-1">{error || 'This application does not exist.'}</p>
        <Link
          to="/applications"
          className="mt-4 inline-block px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800"
        >
          Back to Applications
        </Link>
      </div>
    );
  }

  const today = getTodayDate();
  const isExpired =
    Boolean(internship.deadline) &&
    internship.deadline < today &&
    !['Selected', 'Rejected', 'Withdrawn'].includes(internship.status);

  const skillList = internship.requiredSkills
    ? internship.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Applications</span>
        </Link>

        {/* Header Summary */}
        <div className="bg-white border border-gray-300 rounded p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-gray-900 truncate">
                {internship.position}
              </h2>
              <StatusBadge status={internship.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{internship.companyName}</span>
              <span>·</span>
              <span>{internship.companyLocation}</span>
              <span>·</span>
              <span>{internship.internshipType}</span>
              {internship.companyWebsite && (
                <>
                  <span>·</span>
                  <a
                    href={internship.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline font-medium"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to={`/applications/${internship.id}/edit`}
              className="px-3.5 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-gray-300 rounded p-5">
            <h3 className="font-display text-base font-bold text-gray-900 pb-3 mb-4 border-b border-gray-200">
              Overview
            </h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <dt className="text-xs font-semibold text-gray-500">Application Date</dt>
                <dd className="mt-1 font-mono tabular-nums text-gray-900">{internship.applicationDate}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Application Deadline</dt>
                <dd className={`mt-1 font-mono tabular-nums ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                  {internship.deadline ? `${internship.deadline}${isExpired ? ' (Expired)' : ''}` : 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Application Source</dt>
                <dd className="mt-1 text-gray-900">{internship.applicationSource}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Employment Type</dt>
                <dd className="mt-1 text-gray-900">{internship.employmentType}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Duration</dt>
                <dd className="mt-1 text-gray-900">{internship.duration || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Monthly Stipend</dt>
                <dd className="mt-1 font-mono tabular-nums text-gray-900">
                  {internship.stipend > 0 ? `${internship.stipend.toLocaleString()} / month` : 'Unpaid / Not listed'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500">Industry / Sector</dt>
                <dd className="mt-1 text-gray-900">{internship.industry || 'Not specified'}</dd>
              </div>
            </dl>

            {skillList.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Required Skills</p>
                <p className="text-sm text-gray-800">{skillList.join(' · ')}</p>
              </div>
            )}

            {internship.jobDescription && (
              <div className="mt-5 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Job Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {internship.jobDescription}
                </p>
              </div>
            )}

            {internship.notes && (
              <div className="mt-5 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Additional Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {internship.notes}
                </p>
              </div>
            )}
          </section>

          <section className="bg-white border border-gray-300 rounded p-5">
            <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-gray-200">
              <h3 className="font-display text-base font-bold text-gray-900">Interviews</h3>
              <button
                type="button"
                onClick={() => setShowInterviewModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 whitespace-nowrap"
              >
                Schedule Interview
              </button>
            </div>

            {interviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-600">No interviews scheduled</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {interviews.map((iv) => (
                  <div
                    key={iv.id}
                    className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {iv.interviewRound} <span className="text-xs font-normal text-gray-500">· {iv.status}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600 font-mono tabular-nums">
                        {iv.interviewDate} at {iv.interviewTime} ({iv.interviewMode})
                        {iv.interviewMode === 'Offline' && iv.location ? ` · ${iv.location}` : ''}
                      </p>
                      {iv.notes && <p className="text-xs text-gray-600 mt-1">{iv.notes}</p>}
                    </div>

                    {iv.interviewMode === 'Online' && iv.meetingLink && (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-700 hover:underline shrink-0"
                      >
                        Join Meeting
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-gray-300 rounded p-5">
            <h3 className="font-display text-base font-bold text-gray-900 pb-3 mb-4 border-b border-gray-200">
              Update Status
            </h3>

            {statusFeedback && (
              <div className="mb-3 flex items-center gap-2 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusFeedback}</span>
              </div>
            )}

            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div>
                <label htmlFor="detail-status" className="block text-xs font-semibold text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  id="detail-status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-600"
                >
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="detail-status-date" className="block text-xs font-semibold text-gray-700 mb-1">
                  Event Date
                </label>
                <input
                  id="detail-status-date"
                  type="date"
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label htmlFor="detail-status-note" className="block text-xs font-semibold text-gray-700 mb-1">
                  Timeline Note (optional)
                </label>
                <textarea
                  id="detail-status-note"
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g., Completed online coding assessment"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={updatingStatus}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-60"
              >
                {updatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{updatingStatus ? 'Updating...' : 'Record Status Update'}</span>
              </button>
            </form>
          </section>

          <section className="bg-white border border-gray-300 rounded p-5">
            <h3 className="font-display text-base font-bold text-gray-900 pb-3 mb-3 border-b border-gray-200">
              Timeline
            </h3>

            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No history yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {history.map((item) => (
                  <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={item.newStatus} />
                      <time className="text-xs font-mono tabular-nums text-gray-500">
                        {item.changedAt.slice(0, 10)}
                      </time>
                    </div>
                    {item.notes && <p className="mt-1 text-xs text-gray-600">{item.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Quick Schedule Interview Modal */}
      {showInterviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white border border-gray-300 rounded-md p-6">
            <h3 className="font-display text-lg font-bold text-gray-900">
              Schedule Interview — {internship.companyName}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{internship.position}</p>

            {ivError && (
              <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {ivError}
              </div>
            )}

            <form onSubmit={handleScheduleInterview} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Date *</label>
                  <input
                    type="date"
                    required
                    value={ivForm.interviewDate}
                    onChange={(e) => setIvForm((p) => ({ ...p, interviewDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Time *</label>
                  <input
                    type="time"
                    required
                    value={ivForm.interviewTime}
                    onChange={(e) => setIvForm((p) => ({ ...p, interviewTime: e.target.value }))}
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
                    value={ivForm.interviewRound}
                    onChange={(e) => setIvForm((p) => ({ ...p, interviewRound: e.target.value }))}
                    placeholder="e.g., Technical Round 1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mode *</label>
                  <select
                    value={ivForm.interviewMode}
                    onChange={(e) => setIvForm((p) => ({ ...p, interviewMode: e.target.value }))}
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

              {ivForm.interviewMode === 'Online' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Link *</label>
                  <input
                    type="url"
                    required
                    value={ivForm.meetingLink}
                    onChange={(e) => setIvForm((p) => ({ ...p, meetingLink: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Location *</label>
                  <input
                    type="text"
                    required
                    value={ivForm.location}
                    onChange={(e) => setIvForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Campus Placement Cell / Office Address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Notes</label>
                <textarea
                  rows={2}
                  value={ivForm.notes}
                  onChange={(e) => setIvForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Topics to revise, panel details..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingInterview}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-60"
                >
                  {savingInterview ? 'Saving...' : 'Schedule Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Internship Application"
        description={`Are you sure you want to delete your application for ${internship.position} at ${internship.companyName}? This action cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
