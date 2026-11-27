import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { student } = useAuth();
  const isAdmin = student?.role === 'admin';
  const homeDestination = isAdmin ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-neutral-950 border-b border-neutral-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className="justify-self-start font-display font-bold text-lg sm:text-xl tracking-tight text-white whitespace-nowrap shrink-0"
          >
            InternTrack
          </Link>

          <div className="justify-self-center text-center">
            <span className="font-display font-bold text-base sm:text-xl md:text-2xl tracking-tight text-white whitespace-nowrap">
              ABESEC Ghaziabad
            </span>
          </div>

          <div className="justify-self-end flex items-center shrink-0">
            {student ? (
              <Link
                to={homeDestination}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                {isAdmin ? 'Open Admin Panel' : 'Open Dashboard'}
              </Link>
            ) : (
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white">
        {/* Simple Traditional Hero */}
        <section className="bg-gray-50 border-b border-gray-200 py-14 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-display font-bold text-gray-900 text-3xl sm:text-4xl md:text-5xl tracking-tight [text-wrap:balance]">
              Track every internship application.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
              Applications, interviews, deadlines, and resumes in one place.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {student ? (
                <Link
                  to={homeDestination}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 transition-colors whitespace-nowrap"
                >
                  {isAdmin ? 'Go to Admin Panel' : 'Go to Dashboard'}
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 transition-colors whitespace-nowrap"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="px-5 py-2.5 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Simple Features List */}
        <section id="features" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-gray-200">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-gray-200 bg-white rounded p-5">
              <h3 className="font-display text-base font-bold text-gray-900">Application Tracker</h3>
              <p className="mt-1.5 text-sm text-gray-600">Search, filter, and sort every role.</p>
            </div>
            <div className="border border-gray-200 bg-white rounded p-5">
              <h3 className="font-display text-base font-bold text-gray-900">Status Analytics</h3>
              <p className="mt-1.5 text-sm text-gray-600">Live stats and status timeline.</p>
            </div>
            <div className="border border-gray-200 bg-white rounded p-5">
              <h3 className="font-display text-base font-bold text-gray-900">Interviews &amp; Deadlines</h3>
              <p className="mt-1.5 text-sm text-gray-600">Rounds, links, and deadline alerts.</p>
            </div>
            <div className="border border-gray-200 bg-white rounded p-5">
              <h3 className="font-display text-base font-bold text-gray-900">Profile &amp; Resume</h3>
              <p className="mt-1.5 text-sm text-gray-600">Academic profile with PDF preview.</p>
            </div>
          </div>
        </section>

        {/* Simple Workflow & Stages */}
        <section id="workflow" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div id="stages" className="border border-gray-200 bg-white rounded p-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Pipeline Stages</h2>
              <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm text-gray-700 list-disc list-inside">
                <li>Applied</li>
                <li>Under Review</li>
                <li>Shortlisted</li>
                <li>Interview Scheduled</li>
                <li>Selected</li>
                <li>Rejected</li>
                <li>Withdrawn</li>
              </ul>
            </div>

            <div className="border border-gray-200 bg-white rounded p-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-4">How It Works</h2>
              <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
                <li className="font-medium text-gray-800">Create account &amp; upload resume</li>
                <li className="font-medium text-gray-800">Log applications &amp; deadlines</li>
                <li className="font-medium text-gray-800">Track interviews &amp; status updates</li>
              </ol>
            </div>
          </div>
        </section>
      </main>

      {/* Dark Black Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800 text-neutral-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-neutral-200">
              Developed &amp; Maintained By: Prem Sharma, Mukul Kumar — Computer Science and Engineering, Section 22
            </p>
            <p className="font-medium text-neutral-400">Full Stack Development Team</p>
          </div>
          <p className="text-sm font-semibold text-neutral-300 shrink-0">
            © 2026 ABESEC Ghaziabad. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
