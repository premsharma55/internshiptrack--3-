import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getApiError } from '../api/client';
import { InternshipForm } from '../components/InternshipForm';

export function EditInternshipPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get(`/internships/${id}`);
        if (active) setInternship(res.data.internship);
      } catch (err) {
        if (active) setLoadError(getApiError(err, 'Internship application not found.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await api.put(`/internships/${id}`, {
        ...values,
        stipend: values.stipend === '' ? 0 : Number(values.stipend),
      });
      navigate(`/applications/${id}`);
    } catch (err) {
      setServerError(getApiError(err, 'Failed to update internship application.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-white border border-gray-300 rounded animate-pulse" />
      </div>
    );
  }

  if (loadError || !internship) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-gray-300 rounded p-8 text-center">
        <h2 className="font-display text-lg font-bold text-gray-900">Unable to load application</h2>
        <p className="text-sm text-gray-600 mt-1">{loadError || 'Record not found.'}</p>
        <Link
          to="/applications"
          className="mt-4 inline-block px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800"
        >
          Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="pb-3 border-b border-gray-200">
        <Link
          to={`/applications/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Details</span>
        </Link>
        <h2 className="font-display text-xl font-bold text-gray-900">
          Edit — {internship.companyName}
        </h2>
      </div>

      <InternshipForm
        initialData={internship}
        submitLabel="Save Changes"
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/applications/${id}`)}
      />
    </div>
  );
}
