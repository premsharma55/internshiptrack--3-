import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getApiError } from '../api/client';
import { InternshipForm } from '../components/InternshipForm';

export function AddInternshipPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await api.post('/internships', {
        ...values,
        stipend: values.stipend === '' ? 0 : Number(values.stipend),
      });
      navigate(`/applications/${res.data.internship.id}`);
    } catch (err) {
      setServerError(getApiError(err, 'Failed to save internship application.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="pb-3 border-b border-gray-200">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Applications</span>
        </Link>
        <h2 className="font-display text-xl font-bold text-gray-900">Add Internship</h2>
      </div>

      <InternshipForm
        submitLabel="Save Application"
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/applications')}
      />
    </div>
  );
}
