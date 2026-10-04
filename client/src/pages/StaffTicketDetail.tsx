import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface CommentNote {
  id: number;
  content: string;
  createdAt: string;
  author: UserInfo;
}

interface TicketDetail {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: string;
  itPriority: string;
  currentStatus: string;
  isRequesterResolved: boolean;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requester: UserInfo;
  owner: UserInfo | null;
  attachments: { id: number; originalName: string; fileType: string; fileSize: number }[];
  publicComments: CommentNote[];
  internalNotes: CommentNote[];
  createdAt: string;
  updatedAt: string;
}

export const StaffTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [staffMembers, setStaffMembers] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [activeTab, setActiveTab] = useState<'comments' | 'notes'>('comments');
  const [newComment, setNewComment] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isPostingNote, setIsPostingNote] = useState(false);

  const fetchTicketDetail = async () => {
    try {
      const res = await apiFetch(`/staff/tickets/${id}`);
      if (!res.ok) {
        throw new Error('Ticket not found or forbidden.');
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket detail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetail();

    // Fetch IT Staff members for assignment dropdown
    apiFetch('/staff/members')
      .then((res) => res.json())
      .then((data) => {
        if (data.staffMembers) setStaffMembers(data.staffMembers);
      })
      .catch(() => {});
  }, [id]);

  const handleClaim = async () => {
    if (!ticket || !user) return;
    try {
      const res = await apiFetch(`/staff/tickets/${ticket.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ ownerId: user.id }),
      });
      if (res.ok) {
        setSuccessMessage('Successfully claimed ticket ownership.');
        fetchTicketDetail();
      }
    } catch (err) {
      setError('Failed to claim ticket.');
    }
  };

  const handleAssignChange = async (ownerIdVal: string) => {
    if (!ticket) return;
    try {
      const target = ownerIdVal === 'unassigned' ? null : parseInt(ownerIdVal, 10);
      const res = await apiFetch(`/staff/tickets/${ticket.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ ownerId: target }),
      });
      if (res.ok) {
        setSuccessMessage('Ticket assignment updated.');
        fetchTicketDetail();
      }
    } catch (err) {
      setError('Failed to reassign ticket.');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;
    try {
      const res = await apiFetch(`/staff/tickets/${ticket.id}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ itPriority: newPriority }),
      });
      if (res.ok) {
        setSuccessMessage('IT Priority updated.');
        fetchTicketDetail();
      }
    } catch (err) {
      setError('Failed to update IT Priority.');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      const res = await apiFetch(`/staff/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSuccessMessage(`Status changed to ${newStatus.replace(/_/g, ' ')}.`);
        fetchTicketDetail();
      }
    } catch (err) {
      setError('Failed to update ticket status.');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !ticket) return;
    setIsPostingComment(true);
    try {
      const res = await apiFetch(`/tickets/${ticket.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment('');
        fetchTicketDetail();
      }
    } catch (err) {
      setError('Failed to post public comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !ticket) return;
    setIsPostingNote(true);
    try {
      const res = await apiFetch(`/tickets/${ticket.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (res.ok) {
        setNewNote('');
        fetchTicketDetail();
      }
    } catch (err) {
      setError('Failed to save internal note.');
    } finally {
      setIsPostingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-4 border-[#006B3C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-xl font-bold text-slate-800">{error || 'Ticket not found.'}</h2>
        <Link to="/staff/queue" className="inline-block bg-[#006B3C] text-white text-sm font-semibold px-4 py-2 rounded-xl">
          ← Back to Ticket Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <nav className="text-xs text-slate-500 flex items-center gap-2">
          <Link to="/staff/queue" className="hover:text-[#006B3C] font-medium">
            Ticket Queue
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{ticket.ticketNumber}</span>
        </nav>
        <button
          onClick={() => navigate('/staff/queue')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-sm"
        >
          ← Back to Queue
        </button>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>✅ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-800 hover:text-emerald-950 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header Operational Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-mono font-extrabold text-[#006B3C]">{ticket.ticketNumber}</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                Category: {ticket.category?.name}
              </span>
              {ticket.isRequesterResolved && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Requester Marked Resolved
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{ticket.summary}</h1>
          </div>

          {/* Action Selectors */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Ownership Control */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <span className="text-slate-500 font-semibold">Owner:</span>
              <select
                value={ticket.owner ? String(ticket.owner.id) : 'unassigned'}
                onChange={(e) => handleAssignChange(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg text-xs font-semibold p-1.5 outline-none focus:border-[#006B3C]"
              >
                <option value="unassigned">Unassigned</option>
                {staffMembers.map((sm) => (
                  <option key={sm.id} value={sm.id}>
                    {sm.fullName} ({sm.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
              {user && (!ticket.owner || ticket.owner.id !== user.id) && (
                <button
                  onClick={handleClaim}
                  className="bg-[#006B3C] hover:bg-[#00542f] text-white px-2.5 py-1.5 rounded-lg font-semibold shadow-sm transition-all"
                >
                  Claim
                </button>
              )}
            </div>

            {/* IT Priority Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <span className="text-slate-500 font-semibold">IT Priority:</span>
              <select
                value={ticket.itPriority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg text-xs font-semibold p-1.5 outline-none focus:border-[#006B3C]"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {/* Status Workflow Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <span className="text-slate-500 font-semibold">Status:</span>
              <select
                value={ticket.currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg text-xs font-semibold p-1.5 outline-none focus:border-[#006B3C]"
              >
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
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Ticket Details & Attachments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
              Description & System Metadata
            </h2>

            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/70 border border-slate-200/60 p-4 rounded-xl">
              {ticket.description}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <span className="text-slate-400 block font-medium">Requester</span>
                <span className="font-semibold text-slate-800">{ticket.requester?.fullName}</span>
                <span className="text-slate-400 block">{ticket.requester?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Related System</span>
                <span className="font-semibold text-slate-800">{ticket.relatedSystem?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Requested Priority</span>
                <span className="font-semibold text-slate-800">{ticket.requestedPriority}</span>
              </div>
            </div>

            {/* Attachments list */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h3 className="text-xs font-bold text-slate-700">Attachments ({ticket.attachments.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={`/api/attachments/${att.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs px-3 py-1.5 rounded-lg text-slate-700 font-medium transition-colors"
                    >
                      <span>📎</span>
                      <span>{att.originalName}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Tabs for Public Comments & Internal Notes */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            {/* Tab Controls */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-3 px-4 text-center transition-all ${
                  activeTab === 'comments'
                    ? 'bg-white border-b-2 border-[#006B3C] text-[#006B3C]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                💬 Public Comments ({ticket.publicComments?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-3 px-4 text-center transition-all ${
                  activeTab === 'notes'
                    ? 'bg-amber-50 border-b-2 border-amber-600 text-amber-900'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🔒 Internal Notes ({ticket.internalNotes?.length || 0})
              </button>
            </div>

            {/* Tab 1: Public Comments Timeline */}
            {activeTab === 'comments' && (
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {ticket.publicComments?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">No public comments yet.</p>
                  ) : (
                    ticket.publicComments.map((c) => (
                      <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex justify-between items-center text-slate-500">
                          <span className="font-bold text-slate-800">
                            {c.author?.fullName}{' '}
                            <span className="font-normal text-[10px] text-slate-400">({c.author?.role.replace('_', ' ')})</span>
                          </span>
                          <span className="text-[10px]">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-700">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handlePostComment} className="pt-2 border-t border-slate-100 space-y-2">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type public comment for requester..."
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 outline-none focus:border-[#006B3C]"
                  />
                  <button
                    type="submit"
                    disabled={isPostingComment || !newComment.trim()}
                    className="w-full bg-[#006B3C] hover:bg-[#00542f] text-white text-xs font-semibold py-2 rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {isPostingComment ? 'Posting...' : 'Post Public Comment'}
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Internal Notes Timeline */}
            {activeTab === 'notes' && (
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4 bg-amber-50/40">
                <div className="bg-amber-100/60 border border-amber-200 text-amber-900 text-[11px] p-2.5 rounded-lg flex items-center gap-2">
                  <span>🔒</span> Private operational notes visible ONLY to IT Staff & Admin.
                </div>

                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {ticket.internalNotes?.length === 0 ? (
                    <p className="text-xs text-amber-700/60 italic text-center py-6">No internal notes yet.</p>
                  ) : (
                    ticket.internalNotes.map((n) => (
                      <div key={n.id} className="bg-white border border-amber-200 rounded-xl p-3 text-xs space-y-1 shadow-2xs">
                        <div className="flex justify-between items-center text-amber-800">
                          <span className="font-bold text-slate-900">{n.author?.fullName}</span>
                          <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-800 font-sans">{n.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handlePostNote} className="pt-2 border-t border-amber-200/60 space-y-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Type confidential internal note..."
                    className="w-full text-xs rounded-xl border border-amber-300 p-2.5 outline-none focus:border-amber-600 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={isPostingNote || !newNote.trim()}
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold py-2 rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {isPostingNote ? 'Saving Note...' : 'Add Internal Note'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
