import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import CreateTicket from './pages/CreateTicket';
import MyTickets from './pages/MyTickets';
import TicketDetail from './pages/TicketDetail';
import { StaffQueue } from './pages/StaffQueue';
import { StaffTicketDetail } from './pages/StaffTicketDetail';
import { UserManagement } from './pages/UserManagement';
import { RequesterProvider } from './contexts/RequesterContext';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="w-8 h-8 border-4 border-[#006B3C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role if forbidden
    if (user.role === 'IT_STAFF') return <Navigate to="/staff/queue" replace />;
    if (user.role === 'ADMINISTRATOR') return <Navigate to="/admin/users" replace />;
    return <Navigate to="/my-tickets" replace />;
  }

  return <>{children}</>;
};

// Home Dashboard Component based on Role
function HomeDashboard() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'IT_STAFF') {
    return <Navigate to="/staff/queue" replace />;
  }
  if (user.role === 'ADMINISTRATOR') {
    return <Navigate to="/admin/users" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#006B3C] text-2xl font-bold flex items-center justify-center">
            👋
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Welcome, {user.fullName}!</h1>
            <p className="text-sm text-slate-500">Logged in as {user.email} ({user.role})</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/create-ticket"
            className="bg-[#F0FAF5] hover:bg-emerald-100/60 border border-emerald-200/80 rounded-2xl p-6 transition-all text-center space-y-2 block"
          >
            <span className="text-3xl">📝</span>
            <h3 className="font-bold text-[#006B3C] text-lg">Create Ticket</h3>
            <p className="text-xs text-slate-600">Submit a new IT support ticket with optional file attachments.</p>
          </Link>

          <Link
            to="/my-tickets"
            className="bg-[#F0FAF5] hover:bg-emerald-100/60 border border-emerald-200/80 rounded-2xl p-6 transition-all text-center space-y-2 block"
          >
            <span className="text-3xl">📋</span>
            <h3 className="font-bold text-[#006B3C] text-lg">My Tickets</h3>
            <p className="text-xs text-slate-600">Track and manage your submitted ticket requests and status updates.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <RequesterProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
          <Navbar />
          <main id="main-content" className="flex-1 pb-12">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/change-password" element={<ChangePassword />} />

              {/* Protected User Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-ticket"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR']}>
                    <CreateTicket />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER', 'ADMINISTRATOR']}>
                    <MyTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets/:id"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER', 'ADMINISTRATOR']}>
                    <TicketDetail />
                  </ProtectedRoute>
                }
              />

              {/* Protected IT Staff Routes */}
              <Route
                path="/staff/queue"
                element={
                  <ProtectedRoute allowedRoles={['IT_STAFF', 'ADMINISTRATOR']}>
                    <StaffQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/tickets/:id"
                element={
                  <ProtectedRoute allowedRoles={['IT_STAFF', 'ADMINISTRATOR']}>
                    <StaffTicketDetail />
                  </ProtectedRoute>
                }
              />

              {/* Protected Administrator Routes */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      </RequesterProvider>
    </AuthProvider>
  );
}

export default App;
