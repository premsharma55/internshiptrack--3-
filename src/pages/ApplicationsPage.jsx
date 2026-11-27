import { AlertCircle, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getApiError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { APPLICATION_STATUSES, INTERNSHIP_TYPES } from '../constants';

export function ApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [internshipType, setInternshipType] = useState(searchParams.get('internshipType') || 'All');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));

  const [internships, setInternships] = useState([]);
  const [locations, setLocations] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const paramSearch = searchParams.get('search') || '';
    const paramStatus = searchParams.get('status') || 'All';
    setSearch(paramSearch);
    setStatus(paramStatus);
  }, [searchParams]);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/internships', {
        params: {
          search: search.trim() || undefined,
          status: status !== 'All' ? status : undefined,
          internshipType: internshipType !== 'All' ? internshipType : undefined,
          location: locationFilter.trim() || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sortBy,
          page,
          limit: 10,
        },
      });
      setInternships(res.data.internships || []);
      setPagination(res.data.pagination);
      setLocations(res.data.locations || []);
    } catch (err) {
      setError(getApiError(err, 'Failed to load internship applications.'));
    } finally {
      setLoading(false);
    }
  }, [search, status, internshipType, locationFilter, dateFrom, dateTo, sortBy, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchApplications]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('All');
    setInternshipType('All');
    setLocationFilter('');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
    setPage(1);
    setSearchParams({});
  };

  const handleQuickStatusChange = async (id, newStatus) => {
    setUpdatingStatusId(id);
    try {
      const res = await api.patch(`/internships/${id}/status`, {
        status: newStatus,
      });
      setInternships((prev) => prev.map((item) => (item.id === id ? res.data.internship : item)));
    } catch (err) {
      setError(getApiError(err, 'Failed to update application status.'));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/internships/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchApplications();
    } catch (err) {
      setError(getApiError(err, 'Failed to delete internship application.'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    status !== 'All' ||
    internshipType !== 'All' ||
    Boolean(locationFilter) ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    sortBy !== 'newest';

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-200">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Applications</h2>
          <p className="text-sm text-gray-500 tabular-nums">{pagination.total} total</p>
        </div>
        <Link
          to="/applications/new"
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 whitespace-nowrap shrink-0 text-center"
        >
          Add Internship
        </Link>
      </div>

      {/* Filters */}
      <section className="bg-white border border-gray-300 rounded p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by company name, role, or skill..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            aria-label="Filter by application status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by internship type"
            value={internshipType}
            onChange={(e) => {
              setInternshipType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Work Modes</option>
            {INTERNSHIP_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label htmlFor="filter-location" className="block text-xs font-semibold text-gray-600 mb-1">
              Location
            </label>
            <input
              id="filter-location"
              list="known-locations"
              type="text"
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(1);
              }}
              placeholder="City or region"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            />
            <datalist id="known-locations">
              {locations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="filter-from" className="block text-xs font-semibold text-gray-600 mb-1">
              Applied From
            </label>
            <input
              id="filter-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="filter-to" className="block text-xs font-semibold text-gray-600 mb-1">
              Applied To
            </label>
            <input
              id="filter-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded tabular-nums focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="sort-by" className="block text-xs font-semibold text-gray-600 mb-1">
              Sort By
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="newest">Newest Application</option>
              <option value="oldest">Oldest Application</option>
              <option value="company_asc">Company (A–Z)</option>
              <option value="company_desc">Company (Z–A)</option>
              <option value="deadline_asc">Closest Deadline</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Reset Filters
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
        ) : internships.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-gray-800">
              {hasActiveFilters ? 'No matching applications' : 'No applications yet'}
            </p>
            <div className="mt-3">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Reset Filters
                </button>
              ) : (
                <Link
                  to="/applications/new"
                  className="inline-block px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800"
                >
                  Add Internship
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                    <th className="py-3 px-5">Company</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Location &amp; Mode</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {internships.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="py-3 px-5">
                        <Link
                          to={`/applications/${app.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-700 hover:underline block"
                        >
                          {app.companyName}
                        </Link>
                        {app.industry && (
                          <span className="text-xs text-gray-500 block">{app.industry}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{app.position}</p>
                        {app.stipend > 0 && (
                          <p className="text-xs text-gray-500 font-mono tabular-nums">
                            {app.stipend.toLocaleString()} / mo
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <p>{app.companyLocation}</p>
                        <p className="text-xs text-gray-500">
                          {app.internshipType} · {app.employmentType}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs tabular-nums whitespace-nowrap">
                        <p>{app.applicationDate}</p>
                        {app.deadline && (
                          <p className="text-xs text-gray-400">Due {app.deadline}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Change status for ${app.companyName}`}
                          value={app.status}
                          disabled={updatingStatusId === app.id}
                          onChange={(e) => handleQuickStatusChange(app.id, e.target.value)}
                          className="text-xs font-medium px-2 py-1 rounded border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
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

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-gray-200">
              {internships.map((app) => (
                <div key={app.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/applications/${app.id}`}
                        className="font-semibold text-gray-900 hover:underline truncate block"
                      >
                        {app.companyName}
                      </Link>
                      <p className="text-sm text-gray-700 truncate">{app.position}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="text-xs text-gray-500">
                    {app.companyLocation} · {app.internshipType} · Applied {app.applicationDate}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <select
                      aria-label={`Change status for ${app.companyName}`}
                      value={app.status}
                      disabled={updatingStatusId === app.id}
                      onChange={(e) => handleQuickStatusChange(app.id, e.target.value)}
                      className="text-xs font-medium px-2 py-1 rounded border border-gray-300 bg-white text-gray-800"
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-3 text-xs font-medium">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-4 bg-gray-50">
                <span className="text-xs text-gray-600 tabular-nums">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Internship Application"
        description={
          deleteTarget
            ? `Are you sure you want to delete your application for ${deleteTarget.position} at ${deleteTarget.companyName}?`
            : ''
        }
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
