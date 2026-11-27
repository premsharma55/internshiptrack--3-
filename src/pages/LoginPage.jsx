import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;

  const [email, setEmail] = useState(state?.prefillEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const user = await login(cleanEmail, password);
      const roleHome = user?.role === 'admin' ? '/admin' : '/dashboard';
      const requestedPath = state?.from?.pathname;
      const isAllowedTarget =
        requestedPath &&
        requestedPath !== '/login' &&
        (user?.role === 'admin' ? requestedPath === '/admin' || requestedPath === '/profile' || requestedPath === '/settings' : requestedPath !== '/admin');
      navigate(isAllowedTarget ? requestedPath : roleHome, { replace: true });
    } catch (err) {
      setError(getApiError(err, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-neutral-950 border-b border-neutral-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link
            to="/"
            className="justify-self-start font-display font-bold text-lg sm:text-xl tracking-tight text-white whitespace-nowrap shrink-0"
          >
            InternTrack
          </Link>
          <span className="justify-self-center font-display font-bold text-base sm:text-xl tracking-tight text-white whitespace-nowrap">
            ABESEC Ghaziabad
          </span>
          <div className="justify-self-end flex items-center gap-4 shrink-0">
            <Link
              to="/"
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
            >
              Home
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 transition-colors whitespace-nowrap"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white border border-gray-300 rounded-md p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-gray-900">Sign In</h1>

          {state?.registeredMessage && (
            <div className="mt-4 flex items-start gap-2.5 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{state.registeredMessage}</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-gray-800 mb-1">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-gray-800 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-200 text-center text-sm text-gray-700">
            No account?{' '}
            <Link to="/register" className="font-semibold text-blue-700 hover:underline">
              Register
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-neutral-950 border-t border-neutral-800 text-neutral-300 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <div className="space-y-0.5 text-xs sm:text-sm">
            <p className="font-semibold text-neutral-200">
              Developed &amp; Maintained By: Prem Sharma, Mukul Kumar — Computer Science and Engineering, Section 22
            </p>
            <p className="font-medium text-neutral-400">Full Stack Development Team</p>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-neutral-300 shrink-0">
            © 2026 ABESEC Ghaziabad. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
