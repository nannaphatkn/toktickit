import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  requestedPriority: string;
  itPriority: string;
  currentStatus: string;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requester: { id: number; fullName: string; email: string };
  owner: { id: number; fullName: string; email: string } | null;
  createdAt: string;
  _count?: { publicComments: number; internalNotes: number; attachments: number };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const StaffQueue: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch categories for filter dropdown
    apiFetch('/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const fetchTickets = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '10');
      if (search.trim()) params.append('search', search.trim());
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (ownerFilter !== 'all') params.append('owner', ownerFilter);

      const res = await apiFetch(`/staff/tickets?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch tickets.');
      }
      const data = await res.json();
      setTickets(data.tickets || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err: any) {
      setError(err.message || 'Error loading ticket queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1);
  }, [categoryFilter, statusFilter, priorityFilter, ownerFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets(1);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      NEW: 'bg-sky-100 text-sky-800 border-sky-300',
      OPEN: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-300',
      WAITING_FOR_REQUESTER: 'bg-purple-100 text-purple-800 border-purple-300',
      RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      CLOSED: 'bg-slate-100 text-slate-700 border-slate-300',
      REOPENED: 'bg-orange-100 text-orange-800 border-orange-300',
      CANCELLED: 'bg-rose-100 text-rose-800 border-rose-300',
    };
    return badges[status] || 'bg-slate-100 text-slate-700';
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      LOW: 'bg-slate-100 text-slate-700',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-amber-100 text-amber-800 font-medium',
      URGENT: 'bg-rose-100 text-rose-800 font-bold',
    };
    return badges[priority] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>📥</span> IT Staff Ticket Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage incoming tickets, assign ownership, update priorities, and monitor status workflow.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
          <span>Total Tickets:</span>
          <span className="bg-[#006B3C] text-white px-2 py-0.5 rounded-full text-xs font-bold">
            {pagination.total}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket #, summary, or requester name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#006B3C] focus:ring-2 focus:ring-[#006B3C]/20 outline-none"
            />
            <span className="absolute left-3 top-3 text-slate-400 text-sm">🔍</span>
          </div>
          <button
            type="submit"
            className="bg-[#006B3C] hover:bg-[#00542f] text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs font-semibold">
          <div>
            <label className="block text-slate-500 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-[#006B3C]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-[#006B3C]"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="WAITING_FOR_REQUESTER">WAITING_FOR_REQUESTER</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REOPENED">REOPENED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">IT Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-[#006B3C]"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Ownership</label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-[#006B3C]"
            >
              <option value="all">All Ownership</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Tickets Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-4 border-[#006B3C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Loading ticket queue...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <span className="text-4xl">📭</span>
            <h3 className="text-lg font-bold text-slate-700">No tickets found</h3>
            <p className="text-sm text-slate-500">No tickets matched your current search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ticket No.</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Summary</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">IT Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/staff/tickets/${t.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#006B3C]">{t.ticketNumber}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {t.summary}
                      <div className="text-xs text-slate-400 font-normal">
                        by {t.requester?.fullName || 'Requester'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{t.category?.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${getPriorityBadge(t.itPriority)}`}>
                        {t.itPriority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusBadge(t.currentStatus)}`}>
                        {t.currentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {t.owner ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                          <span>👤</span> {t.owner.fullName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/staff/tickets/${t.id}`);
                        }}
                        className="text-xs font-semibold text-[#006B3C] hover:text-[#00542f] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        View Detail →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing Page <span className="font-bold">{pagination.page}</span> of{' '}
              <span className="font-bold">{pagination.totalPages}</span> ({pagination.total} items)
            </div>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchTickets(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 font-medium"
              >
                ← Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTickets(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 font-medium"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
