import { AlertCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, getApiError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const STATUS_BAR_COLORS = {
  Applied: '#2563eb',
  'Under Review': '#4f46e5',
  Shortlisted: '#0891b2',
  'Interview Scheduled': '#d97706',
  Selected: '#16a34a',
  Rejected: '#dc2626',
  Withdrawn: '#6b7280',
};

export function DashboardPage() {
  const { student } = useAuth();
  const [data, setData] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const [statsRes, recentRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-applications'),
      ]);
      setData(statsRes.data);
      setRecentApps(recentRes.data.applications || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/internships/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadDashboard();
    } catch (err) {
      setError(getApiError(err, 'Failed to delete internship application.'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const statCards = data
    ? [
        { label: 'Total', value: data.stats.total, filter: 'All' },
        { label: 'Applied', value: data.stats.applied, filter: 'Applied' },
        { label: 'Under Review', value: data.stats.underReview, filter: 'Under Review' },
        { label: 'Shortlisted', value: data.stats.shortlisted, filter: 'Shortlisted' },
        { label: 'Interview', value: data.stats.interviewScheduled, filter: 'Interview Scheduled' },
        { label: 'Selected', value: data.stats.selected, filter: 'Selected' },
        { label: 'Rejected', value: data.stats.rejected, filter: 'Rejected' },
      ]
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-white border border-gray-300 rounded animate-pulse" />
        <div className="h-24 bg-white border border-gray-300 rounded animate-pulse" />
        <div className="h-64 bg-white border border-gray-300 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">
            Welcome, {student?.fullName?.split(' ')[0] || 'Student'}
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {student?.college} · {student?.degree}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/profile"
            className="px-3.5 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
          >
            Profile ({student?.profileCompletion ?? 0}%)
          </Link>
          <Link
            to="/applications/new"
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 whitespace-nowrap"
          >
            Add Internship
          </Link>
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

      {/* Simple Summary Strip */}
      <section aria-label="Application Statistics">
        <div className="bg-white border border-gray-300 rounded grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          {statCards.map((card) => (
            <Link
              key={card.label}
              to={card.filter === 'All' ? '/applications' : `/applications?status=${encodeURIComponent(card.filter)}`}
              className="p-4 hover:bg-gray-50 transition-colors block"
            >
              <span className="block text-xs font-semibold text-gray-500">{card.label}</span>
              <span className="mt-1 block font-display text-2xl font-bold tabular-nums text-gray-900">
                {card.value}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Chart + Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-gray-300 rounded p-5">
          <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-200">
            <h3 className="font-display text-base font-bold text-gray-900">Application Status</h3>
            <Link to="/applications" className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap">
              View All
            </Link>
          </div>

          {!data || data.stats.total === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-gray-600">No applications yet</p>
              <Link
                to="/applications/new"
                className="mt-3 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 rounded hover:bg-blue-800"
              >
                Add Application
              </Link>
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.statusBreakdown}
                  margin={{ top: 8, right: 12, left: -16, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11, fill: '#4b5563' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#4b5563' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Applications" maxBarSize={40}>
                    {data.statusBreakdown.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_BAR_COLORS[entry.status] || '#2563eb'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-300 rounded p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-200">
            <h3 className="font-display text-base font-bold text-gray-900">Upcoming Interviews</h3>
            <Link to="/interviews" className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap">
              Manage
            </Link>
          </div>

          <div className="flex-1 divide-y divide-gray-200">
            {!data || data.upcomingInterviews.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-600">No upcoming interviews</p>
                <Link to="/interviews" className="mt-2 inline-block text-xs font-semibold text-blue-700 hover:underline">
                  Schedule Interview
                </Link>
              </div>
            ) : (
              data.upcomingInterviews.map((iv) => (
                <div key={iv.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{iv.companyName}</p>
                      <p className="text-xs text-gray-600 truncate">
                        {iv.position} · {iv.interviewRound}
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-gray-700 shrink-0">
                      {iv.interviewDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="tabular-nums">
                      {iv.interviewTime} · {iv.interviewMode}
                    </span>
                    {iv.interviewMode === 'Online' && iv.meetingLink ? (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline font-medium"
                      >
                        Join Link
                      </a>
                    ) : iv.location ? (
                      <span className="truncate max-w-[140px]">{iv.location}</span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Recent Applications Table */}
      <section className="bg-white border border-gray-300 rounded overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between gap-4">
          <h3 className="font-display text-base font-bold text-gray-900">Recent Applications</h3>
          <Link to="/applications" className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap">
            View All ({data?.stats.total ?? 0})
          </Link>
        </div>

        {recentApps.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-600">No applications yet</p>
            <Link
              to="/applications/new"
              className="mt-3 inline-block px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800"
            >
              Add Internship
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                  <th className="py-2.5 px-5">Company</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Applied Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {recentApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="py-3 px-5">
                      <Link
                        to={`/applications/${app.id}`}
                        className="font-semibold text-gray-900 hover:text-blue-700 hover:underline block"
                      >
                        {app.companyName}
                      </Link>
                      <span className="text-xs text-gray-500">{app.companyLocation}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-800">{app.position}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs tabular-nums whitespace-nowrap">
                      {app.applicationDate}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 px-5 text-right space-x-3 text-xs font-medium whitespace-nowrap">
                      <Link to={`/applications/${app.id}`} className="text-blue-700 hover:underline">
                        View
                      </Link>
                      <Link to={`/applications/${app.id}/edit`} className="text-gray-700 hover:underline">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(app)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Deadlines & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-300 rounded p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
            <h3 className="font-display text-base font-bold text-gray-900">Deadlines</h3>
            <Link to="/interviews" className="text-xs font-semibold text-blue-700 hover:underline">
              All Deadlines
            </Link>
          </div>

          {!data || (data.approachingDeadlines.length === 0 && data.expiredDeadlines.length === 0) ? (
            <p className="py-6 text-center text-sm text-gray-600">No urgent deadlines</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {data.approachingDeadlines.map((d) => (
                <Link
                  key={`app-${d.id}`}
                  to={`/applications/${d.id}`}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.companyName}</p>
                    <p className="text-xs text-gray-600 truncate">{d.position}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono tabular-nums font-semibold text-amber-700 block">
                      Due {d.deadline}
                    </span>
                    <span className="text-xs text-amber-700">Approaching</span>
                  </div>
                </Link>
              ))}

              {data.expiredDeadlines.map((d) => (
                <Link
                  key={`exp-${d.id}`}
                  to={`/applications/${d.id}`}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.companyName}</p>
                    <p className="text-xs text-gray-600 truncate">{d.position}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono tabular-nums font-semibold text-red-600 block">
                      {d.deadline}
                    </span>
                    <span className="text-xs text-red-600">Expired</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-300 rounded p-5">
          <div className="pb-3 mb-3 border-b border-gray-200">
            <h3 className="font-display text-base font-bold text-gray-900">Recent Activity</h3>
          </div>

          {!data || data.recentActivities.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-600">No recent activity</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {data.recentActivities.map((act) => (
                <Link
                  key={act.id}
                  to={`/applications/${act.internshipId}`}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {act.companyName} · {act.position}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{act.notes}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={act.newStatus} />
                    <p className="text-xs text-gray-400 font-mono tabular-nums mt-1">
                      {act.changedAt.slice(0, 10)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Internship Application"
        description={
          deleteTarget
            ? `Are you sure you want to delete your application for ${deleteTarget.position} at ${deleteTarget.companyName}? This will also remove its history and linked interviews.`
            : ''
        }
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
