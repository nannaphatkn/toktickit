import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface RecentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  requestedPriority: string;
  updatedAt: string;
}

interface RequesterDashboardData {
  openTickets: number;
  waitingForRequester: number;
  recentlyUpdated: number;
  recentlyResolved: number;
  recentTickets: RecentTicket[];
}

export const RequesterDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/dashboard/requester');
      if (!res.ok) {
        throw new Error('Unable to load requester dashboard data.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load your ticket dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    const map: Record<string, string> = {
      NEW: 'bg-sky-100 text-sky-800 border-sky-200',
      OPEN: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
      WAITING_FOR_REQUESTER: 'bg-purple-100 text-purple-800 border-purple-200',
      RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
      REOPENED: 'bg-orange-100 text-orange-800 border-orange-200',
      CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📋</span> My Support Requests Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of your IT support tickets, status updates, and action notifications for {user?.fullName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/create-ticket"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#006B3C] text-white hover:bg-[#00542f] transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <span>+</span> Create New Ticket
          </Link>
          <Link
            to="/my-tickets"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            View All Tickets
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl flex items-start gap-4">
          <span className="text-2xl">⚠️</span>
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Dashboard Error</h3>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-2 px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && data && (
        <>
          {/* 4 Metric Cards */}
          <section aria-label="Ticket Overview Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Open Tickets */}
            <div
              onClick={() => navigate('/my-tickets')}
              className="bg-white border border-slate-200 hover:border-[#006B3C] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Open Tickets
                </span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B3C] flex items-center justify-center text-sm font-bold">
                  🎫
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 group-hover:text-[#006B3C] transition-colors">
                  {data.openTickets}
                </span>
                <p className="text-xs text-slate-500 mt-1 font-medium">Currently active tickets</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-[#006B3C] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View tickets</span> →
              </div>
            </div>

            {/* 2. Waiting for You */}
            <div
              onClick={() => navigate('/my-tickets?status=WAITING_FOR_REQUESTER')}
              className="bg-white border border-slate-200 hover:border-purple-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Waiting for You
                </span>
                <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-sm font-bold">
                  💬
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-purple-700">
                  {data.waitingForRequester}
                </span>
                <p className="text-xs text-slate-500 mt-1 font-medium">IT Staff waiting for your reply</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-purple-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Provide feedback</span> →
              </div>
            </div>

            {/* 3. Recently Updated */}
            <div
              onClick={() => navigate('/my-tickets')}
              className="bg-white border border-slate-200 hover:border-cyan-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recently Updated
                </span>
                <span className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-sm font-bold">
                  🔔
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 group-hover:text-cyan-700 transition-colors">
                  {data.recentlyUpdated}
                </span>
                <p className="text-xs text-slate-500 mt-1 font-medium">Activity in the last 7 days</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-cyan-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View updates</span> →
              </div>
            </div>

            {/* 4. Recently Resolved */}
            <div
              onClick={() => navigate('/my-tickets?status=RESOLVED')}
              className="bg-white border border-slate-200 hover:border-emerald-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recently Resolved
                </span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-bold">
                  ✅
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-emerald-700">
                  {data.recentlyResolved}
                </span>
                <p className="text-xs text-slate-500 mt-1 font-medium">Fixed in the last 7 days</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View resolved tickets</span> →
              </div>
            </div>
          </section>

          {/* Section: Recent Tickets List */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>⏱️</span> Recent Ticket Updates
                </h2>
                <p className="text-xs text-slate-400">
                  Your tickets with activity in the last 7 days
                </p>
              </div>
              <Link
                to="/my-tickets"
                className="text-xs font-semibold text-[#006B3C] hover:underline"
              >
                View all tickets →
              </Link>
            </div>

            {!data.recentTickets || data.recentTickets.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <span className="text-3xl">📭</span>
                <p className="text-xs font-semibold text-slate-600">No tickets updated recently</p>
                <p className="text-[11px] text-slate-400">
                  When IT Staff works on your tickets, updates will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3 pl-2">Ticket #</th>
                      <th className="pb-3">Summary</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-2 text-right">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(data.recentTickets || []).map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/tickets/${t.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 pl-2 font-mono font-bold text-[#006B3C] group-hover:underline">
                          {t.ticketNumber}
                        </td>
                        <td className="py-3 font-medium text-slate-900 max-w-sm truncate">
                          {t.summary}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(
                              t.currentStatus
                            )}`}
                          >
                            {t.currentStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right text-slate-400 font-mono text-[11px]">
                          {new Date(t.updatedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default RequesterDashboard;
