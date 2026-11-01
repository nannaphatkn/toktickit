import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface RecentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  itPriority: string;
  updatedAt: string;
  owner?: { id: number; fullName: string } | null;
  requester?: { id: number; fullName: string; email: string };
}

interface StaffDashboardData {
  unassigned: number;
  myTickets: number;
  openInProgress: number;
  urgentPriority: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  recentTickets: RecentTicket[];
}

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/dashboard/staff');
      if (res.status === 403) {
        throw new Error('Access Denied: IT Staff or Administrator role required.');
      }
      if (!res.ok) {
        throw new Error('Unable to load dashboard data. Please try again.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard. Please try again.');
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

  const getPriorityBadgeClass = (priority: string) => {
    const map: Record<string, string> = {
      LOW: 'bg-slate-100 text-slate-700 border-slate-200',
      MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
      HIGH: 'bg-amber-100 text-amber-800 border-amber-200',
      URGENT: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    };
    return map[priority] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📊</span> IT Staff Service Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time queue metrics, workload tracking, and priority ticket monitors for {user?.fullName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>🔄</span> Refresh
          </button>
          <Link
            to="/staff/queue"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#006B3C] text-white hover:bg-[#00542f] transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <span>📥</span> Open Ticket Queue
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
              <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      )}

      {/* Main Dashboard Content */}
      {!isLoading && !error && data && (
        <>
          {/* Section 1: 4 Key Metric Cards */}
          <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Unassigned Tickets */}
            <div
              onClick={() => navigate('/staff/queue?owner=unassigned')}
              className="bg-white border border-slate-200 hover:border-amber-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Unassigned
                </span>
                <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                  ⚡
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                  {data.unassigned}
                </span>
                <p className="text-xs text-slate-500 mt-1 font-medium">Tickets requiring ownership claim</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-amber-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View unassigned tickets</span> →
              </div>
            </div>

            {/* 2. My Tickets */}
            <div
              onClick={() => navigate('/staff/queue?owner=me')}
              className="bg-white border border-slate-200 hover:border-[#006B3C] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  My Assigned
                </span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B3C] flex items-center justify-center text-sm font-bold">
                  👤
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 group-hover:text-[#006B3C] transition-colors">
                  {data.myTickets}
                </span>
                <p className="text-xs text-slate-500 mt-1 font-medium">Active tickets owned by you</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-[#006B3C] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View my tickets</span> →
              </div>
            </div>

            {/* 3. Open / In Progress */}
            <div
              onClick={() => navigate('/staff/queue?status=OPEN,IN_PROGRESS')}
              className="bg-white border border-slate-200 hover:border-cyan-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Open / In Progress
                </span>
                <span className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-sm font-bold">
                  🔄
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 group-hover:text-cyan-700 transition-colors">
                  {data.openInProgress}
                </span>
                <p className="text-xs text-slate-500 mt-1 font-medium">Currently active in workload</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-cyan-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View active workload</span> →
              </div>
            </div>

            {/* 4. Urgent Priority */}
            <div
              onClick={() => navigate('/staff/queue?priority=URGENT')}
              className="bg-white border border-slate-200 hover:border-rose-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Urgent Priority
                </span>
                <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-bold">
                  🚨
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                  {data.urgentPriority}
                </span>
                <p className="text-xs text-slate-500 mt-1 font-medium">Highest severity tickets</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-rose-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View urgent tickets</span> →
              </div>
            </div>
          </section>

          {/* Section 2: Ticket Status Breakdown */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Ticket Status Breakdown
                </h2>
                <p className="text-xs text-slate-400">
                  Click on any status pill to filter the ticket queue directly
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Total:{' '}
                {Object.values(data.byStatus).reduce((a, b) => a + b, 0)} tickets
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: 'New', key: 'NEW' },
                { label: 'Open', key: 'OPEN' },
                { label: 'In Progress', key: 'IN_PROGRESS' },
                { label: 'Waiting Req.', key: 'WAITING_FOR_REQUESTER' },
                { label: 'Resolved', key: 'RESOLVED' },
                { label: 'Closed', key: 'CLOSED' },
                { label: 'Reopened', key: 'REOPENED' },
                { label: 'Cancelled', key: 'CANCELLED' },
              ].map(({ label, key }) => {
                const count = data.byStatus[key] || 0;
                return (
                  <button
                    key={key}
                    onClick={() => navigate(`/staff/queue?status=${key}`)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-[#006B3C] bg-slate-50 hover:bg-emerald-50/50 transition-all text-center group active:scale-95"
                  >
                    <span className="text-xl font-black text-slate-900 group-hover:text-[#006B3C]">
                      {count}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 mt-1 truncate max-w-full">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 3: Recent Activity (Tickets updated in last 7 days) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>⏱️</span> Recent Ticket Activity
                </h2>
                <p className="text-xs text-slate-400">
                  Tickets updated within the last 7 calendar days
                </p>
              </div>
              <Link
                to="/staff/queue"
                className="text-xs font-semibold text-[#006B3C] hover:underline"
              >
                View all in queue →
              </Link>
            </div>

            {!data.recentTickets || data.recentTickets.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <span className="text-3xl">📭</span>
                <p className="text-xs font-semibold text-slate-600">No recent ticket updates</p>
                <p className="text-[11px] text-slate-400">
                  Tickets updated within the last 7 days will appear here.
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
                      <th className="pb-3">Priority</th>
                      <th className="pb-3">Assigned To</th>
                      <th className="pb-3 pr-2 text-right">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(data.recentTickets || []).map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/staff/tickets/${t.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 pl-2 font-mono font-bold text-[#006B3C] group-hover:underline">
                          {t.ticketNumber}
                        </td>
                        <td className="py-3 font-medium text-slate-900 max-w-xs truncate">
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
                        <td className="py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getPriorityBadgeClass(
                              t.itPriority
                            )}`}
                          >
                            {t.itPriority}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {t.owner ? t.owner.fullName : <span className="text-amber-600 italic">Unassigned</span>}
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

export default StaffDashboard;
