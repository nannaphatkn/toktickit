import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadgeColor = {
    REQUESTER: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    IT_STAFF: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    ADMINISTRATOR: 'bg-purple-100 text-purple-800 border-purple-300',
  }[user?.role || 'REQUESTER'];

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:p-2 focus:rounded-md focus:shadow-md">
        Skip to main content
      </a>
      <nav className="bg-[#006B3C] text-white sticky top-0 z-40 shadow-md backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-[#E8F5E9] font-extrabold text-xl tracking-tight hover:opacity-90 transition-opacity">
                <span className="text-2xl">🎫</span>
                <span>TokTickIT</span>
              </Link>

              {/* Role-Based Navigation Links */}
              {isAuthenticated && user && (
                <div className="hidden md:flex items-center space-x-1">
                  {(user.role === 'REQUESTER' || user.role === 'IT_STAFF' || user.role === 'ADMINISTRATOR') && (
                    <NavLink
                      to="/create-ticket"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-[#00542f] text-white shadow-inner' : 'text-emerald-100 hover:bg-[#00542f]/70'
                        }`
                      }
                    >
                      📝 Create Ticket
                    </NavLink>
                  )}

                  {(user.role === 'REQUESTER' || user.role === 'ADMINISTRATOR') && (
                    <NavLink
                      to="/my-tickets"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-[#00542f] text-white shadow-inner' : 'text-emerald-100 hover:bg-[#00542f]/70'
                        }`
                      }
                    >
                      📋 My Tickets
                    </NavLink>
                  )}

                  {(user.role === 'IT_STAFF' || user.role === 'ADMINISTRATOR') && (
                    <NavLink
                      to="/staff/queue"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-[#00542f] text-white shadow-inner' : 'text-emerald-100 hover:bg-[#00542f]/70'
                        }`
                      }
                    >
                      📥 Ticket Queue
                    </NavLink>
                  )}

                  {user.role === 'ADMINISTRATOR' && (
                    <NavLink
                      to="/admin/users"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-[#00542f] text-white shadow-inner' : 'text-emerald-100 hover:bg-[#00542f]/70'
                        }`
                      }
                    >
                      👥 User Management
                    </NavLink>
                  )}
                </div>
              )}
            </div>

            {/* Right: Authenticated User Info & Logout */}
            <div className="flex items-center gap-4">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5 bg-[#00542f]/60 border border-emerald-600/40 px-3 py-1.5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#006B3C] font-bold flex items-center justify-center text-sm shadow-sm">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden sm:block text-left text-xs">
                      <div className="font-semibold text-white truncate max-w-[130px]">{user.fullName}</div>
                      <span className={`inline-block px-1.5 py-0.2 text-[10px] font-bold rounded-md border ${roleBadgeColor}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/40 hover:bg-rose-900/60 border border-emerald-600/40 text-emerald-100 hover:text-white transition-all"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-white text-[#006B3C] hover:bg-emerald-50 transition-all shadow-sm"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
