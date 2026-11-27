import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  INTERNSHIP_TYPES,
} from '../constants';

function getTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function InternshipForm({
  initialData,
  submitLabel,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    companyName: initialData?.companyName ?? '',
    companyWebsite: initialData?.companyWebsite ?? '',
    companyLocation: initialData?.companyLocation ?? '',
    industry: initialData?.industry ?? '',
    position: initialData?.position ?? '',
    internshipType: initialData?.internshipType ?? 'Remote',
    employmentType: initialData?.employmentType ?? 'Full-time',
    duration: initialData?.duration ?? '',
    stipend: initialData?.stipend !== undefined ? String(initialData.stipend) : '',
    requiredSkills: initialData?.requiredSkills ?? '',
    applicationDate: initialData?.applicationDate ?? getTodayDate(),
    deadline: initialData?.deadline ?? '',
    applicationSource: initialData?.applicationSource ?? 'LinkedIn',
    status: initialData?.status ?? 'Applied',
    jobDescription: initialData?.jobDescription ?? '',
    notes: initialData?.notes ?? '',
    statusNotes: '',
  });

  const [validationError, setValidationError] = useState(null);
  const statusChanged = Boolean(initialData?.status && initialData.status !== form.status);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (validationError) setValidationError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.companyName.trim()) {
      setValidationError('Company name is required.');
      return;
    }
    if (!form.companyLocation.trim()) {
      setValidationError('Company location is required.');
      return;
    }
    if (!form.position.trim()) {
      setValidationError('Internship role / position is required.');
      return;
    }
    if (form.stipend !== '' && (Number.isNaN(Number(form.stipend)) || Number(form.stipend) < 0)) {
      setValidationError('Monthly stipend must be zero or a positive number.');
      return;
    }
    if (!form.applicationDate) {
      setValidationError('Application date is required.');
      return;
    }

    await onSubmit(form);
  };

  const displayError = validationError || serverError;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {displayError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <section className="bg-white border border-gray-300 rounded p-5">
        <h2 className="font-display text-base font-bold text-gray-900 pb-3 mb-4 border-b border-gray-200">
          Company
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-1">
              Company Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="companyName"
              type="text"
              required
              value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="e.g., Stripe, Atlassian, Infosys"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="companyWebsite" className="block text-sm font-semibold text-gray-700 mb-1">
              Company Website
            </label>
            <input
              id="companyWebsite"
              type="url"
              value={form.companyWebsite}
              onChange={(e) => handleChange('companyWebsite', e.target.value)}
              placeholder="https://company.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="companyLocation" className="block text-sm font-semibold text-gray-700 mb-1">
              Company Location <span className="text-rose-600">*</span>
            </label>
            <input
              id="companyLocation"
              type="text"
              required
              value={form.companyLocation}
              onChange={(e) => handleChange('companyLocation', e.target.value)}
              placeholder="e.g., Bengaluru, India or San Francisco, CA"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-semibold text-gray-700 mb-1">
              Industry / Sector
            </label>
            <input
              id="industry"
              type="text"
              value={form.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              placeholder="e.g., FinTech, SaaS, Cloud Infrastructure"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-300 rounded p-5">
        <h2 className="font-display text-base font-bold text-gray-900 pb-3 mb-4 border-b border-gray-200">
          Internship
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2 lg:col-span-1">
            <label htmlFor="position" className="block text-sm font-semibold text-gray-700 mb-1">
              Internship Role / Position <span className="text-rose-600">*</span>
            </label>
            <input
              id="position"
              type="text"
              required
              value={form.position}
              onChange={(e) => handleChange('position', e.target.value)}
              placeholder="e.g., Software Engineering Intern"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="internshipType" className="block text-sm font-semibold text-gray-700 mb-1">
              Internship Type <span className="text-rose-600">*</span>
            </label>
            <select
              id="internshipType"
              value={form.internshipType}
              onChange={(e) => handleChange('internshipType', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-600"
            >
              {INTERNSHIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="employmentType" className="block text-sm font-semibold text-gray-700 mb-1">
              Employment Type
            </label>
            <select
              id="employmentType"
              value={form.employmentType}
              onChange={(e) => handleChange('employmentType', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-600"
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-1">
              Internship Duration
            </label>
            <input
              id="duration"
              type="text"
              value={form.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="e.g., 12 weeks / 6 months"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="stipend" className="block text-sm font-semibold text-gray-700 mb-1">
              Monthly Stipend
            </label>
            <input
              id="stipend"
              type="number"
              min="0"
              step="any"
              value={form.stipend}
              onChange={(e) => handleChange('stipend', e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="requiredSkills" className="block text-sm font-semibold text-gray-700 mb-1">
              Required Skills
            </label>
            <input
              id="requiredSkills"
              type="text"
              value={form.requiredSkills}
              onChange={(e) => handleChange('requiredSkills', e.target.value)}
              placeholder="React, Node.js, SQL, JavaScript"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-300 rounded p-5">
        <h2 className="font-display text-base font-bold text-gray-900 pb-3 mb-4 border-b border-gray-200">
          Application
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="applicationDate" className="block text-sm font-semibold text-gray-700 mb-1">
              Application Date <span className="text-rose-600">*</span>
            </label>
            <input
              id="applicationDate"
              type="date"
              required
              value={form.applicationDate}
              onChange={(e) => handleChange('applicationDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-semibold text-gray-700 mb-1">
              Application Deadline
            </label>
            <input
              id="deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => handleChange('deadline', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="applicationSource" className="block text-sm font-semibold text-gray-700 mb-1">
              Application Source
            </label>
            <select
              id="applicationSource"
              value={form.applicationSource}
              onChange={(e) => handleChange('applicationSource', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-600"
            >
              {APPLICATION_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-1">
              Application Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-600"
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {statusChanged && (
            <div className="md:col-span-2 lg:col-span-4">
              <label htmlFor="statusNotes" className="block text-sm font-semibold text-gray-700 mb-1">
                Status Change Note (optional)
              </label>
              <input
                id="statusNotes"
                type="text"
                value={form.statusNotes || ''}
                onChange={(e) => handleChange('statusNotes', e.target.value)}
                placeholder="e.g., Recruiter reached out to schedule technical screening"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label htmlFor="jobDescription" className="block text-sm font-semibold text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              id="jobDescription"
              rows={4}
              value={form.jobDescription}
              onChange={(e) => handleChange('jobDescription', e.target.value)}
              placeholder="Paste key responsibilities, eligibility criteria, or role summary..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Referral contact, assessment link, resume version used, or prep reminders..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-60"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{submitting ? 'Saving...' : submitLabel}</span>
        </button>
      </div>
    </form>
  );
}
