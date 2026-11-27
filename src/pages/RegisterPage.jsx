import { AlertCircle, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: 'student',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    degree: '',
    department: '',
    rollNumber: '',
    graduationYear: String(new Date().getFullYear() + 1),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const passwordRules = [
    { label: '8+ chars', met: form.password.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(form.password) },
    { label: 'Lowercase', met: /[a-z]/.test(form.password) },
    { label: 'Number', met: /[0-9]/.test(form.password) },
  ];

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setError('Full name is required (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!passwordRules.every((r) => r.met)) {
      setError('Please choose a stronger password meeting all listed requirements.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }
    if (!form.college.trim()) {
      setError('College name is required.');
      return;
    }

    const isStudent = form.role === 'student';
    if (isStudent && (!form.degree.trim() || !form.department.trim() || !form.rollNumber.trim())) {
      setError('Course/degree, branch/department, and roll number are required.');
      return;
    }

    const gradYear = Number(form.graduationYear);
    if (isStudent && (!Number.isInteger(gradYear) || gradYear < 2000 || gradYear > 2040)) {
      setError('Please enter a valid graduation year between 2000 and 2040.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await register({
        role: form.role,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        college: form.college.trim(),
        degree: isStudent ? form.degree.trim() : 'Administration',
        department: isStudent ? form.department.trim() : 'Administration',
        rollNumber: isStudent ? form.rollNumber.trim() : 'ADMIN',
        graduationYear: isStudent ? gradYear : new Date().getFullYear(),
      });
      navigate('/login', {
        replace: true,
        state: {
          registeredMessage: 'Account created successfully. Please log in with your email and password.',
          prefillEmail: form.email.trim(),
        },
      });
    } catch (err) {
      setError(getApiError(err, 'Unable to complete registration.'));
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
              to="/login"
              className="px-3.5 py-1.5 text-sm font-semibold text-white border border-neutral-700 rounded hover:bg-neutral-800 transition-colors whitespace-nowrap"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-2xl w-full mx-auto bg-white border border-gray-300 rounded-md p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-5">Register</h1>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Role Selector */}
            <div>
              <span className="block text-sm font-semibold text-gray-800 mb-1.5">
                Account Role <span className="text-rose-600">*</span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('role', 'student')}
                  className={`py-2 px-3 text-sm font-semibold rounded border text-center transition-colors ${
                    form.role === 'student'
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('role', 'admin')}
                  className={`py-2 px-3 text-sm font-semibold rounded border text-center transition-colors ${
                    form.role === 'admin'
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-name" className="block text-sm font-semibold text-gray-800 mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Aarav Mehta"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-semibold text-gray-800 mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="aarav@university.edu"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className={form.role === 'admin' ? 'sm:col-span-2' : ''}>
                <label htmlFor="reg-college" className="block text-sm font-semibold text-gray-800 mb-1">
                  College Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="reg-college"
                  type="text"
                  required
                  value={form.college}
                  onChange={(e) => handleChange('college', e.target.value)}
                  placeholder="ABES Engineering College"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              {form.role === 'student' && (
                <>
                  <div>
                    <label htmlFor="reg-degree" className="block text-sm font-semibold text-gray-800 mb-1">
                      Course / Degree <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="reg-degree"
                      type="text"
                      required
                      value={form.degree}
                      onChange={(e) => handleChange('degree', e.target.value)}
                      placeholder="B.Tech / B.E. / MCA"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-dept" className="block text-sm font-semibold text-gray-800 mb-1">
                      Branch / Department <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="reg-dept"
                      type="text"
                      required
                      value={form.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      placeholder="Computer Science & Engineering"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-roll" className="block text-sm font-semibold text-gray-800 mb-1">
                        Roll Number <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="reg-roll"
                        type="text"
                        required
                        value={form.rollNumber}
                        onChange={(e) => handleChange('rollNumber', e.target.value)}
                        placeholder="22CS041"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-grad" className="block text-sm font-semibold text-gray-800 mb-1">
                        Graduation Year <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="reg-grad"
                        type="number"
                        min={2000}
                        max={2040}
                        required
                        value={form.graduationYear}
                        onChange={(e) => handleChange('graduationYear', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded tabular-nums focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-800 mb-1">
                  Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Create a strong password"
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

              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-semibold text-gray-800 mb-1">
                  Confirm Password <span className="text-rose-600">*</span>
                </label>
                <input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="p-3 rounded bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {passwordRules.map((rule) => (
                <div
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-xs ${
                    rule.met ? 'text-emerald-700 font-semibold' : 'text-gray-600'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 shrink-0 ${rule.met ? 'text-emerald-600' : 'text-gray-300'}`} />
                  <span>{rule.label}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </form>

          <p className="mt-5 pt-4 border-t border-gray-200 text-center text-sm text-gray-700">
            Have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-700 hover:underline">
              Sign in
            </Link>
          </p>
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
