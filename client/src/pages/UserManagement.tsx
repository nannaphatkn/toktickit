import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface UserRecord {
  id: number;
  fullName: string;
  email: string;
  role: 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR';
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [resettingUser, setResettingUser] = useState<UserRecord | null>(null);

  // Form states for Create User
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR'>('REQUESTER');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newInitialPassword, setNewInitialPassword] = useState('Password123!');
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for Edit User
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR'>('REQUESTER');
  const [editIsActive, setEditIsActive] = useState(true);

  // Form state for Reset Password
  const [resetPasswordVal, setResetPasswordVal] = useState('Password123!');

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter !== 'ALL') params.append('role', roleFilter);

      const res = await apiFetch(`/admin/users?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch user list.');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Error loading users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newFullName,
          email: newEmail,
          role: newRole,
          isActive: newIsActive,
          initialPassword: newInitialPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create user.');
        return;
      }
      setSuccessMessage(`User "${data.user.fullName}" created successfully.`);
      setShowCreateModal(false);
      resetCreateForm();
      fetchUsers();
    } catch (err) {
      setFormError('Network error creating user.');
    }
  };

  const resetCreateForm = () => {
    setNewFullName('');
    setNewEmail('');
    setNewRole('REQUESTER');
    setNewIsActive(true);
    setNewInitialPassword('Password123!');
    setFormError(null);
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditIsActive(u.isActive);
    setFormError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);
    try {
      const res = await apiFetch(`/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editFullName,
          email: editEmail,
          role: editRole,
          isActive: editIsActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to update user.');
        return;
      }
      setSuccessMessage(`User account "${data.user.fullName}" updated.`);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setFormError('Network error updating user.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setFormError(null);
    try {
      const res = await apiFetch(`/admin/users/${resettingUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ initialPassword: resetPasswordVal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to reset password.');
        return;
      }
      setSuccessMessage(`Initial password reset for ${resettingUser.fullName}. User must change password on next login.`);
      setResettingUser(null);
      setResetPasswordVal('Password123!');
      fetchUsers();
    } catch (err) {
      setFormError('Network error resetting password.');
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      REQUESTER: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      IT_STAFF: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      ADMINISTRATOR: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return badges[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>👥</span> User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administrator user accounts, role assignment, activation status, and password resets.
          </p>
        </div>
        <button
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="bg-[#006B3C] hover:bg-[#00542f] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <span>＋</span> Create New User
        </button>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>✅ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-800 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#006B3C]"
          />
          <button
            type="submit"
            className="bg-[#006B3C] text-white text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-300 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#006B3C]"
          >
            <option value="ALL">All Roles</option>
            <option value="REQUESTER">Requester</option>
            <option value="IT_STAFF">IT Staff</option>
            <option value="ADMINISTRATOR">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-4 border-[#006B3C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <span className="text-4xl">👤</span>
            <h3 className="text-lg font-bold text-slate-700">No users found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        {u.fullName}
                        {u.id === currentUser?.id && (
                          <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md border ${getRoleBadge(u.role)}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-100 text-rose-800">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setResettingUser(u)}
                        className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Create New User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Create New User Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Alex Thompson"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-[#006B3C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex.thompson@toktickit.com"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-[#006B3C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-[#006B3C]"
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={newInitialPassword}
                  onChange={(e) => setNewInitialPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-mono outline-none focus:border-[#006B3C]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * User will be forced to change this initial password on first login.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="createActive"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="rounded text-[#006B3C] focus:ring-[#006B3C]"
                />
                <label htmlFor="createActive" className="font-semibold text-slate-700">
                  Account is Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#006B3C] hover:bg-[#00542f] text-white font-semibold shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Edit User Account</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-[#006B3C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-[#006B3C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-[#006B3C]"
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded text-[#006B3C] focus:ring-[#006B3C]"
                />
                <label htmlFor="editActive" className="font-semibold text-slate-700">
                  Account is Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#006B3C] hover:bg-[#00542f] text-white font-semibold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset Password */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Reset Initial Password</h3>
              <button onClick={() => setResettingUser(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Reset initial password for <span className="font-bold text-slate-800">{resettingUser.fullName}</span>. The user will be required to change this password on their next login.
            </p>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Initial Password</label>
                <input
                  type="text"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-mono outline-none focus:border-[#006B3C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-semibold shadow-sm"
                >
                  Reset Initial Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
