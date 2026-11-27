import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ allowedRoles }) {
  const { student, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-700 animate-spin" />
          <p className="text-sm font-medium text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(student.role)) {
    return <Navigate to={student.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { student, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-700 animate-spin" />
      </div>
    );
  }

  if (student) {
    return <Navigate to={student.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <Outlet />;
}
