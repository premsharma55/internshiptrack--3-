import { Bell, ChevronDown, LogOut, Menu, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STUDENT_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/applications', label: 'My Applications', end: true },
  { to: '/applications/new', label: 'Add Internship', end: true },
  { to: '/interviews', label: 'Interviews', end: true },
  { to: '/profile', label: 'My Profile', end: true },
  { to: '/settings', label: 'Settings', end: true },
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'All Applications', end: true },
  { to: '/profile', label: 'My Profile', end: true },
  { to: '/settings', label: 'Settings', end: true },
];

function getPageTitle(pathname, role) {
  if (pathname === '/admin') return 'Admin Panel';
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname === '/applications') return 'My Applications';
  if (pathname === '/applications/new') return 'Add Internship';
  if (pathname.endsWith('/edit')) return 'Edit Internship';
  if (pathname.startsWith('/applications/')) return 'Application Details';
  if (pathname === '/interviews') return 'Interviews & Deadlines';
  if (pathname === '/profile') return role === 'admin' ? 'Admin Profile' : 'Student Profile';
  if (pathname === '/settings') return 'Settings';
  return 'InternTrack';
}

export function Layout() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = student?.role === 'admin';
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : STUDENT_NAV_ITEMS;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    setSidebarOpen(false);
    setNotifOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isAdmin) {
      setNotifications([]);
      return undefined;
    }
    let active = true;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/dashboard/notifications');
        if (active) setNotifications(res.data.notifications || []);
      } catch {
        // Keep existing notifications silently
      }
    };
    fetchNotifications();
    return () => {
      active = false;
    };
  }, [location.pathname, isAdmin]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/applications?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/applications');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 text-gray-800">
      <div className="h-16 px-5 flex items-center justify-between border-b border-gray-200 shrink-0">
        <Link
          to={isAdmin ? '/admin' : '/dashboard'}
          className="font-display font-bold text-lg text-gray-900 whitespace-nowrap"
        >
          InternTrack
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary Navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 shrink-0 space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 truncate">{student?.fullName}</p>
          <p className="text-xs text-gray-500 truncate">{student?.college}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-60 lg:fixed lg:inset-y-0 lg:z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-60 max-w-[80vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-neutral-950 border-b border-neutral-800 text-white px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 text-neutral-300 hover:text-white"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-lg text-white truncate leading-tight">
                {getPageTitle(location.pathname, student?.role)}
              </h1>
              <p className="text-xs font-medium text-neutral-400 truncate">ABESEC Ghaziabad</p>
            </div>
          </div>

          {!isAdmin && (
            <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center flex-1 max-w-sm mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search company, role, or skill..."
                  aria-label="Search internship applications"
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-neutral-900 border border-neutral-700 rounded text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </form>
          )}

          <div className="flex items-center gap-3 shrink-0">
            {/* Notifications */}
            {!isAdmin && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative p-2 text-neutral-200 hover:text-white"
                  aria-label="View reminders and notifications"
                  aria-expanded={notifOpen}
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded shadow-md overflow-hidden z-40">
                    <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">Reminders &amp; Deadlines</span>
                      <span className="text-xs text-gray-500 tabular-nums">{notifications.length} active</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-200">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm text-gray-600">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <Link
                            key={item.id}
                            to={item.link}
                            className="block px-4 py-2.5 hover:bg-gray-50"
                          >
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-right">
                      <Link to="/interviews" className="text-xs font-medium text-blue-700 hover:underline">
                        Open Interviews &amp; Deadlines
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium text-neutral-200 hover:text-white hover:bg-neutral-800"
                aria-expanded={profileMenuOpen}
                aria-label="Open account menu"
              >
                <span className="hidden sm:inline max-w-[140px] truncate">{student?.fullName}</span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-300 rounded shadow-md py-1 z-40">
                  <div className="px-3.5 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 truncate">{student?.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{student?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Settings
                  </Link>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="bg-neutral-950 border-t border-neutral-800 text-neutral-300 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
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
    </div>
  );
}
