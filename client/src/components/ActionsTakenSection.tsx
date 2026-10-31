import React, { useState, useContext } from 'react';
import { apiFetch } from '../lib/api';
import { AuthContext } from '../context/AuthContext';

export interface ActionTaken {
  id: number;
  ticketId: number;
  actionDateTime: string;
  actionDescription: string;
  result: string;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
  performedBy: {
    id: number;
    fullName: string;
    role?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ActionsTakenSectionProps {
  ticketId: number;
  actions: ActionTaken[];
  readOnly?: boolean;
  onActionsUpdated: () => void;
}

export const ActionsTakenSection: React.FC<ActionsTakenSectionProps> = ({
  ticketId,
  actions,
  readOnly = false,
  onActionsUpdated,
}) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActionId, setEditingActionId] = useState<number | null>(null);

  // Form fields
  const [actionDateTime, setActionDateTime] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [result, setResult] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [attachmentNotes, setAttachmentNotes] = useState('');
  const [editUpdatedAt, setEditUpdatedAt] = useState<string | null>(null);

  // Status & validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [alertError, setAlertError] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  // Format current local time for datetime-local input
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  const openCreateForm = () => {
    setEditingActionId(null);
    setActionDateTime(getCurrentLocalDateTime());
    setActionDescription('');
    setResult('');
    setFollowUpRequired(false);
    setFollowUpNote('');
    setAttachmentNotes('');
    setEditUpdatedAt(null);
    setFieldErrors({});
    setAlertError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (action: ActionTaken) => {
    setEditingActionId(action.id);
    // Convert UTC to local format YYYY-MM-DDTHH:mm
    const dateObj = new Date(action.actionDateTime);
    const offset = dateObj.getTimezoneOffset();
    const local = new Date(dateObj.getTime() - offset * 60 * 1000);
    setActionDateTime(local.toISOString().slice(0, 16));

    setActionDescription(action.actionDescription);
    setResult(action.result);
    setFollowUpRequired(action.followUpRequired);
    setFollowUpNote(action.followUpNote || '');
    setAttachmentNotes(action.attachmentNotes || '');
    setEditUpdatedAt(action.updatedAt);
    setFieldErrors({});
    setAlertError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingActionId(null);
    setFieldErrors({});
    setAlertError(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!actionDateTime) {
      errors.actionDateTime = 'Action Date and Time is required.';
    } else {
      const selectedTime = new Date(actionDateTime).getTime();
      if (selectedTime > Date.now()) {
        errors.actionDateTime = 'Action Date and Time cannot be in the future.';
      }
    }

    if (!actionDescription.trim()) {
      errors.actionDescription = 'Action Description is required.';
    }

    if (!result.trim()) {
      errors.result = 'Result is required.';
    }

    if (followUpRequired && !followUpNote.trim()) {
      errors.followUpNote = 'Follow-Up Note is required when Follow-Up is requested.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);
    setAlertSuccess(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        actionDateTime: new Date(actionDateTime).toISOString(),
        actionDescription: actionDescription.trim(),
        result: result.trim(),
        followUpRequired,
        followUpNote: followUpRequired ? followUpNote.trim() : null,
        attachmentNotes: attachmentNotes.trim() ? attachmentNotes.trim() : null,
      };

      let res: Response;
      if (editingActionId) {
        if (editUpdatedAt) {
          payload.updatedAt = editUpdatedAt;
        }
        res = await apiFetch(`/tickets/${ticketId}/actions/${editingActionId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch(`/tickets/${ticketId}/actions`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (res.status === 409) {
        setAlertError('Conflict: This record was recently modified by another user. Please refresh and try again.');
        setIsSubmitting(false);
        return;
      }

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        }
        throw new Error(data.error || data.message || 'Failed to save action taken.');
      }

      setAlertSuccess(editingActionId ? 'Action Taken updated successfully.' : 'New Action Taken recorded.');
      closeForm();
      onActionsUpdated();
    } catch (err: any) {
      setAlertError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = (action: ActionTaken): boolean => {
    if (readOnly || !user) return false;
    if (user.role === 'ADMINISTRATOR') return true;
    return action.performedBy.id === user.id;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006B3C] font-bold flex items-center justify-center text-lg">
            🛠️
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Actions Taken
              <span className="text-xs bg-emerald-100 text-[#006B3C] px-2 py-0.5 rounded-full font-bold">
                {actions.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Audit log of technical actions, diagnostic steps, and resolutions
            </p>
          </div>
        </div>

        {!readOnly && (user?.role === 'IT_STAFF' || user?.role === 'ADMINISTRATOR') && !isFormOpen && (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#006B3C] text-white hover:bg-[#00542f] transition-all shadow-sm active:scale-95"
          >
            <span>+</span> Record Action
          </button>
        )}
      </div>

      {/* Global Alerts */}
      {alertSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span>✓ {alertSuccess}</span>
          <button onClick={() => setAlertSuccess(null)} className="text-emerald-600 font-bold hover:underline">
            ✕
          </button>
        </div>
      )}
      {alertError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <span>⚠️ {alertError}</span>
          <button onClick={() => setAlertError(null)} className="text-rose-600 font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Inline Form (Create / Edit) */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-50/80 border border-emerald-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold text-[#006B3C] uppercase tracking-wider">
              {editingActionId ? 'Edit Action Taken' : 'Record New Action Taken'}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Date / Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Action Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={actionDateTime}
                max={getCurrentLocalDateTime()}
                onChange={(e) => setActionDateTime(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#006B3C]/20 ${
                  fieldErrors.actionDateTime ? 'border-rose-400' : 'border-slate-300 focus:border-[#006B3C]'
                }`}
              />
              {fieldErrors.actionDateTime && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.actionDateTime}</p>
              )}
            </div>

            {/* Performed By (Derived from JWT, displayed read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Performed By
              </label>
              <input
                type="text"
                disabled
                value={`${user?.fullName || 'Current User'} (${user?.role || 'Staff'})`}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">Identity is automatically enforced from session token</span>
            </div>
          </div>

          {/* Action Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Action Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              placeholder="Detail the technical actions, configuration changes, or diagnostics executed..."
              className={`w-full px-3 py-2 text-xs border rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#006B3C]/20 ${
                fieldErrors.actionDescription ? 'border-rose-400' : 'border-slate-300 focus:border-[#006B3C]'
              }`}
            />
            {fieldErrors.actionDescription && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.actionDescription}</p>
            )}
          </div>

          {/* Result */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Result & Outcome <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="Observed result, error code change, or verified fix..."
              className={`w-full px-3 py-2 text-xs border rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#006B3C]/20 ${
                fieldErrors.result ? 'border-rose-400' : 'border-slate-300 focus:border-[#006B3C]'
              }`}
            />
            {fieldErrors.result && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.result}</p>
            )}
          </div>

          {/* Follow-Up Required Toggle */}
          <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Follow-Up Required?</span>
                <span className="text-[11px] text-slate-400">
                  Enable if additional testing, part delivery, or user confirmation is pending
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006B3C]"></div>
              </label>
            </div>

            {/* Conditional Follow-Up Note */}
            {followUpRequired && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Follow-Up Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Specify timeline, owner, or condition for follow-up verification..."
                  className={`w-full px-3 py-2 text-xs border rounded-xl bg-amber-50/50 outline-none focus:ring-2 focus:ring-amber-500/20 ${
                    fieldErrors.followUpNote ? 'border-rose-400' : 'border-amber-300 focus:border-amber-500'
                  }`}
                />
                {fieldErrors.followUpNote && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.followUpNote}</p>
                )}
              </div>
            )}
          </div>

          {/* Attachment Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attachment Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={attachmentNotes}
              onChange={(e) => setAttachmentNotes(e.target.value)}
              placeholder="e.g., Refer to attached multimeter_reading.png or server_log.txt"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:border-[#006B3C]"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#006B3C] text-white hover:bg-[#00542f] transition-all disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? 'Saving...' : editingActionId ? 'Update Action' : 'Save Action'}
            </button>
          </div>
        </form>
      )}

      {/* List of Actions */}
      {actions.length === 0 ? (
        <div className="text-center py-8 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl space-y-2">
          <div className="text-3xl">📋</div>
          <p className="text-xs font-semibold text-slate-600">No actions recorded yet.</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Technical activities performed on this ticket will appear here in chronological order.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((act, index) => (
            <div
              key={act.id}
              className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-emerald-300/80 transition-all shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    #{actions.length - index}
                  </span>
                  <span className="text-xs font-semibold text-slate-900">
                    {new Date(act.actionDateTime).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  <span className="text-xs text-slate-500">by</span>
                  <span className="text-xs font-bold text-[#006B3C] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {act.performedBy?.fullName || 'IT Staff'}
                  </span>
                  {act.followUpRequired && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>⏰</span> Follow-Up Required
                    </span>
                  )}
                </div>

                {canEdit(act) && (
                  <button
                    onClick={() => openEditForm(act)}
                    className="text-xs font-semibold text-[#006B3C] hover:text-[#00542f] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {/* Action Description */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Action Taken
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed mt-0.5">
                  {act.actionDescription}
                </p>
              </div>

              {/* Result */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                  Result / Outcome
                </span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap mt-0.5">
                  {act.result}
                </p>
              </div>

              {/* Follow-up Note */}
              {act.followUpRequired && act.followUpNote && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block flex items-center gap-1">
                    <span>📌</span> Follow-Up Instructions
                  </span>
                  <p className="text-xs text-amber-900 whitespace-pre-wrap mt-0.5">
                    {act.followUpNote}
                  </p>
                </div>
              )}

              {/* Attachment Notes */}
              {act.attachmentNotes && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-100">
                  <span className="text-slate-400">📎 Reference:</span>
                  <span className="font-medium text-slate-700">{act.attachmentNotes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionsTakenSection;
