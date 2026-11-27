import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, getApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { student, setStudent } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    dob: '',
    address: '',
    college: '',
    degree: '',
    department: '',
    rollNumber: '',
    currentSemester: '',
    graduationYear: '',
    cgpa: '',
    skills: '',
    programmingLanguages: '',
    projects: '',
    certifications: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [resumePreviewUrl, setResumePreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const resumeInputRef = useRef(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (student) {
      setForm({
        fullName: student.fullName || '',
        phone: student.phone || '',
        dob: student.dob || '',
        address: student.address || '',
        college: student.college || '',
        degree: student.degree || '',
        department: student.department || '',
        rollNumber: student.rollNumber || '',
        currentSemester: student.currentSemester || '',
        graduationYear: String(student.graduationYear || ''),
        cgpa: student.cgpa || '',
        skills: student.skills || '',
        programmingLanguages: student.programmingLanguages || '',
        projects: student.projects || '',
        certifications: student.certifications || '',
        linkedinUrl: student.linkedinUrl || '',
        githubUrl: student.githubUrl || '',
        portfolioUrl: student.portfolioUrl || '',
      });
    }
  }, [student]);

  useEffect(() => {
    return () => {
      if (resumePreviewUrl) {
        URL.revokeObjectURL(resumePreviewUrl);
      }
    };
  }, [resumePreviewUrl]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.fullName.trim() || !form.college.trim() || !form.degree.trim() || !form.department.trim() || !form.rollNumber.trim()) {
      setError('Full name, college, degree, department, and roll number are required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.put('/students/profile', {
        ...form,
        graduationYear: Number(form.graduationYear),
      });
      setStudent(res.data.student);
      setSuccess('Your profile has been saved.');
    } catch (err) {
      setError(getApiError(err, 'Failed to save profile changes.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Profile photo must be a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile photo must be smaller than 2 MB.');
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await api.post('/students/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStudent(res.data.student);
      setSuccess('Profile photo updated.');
    } catch (err) {
      setError(getApiError(err, 'Failed to upload profile photo.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files (.pdf) are supported for resume upload.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Resume file size must not exceed 5 MB.');
      return;
    }

    setUploadingResume(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await api.post('/students/resume', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStudent(res.data.student);
      setSuccess('Resume PDF uploaded successfully.');
    } catch (err) {
      setError(getApiError(err, 'Failed to upload resume PDF.'));
    } finally {
      setUploadingResume(false);
    }
  };

  const handlePreviewResume = async () => {
    setLoadingPreview(true);
    setError(null);
    try {
      const res = await api.get('/students/resume/download', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResumePreviewUrl(url);
    } catch (err) {
      setError(getApiError(err, 'Unable to load resume preview.'));
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownloadResume = async () => {
    setError(null);
    try {
      const res = await api.get('/students/resume/download?download=1', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = student?.resumeFileName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiError(err, 'Unable to download resume.'));
    }
  };

  const handleDeleteResume = async () => {
    setError(null);
    try {
      const res = await api.delete('/students/resume');
      setStudent(res.data.student);
      setSuccess('Resume removed.');
    } catch (err) {
      setError(getApiError(err, 'Unable to delete resume.'));
    }
  };

  const initials = (student?.fullName || 'S')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const photoUrl = student?.profilePhoto ? `/api/students/photo/${student.profilePhoto}` : null;
  const completion = student?.profileCompletion ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header + Completion */}
      <section className="bg-white border border-gray-300 rounded p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={student?.fullName || 'Student'}
              className="w-16 h-16 rounded object-cover border border-gray-300 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-gray-800 text-white font-display font-bold text-lg flex items-center justify-center shrink-0">
              {initials}
            </div>
          )}
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">{student?.fullName}</h2>
            <p className="text-sm text-gray-600">{student?.email}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {student?.college} · {student?.rollNumber}
            </p>
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => photoInputRef.current?.click()}
              className="mt-1.5 text-xs font-semibold text-blue-700 hover:underline disabled:opacity-50"
            >
              {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="w-full md:w-64">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-gray-600">Profile Completion</span>
            <span className="font-mono tabular-nums text-gray-900">{completion}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
            <div className="h-full bg-blue-700" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-3.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Resume Management */}
      <section className="bg-white border border-gray-300 rounded p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-200">
          <div>
            <h3 className="font-display text-base font-bold text-gray-900">Resume (PDF)</h3>
            <p className="text-xs text-gray-500">Max 5 MB</p>
          </div>
          <div>
            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleResumeUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploadingResume}
              onClick={() => resumeInputRef.current?.click()}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-60"
            >
              {uploadingResume ? 'Uploading...' : student?.resumeStoredName ? 'Replace Resume' : 'Upload Resume PDF'}
            </button>
          </div>
        </div>

        {student?.resumeStoredName ? (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{student.resumeFileName}</p>
              <p className="text-xs text-gray-500 font-mono tabular-nums">
                {(student.resumeSize / 1024).toFixed(1)} KB · Uploaded {student.resumeUploadedAt.slice(0, 10)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={handlePreviewResume}
                disabled={loadingPreview}
                className="text-gray-700 hover:underline"
              >
                {loadingPreview ? 'Opening...' : 'Preview'}
              </button>
              <button type="button" onClick={handleDownloadResume} className="text-blue-700 hover:underline">
                Download
              </button>
              <button type="button" onClick={handleDeleteResume} className="text-red-600 hover:underline">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-600">No resume uploaded</p>
        )}
      </section>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <section className="bg-white border border-gray-300 rounded p-5">
          <h3 className="font-display text-base font-bold text-gray-900 pb-3 mb-4 border-b border-gray-200">
            Personal Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={student?.email || ''}
                className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-100 text-gray-500 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth (optional)</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="City, State, Country"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-300 rounded p-5">
          <h3 className="font-display text-base font-bold text-gray-900 pb-3 mb-4 border-b border-gray-200">
            Academic Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">College / University *</label>
              <input
                type="text"
                required
                value={form.college}
                onChange={(e) => handleChange('college', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Degree *</label>
              <input
                type="text"
                required
                value={form.degree}
                onChange={(e) => handleChange('degree', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Department *</label>
              <input
                type="text"
                required
                value={form.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Roll Number *</label>
              <input
                type="text"
                required
                value={form.rollNumber}
                onChange={(e) => handleChange('rollNumber', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Current Semester</label>
              <input
                type="text"
                value={form.currentSemester}
                onChange={(e) => handleChange('currentSemester', e.target.value)}
                placeholder="e.g., 6th Semester"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Grad Year *</label>
                <input
                  type="number"
                  min={2000}
                  max={2040}
                  required
                  value={form.graduationYear}
                  onChange={(e) => handleChange('graduationYear', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CGPA / %</label>
                <input
                  type="text"
                  value={form.cgpa}
                  onChange={(e) => handleChange('cgpa', e.target.value)}
                  placeholder="8.9 / 89%"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-300 rounded p-5">
          <h3 className="font-display text-base font-bold text-gray-900 pb-3 mb-4 border-b border-gray-200">
            Professional Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Technical Skills</label>
              <input
                type="text"
                value={form.skills}
                onChange={(e) => handleChange('skills', e.target.value)}
                placeholder="React, Express, Docker, Git, System Design"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Programming Languages</label>
              <input
                type="text"
                value={form.programmingLanguages}
                onChange={(e) => handleChange('programmingLanguages', e.target.value)}
                placeholder="JavaScript, Python, Java, C++"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Projects</label>
              <textarea
                rows={3}
                value={form.projects}
                onChange={(e) => handleChange('projects', e.target.value)}
                placeholder="Briefly list key academic or personal projects..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Certifications</label>
              <textarea
                rows={3}
                value={form.certifications}
                onChange={(e) => handleChange('certifications', e.target.value)}
                placeholder="AWS Cloud Practitioner, Meta Front-End Certificate..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">GitHub Profile</label>
                <input
                  type="url"
                  value={form.githubUrl}
                  onChange={(e) => handleChange('githubUrl', e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Portfolio Website</label>
                <input
                  type="url"
                  value={form.portfolioUrl}
                  onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                  placeholder="https://portfolio.dev"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>

      {/* PDF Resume Preview Modal */}
      {resumePreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-4xl h-[85vh] bg-white rounded-md border border-gray-300 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-900 truncate">
                {student?.resumeFileName || 'Resume Preview'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadResume}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(resumePreviewUrl);
                    setResumePreviewUrl(null);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-900"
                  aria-label="Close resume preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe
              src={resumePreviewUrl}
              title="Resume PDF Preview"
              className="flex-1 w-full bg-gray-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
