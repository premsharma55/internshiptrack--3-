const STATUS_STYLES = {
  Applied: 'text-blue-700 bg-blue-50 border-blue-200',
  'Under Review': 'text-indigo-700 bg-indigo-50 border-indigo-200',
  Shortlisted: 'text-cyan-800 bg-cyan-50 border-cyan-200',
  'Interview Scheduled': 'text-amber-800 bg-amber-50 border-amber-200',
  Selected: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Rejected: 'text-rose-700 bg-rose-50 border-rose-200',
  Withdrawn: 'text-gray-600 bg-gray-100 border-gray-300',
};

export function StatusBadge({ status }) {
  const styleClass = STATUS_STYLES[status] ?? 'text-gray-700 bg-gray-100 border-gray-300';

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border whitespace-nowrap ${styleClass}`}
    >
      {status}
    </span>
  );
}

export function CompanyAvatar() {
  return null;
}
