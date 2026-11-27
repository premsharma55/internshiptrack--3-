import { AlertCircle, Download, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api, getApiError } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { APPLICATION_STATUSES } from '../constants';

function escapeCsvCell(value) {
  const str = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function AdminPage() {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/applications', {
        params: {
          status: status !== 'All' ? status : undefined,
          search: search.trim() || undefined,
        },
      });
      setApplications(res.data.applications || []);
    } catch (err) {
      setError(getApiError(err, 'Failed to load student applications.'));
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadApplications();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadApplications]);

  const handleExportCsv = () => {
    const headers = [
      'Student Name',
      'Email',
      'Roll Number',
      'Department',
      'Degree',
      'College',
      'Company',
      'Location',
      'Position',
      'Work Mode',
      'Stipend',
      'Applied Date',
      'Deadline',
      'Source',
      'Status',
    ];

    const rows = applications.map((app) => [
      app.studentName,
      app.studentEmail,
      app.rollNumber,
      app.department,
      app.degree,
      app.college,
      app.companyName,
      app.companyLocation,
      app.position,
      app.internshipType,
      app.stipend > 0 ? app.stipend : 0,
      app.applicationDate,
      app.deadline || '',
      app.applicationSource,
      app.status,
    ]);

    const csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.download = `student-internships-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const hasFilters = status !== 'All' || Boolean(search.trim());

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-200">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">All Student Applications</h2>
          <p className="text-sm text-gray-500 tabular-nums">{applications.length} total</p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={loading || applications.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <section className="bg-white border border-gray-300 rounded p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-center">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, roll number, company, or role..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            aria-label="Filter by application status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!hasFilters}
            onClick={() => {
              setStatus('All');
              setSearch('');
            }}
            className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Reset
          </button>
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

      {/* Table */}
      <section className="bg-white border border-gray-300 rounded overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-gray-800">
              {hasFilters ? 'No matching applications found' : 'No student applications submitted yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll No.</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{app.studentName}</p>
                      <p className="text-xs text-gray-500">{app.studentEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-gray-700 whitespace-nowrap">
                      <p>{app.rollNumber}</p>
                      <p className="text-gray-500 font-sans">{app.department}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{app.companyName}</p>
                      <p className="text-xs text-gray-500">{app.companyLocation}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-800">{app.position}</p>
                      {app.stipend > 0 && (
                        <p className="text-xs text-gray-500 font-mono tabular-nums">
                          {app.stipend.toLocaleString()} / mo
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">
                      {app.internshipType}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-gray-600 whitespace-nowrap">
                      <p>{app.applicationDate}</p>
                      {app.deadline && <p className="text-gray-400">Due {app.deadline}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
