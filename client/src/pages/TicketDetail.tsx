import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import RequesterPrompt from '../components/RequesterPrompt';
import { useRequester } from '../contexts/requesterContextCore';
import { apiFetch } from '../lib/api';

import { StatusBadge, PriorityBadge, type Priority, type TicketStatus } from '../components/TicketBadges';
import {
  MAX_ATTACHMENT_COUNT,
  formatFileSize,
  validateSingleFile,
} from '../lib/attachmentValidation';

interface NamedEntity {
  id: number;
  name: string;
}

interface TicketAttachment {
  id: number;
  originalName: string;
  fileType: string;
  fileSize: number;
  isRemoved: boolean;
  removalReason: string | null;
  removedAt: string | null;
  createdAt: string;
}

interface TicketDetailData {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: Priority;
  itPriority: Priority | null;
  currentStatus: TicketStatus;
  category: NamedEntity;
  relatedSystem: NamedEntity;
  requester: {
    id: number;
    name: string;
  };
  attachments: TicketAttachment[];
  createdAt: string;
  updatedAt: string;
}

interface ApiErrorPayload {
  error?: string;
}

interface DetailError {
  kind: 'not-found' | 'forbidden' | 'failure';
  message: string;
}

class ApiResponseError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiResponseError';
    this.status = status;
  }
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

async function responseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json() as ApiErrorPayload;
    return typeof payload.error === 'string' ? payload.error : fallback;
  } catch {
    return fallback;
  }
}

function TicketDetailLoading() {
  return (
    <div className="container ticket-detail-page my-4 my-md-5">
      <div className="ticket-detail-skeleton" aria-hidden="true">
        <span className="ticket-skeleton-line ticket-skeleton-kicker" />
        <span className="ticket-skeleton-line ticket-skeleton-title" />
        <div className="ticket-skeleton-panel">
          <span className="ticket-skeleton-line ticket-skeleton-heading" />
          <div className="ticket-skeleton-fields">
            {Array.from({ length: 6 }, (_, index) => <span className="ticket-skeleton-line" key={index} />)}
          </div>
          <span className="ticket-skeleton-line ticket-skeleton-copy" />
          <span className="ticket-skeleton-line ticket-skeleton-copy ticket-skeleton-copy-short" />
        </div>
        <div className="ticket-skeleton-panel">
          <span className="ticket-skeleton-line ticket-skeleton-heading" />
          <span className="ticket-skeleton-line ticket-skeleton-attachment" />
        </div>
      </div>
      <span className="visually-hidden">Loading ticket details…</span>
    </div>
  );
}

export default function TicketDetail() {
  const { requester } = useRequester();
  const { id: ticketId } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DetailError | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [removalTarget, setRemovalTarget] = useState<TicketAttachment | null>(null);
  const [removalReason, setRemovalReason] = useState('');
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setTicket(null);
    setError(null);

    if (!requester || !ticketId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    apiFetch(`/tickets/${encodeURIComponent(ticketId)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const message = await responseErrorMessage(response, 'Unable to load ticket');
          throw new ApiResponseError(message, response.status);
        }
        return response.json() as Promise<TicketDetailData>;
      })
      .then((payload) => {
        if (!payload || typeof payload !== 'object' || !Array.isArray(payload.attachments)) {
          throw new Error('Invalid ticket detail response');
        }
        setTicket(payload);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name === 'AbortError') return;

        const responseError = loadError instanceof ApiResponseError ? loadError : null;
        const kind: DetailError['kind'] = responseError?.status === 404
          ? 'not-found'
          : responseError?.status === 401 || responseError?.status === 403
            ? 'forbidden'
            : 'failure';
        setTicket(null);
        setError({
          kind,
          message: loadError instanceof Error ? loadError.message : 'Unable to load ticket',
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [requester, reloadCount, ticketId]);

  const refresh = () => setReloadCount((count) => count + 1);

  const handleAttachmentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !ticket) return;

    const activeCount = ticket.attachments.filter((attachment) => !attachment.isRemoved).length;
    if (activeCount >= MAX_ATTACHMENT_COUNT) {
      setUploadError('A ticket can have at most 5 active attachments.');
      return;
    }

    const validationError = validateSingleFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiFetch(`/tickets/${encodeURIComponent(ticket.id)}/attachments`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        setUploadError(await responseErrorMessage(response, 'Unable to upload attachment'));
        return;
      }
      refresh();
    } catch {
      setUploadError('Unable to upload attachment. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: TicketAttachment) => {
    setDownloadError(null);
    setDownloadingId(attachment.id);
    try {
      const response = await apiFetch(`/attachments/${attachment.id}/download`);
      if (!response.ok) {
        setDownloadError(await responseErrorMessage(response, 'Unable to download attachment'));
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError('Unable to download attachment. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const openRemovalDialog = (attachment: TicketAttachment) => {
    setRemovalTarget(attachment);
    setRemovalReason('');
    setRemovalError(null);
  };

  const closeRemovalDialog = () => {
    if (removing) return;
    setRemovalTarget(null);
    setRemovalReason('');
    setRemovalError(null);
  };

  const confirmRemoval = async () => {
    if (!removalTarget) return;
    const trimmedReason = removalReason.trim();
    if (trimmedReason.length < 3 || trimmedReason.length > 500) {
      setRemovalError('Removal reason must be between 3 and 500 characters.');
      return;
    }

    setRemoving(true);
    setRemovalError(null);
    try {
      const response = await apiFetch(`/attachments/${removalTarget.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ removalReason: trimmedReason }),
      });
      if (!response.ok) {
        setRemovalError(await responseErrorMessage(response, 'Unable to remove attachment'));
        return;
      }
      setRemovalTarget(null);
      setRemovalReason('');
      setRemovalError(null);
      refresh();
    } catch {
      setRemovalError('Unable to remove attachment. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  if (!requester) {
    return (
      <RequesterPrompt
        title="⚠️ Please Select a Requester"
        message="Please select a Development Requester before viewing this ticket."
      />
    );
  }

  if (loading) {
    return (
      <div role="status" aria-live="polite">
        <TicketDetailLoading />
      </div>
    );
  }

  if (error || !ticket || ticket.requester.id !== requester.id) {
    const isForbidden = error?.kind === 'forbidden' || (ticket && ticket.requester.id !== requester.id);
    const title = error?.kind === 'not-found'
      ? 'Ticket not found'
      : isForbidden
        ? 'Ticket unavailable'
        : 'Unable to load ticket';
    return (
      <div className="container ticket-detail-page my-4 my-md-5">
        <div className="ticket-state" role="alert">
          <div className="ticket-state-icon" aria-hidden="true">⚠️</div>
          <h1 className="h4">{title}</h1>
          <p className="text-muted">
            {isForbidden
              ? 'You do not have access to this ticket'
              : error?.message ?? 'The requested ticket could not be loaded.'}
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            {error?.kind === 'failure' && !isForbidden && (
              <button type="button" className="btn btn-zen-secondary" onClick={refresh}>Retry</button>
            )}
            <Link to="/my-tickets" className="btn btn-zen-primary">Back to My Tickets</Link>
          </div>
        </div>
      </div>
    );
  }

  const activeAttachments = ticket.attachments.filter((attachment) => !attachment.isRemoved);
  const removedAttachments = ticket.attachments.filter((attachment) => attachment.isRemoved);

  return (
    <div className="container ticket-detail-page my-4 my-md-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
        <div>
          <p className="section-kicker mb-1">Ticket detail</p>
          <h1 className="h2 mb-1">{ticket.ticketNumber}</h1>
          <p className="text-muted mb-0">Read-only view for {requester.name}</p>
        </div>
        <Link to="/my-tickets" className="btn btn-zen-secondary">← Back to My Tickets</Link>
      </div>

      <section className="ticket-detail-panel mb-4" aria-labelledby="ticket-information-heading">
        <div className="ticket-detail-panel-header">
          <div>
            <p className="section-kicker mb-1">Request information</p>
            <h2 id="ticket-information-heading" className="h4 mb-0">{ticket.summary}</h2>
          </div>
          <div className="d-flex flex-wrap gap-2" aria-label="Ticket status and priority">
            <StatusBadge status={ticket.currentStatus} />
            <PriorityBadge priority={ticket.requestedPriority} />
          </div>
        </div>

        <dl className="ticket-detail-fields">
          <div><dt>Ticket Number</dt><dd>{ticket.ticketNumber}</dd></div>
          <div><dt>Requester</dt><dd>{ticket.requester.name}</dd></div>
          <div><dt>Category</dt><dd>{ticket.category.name}</dd></div>
          <div><dt>Related System</dt><dd>{ticket.relatedSystem.name}</dd></div>
          <div><dt>Requested Priority</dt><dd><PriorityBadge priority={ticket.requestedPriority} /></dd></div>
          <div><dt>IT Priority</dt><dd>{ticket.itPriority ? <PriorityBadge priority={ticket.itPriority} /> : 'Not assigned'}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge status={ticket.currentStatus} /></dd></div>
          <div><dt>Created</dt><dd>{formatDateTime(ticket.createdAt)}</dd></div>
          <div><dt>Last Updated</dt><dd>{formatDateTime(ticket.updatedAt)}</dd></div>
        </dl>

        <div className="ticket-detail-copy">
          <div>
            <h3 className="h6">Summary</h3>
            <p>{ticket.summary}</p>
          </div>
          <div>
            <h3 className="h6">Description</h3>
            <p className="detail-description">{ticket.description}</p>
          </div>
        </div>
      </section>

      <section className="ticket-detail-panel" aria-labelledby="attachments-heading">
        <div className="ticket-detail-panel-header">
          <div>
            <p className="section-kicker mb-1">Files</p>
            <h2 id="attachments-heading" className="h4 mb-1">Attachments</h2>
            <p className="text-muted mb-0">{activeAttachments.length} of {MAX_ATTACHMENT_COUNT} active attachments</p>
          </div>
          <label
            className={`btn btn-zen-primary attachment-add-control ${activeAttachments.length >= MAX_ATTACHMENT_COUNT || uploading ? 'attachment-add-control-disabled' : ''}`}
            htmlFor="attachment-picker"
            aria-disabled={activeAttachments.length >= MAX_ATTACHMENT_COUNT || uploading}
          >
            {uploading ? 'Uploading…' : '＋ Add attachment'}
            <input
              id="attachment-picker"
              className="visually-hidden"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleAttachmentUpload}
              disabled={activeAttachments.length >= MAX_ATTACHMENT_COUNT || uploading}
            />
          </label>
        </div>

        <p className="attachment-help">JPG, JPEG, PNG, WEBP, or PDF · maximum 5 MB per file</p>
        {uploadError && <div className="ticket-inline-error" role="alert">{uploadError}</div>}
        {downloadError && <div className="ticket-inline-error" role="alert">{downloadError}</div>}

        {ticket.attachments.length === 0 && (
          <div className="attachment-empty">No attachments have been added to this ticket.</div>
        )}

        <div className="attachment-list" aria-live="polite">
          {activeAttachments.map((attachment) => (
            <article className="attachment-row" key={attachment.id}>
              <div className="attachment-file-icon" aria-hidden="true">📎</div>
              <div className="attachment-file-info">
                <strong className="attachment-file-name">{attachment.originalName}</strong>
                <span>{formatFileSize(attachment.fileSize)} · Uploaded {formatDateTime(attachment.createdAt)}</span>
              </div>
              <div className="attachment-actions">
                <button
                  type="button"
                  className="btn btn-zen-primary btn-sm"
                  onClick={() => handleDownload(attachment)}
                  disabled={downloadingId === attachment.id}
                >
                  {downloadingId === attachment.id ? 'Downloading…' : 'Download'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm attachment-remove-button"
                  onClick={() => openRemovalDialog(attachment)}
                  aria-label="Remove attachment"
                  title="Remove attachment"
                >
                  🗑️
                </button>
              </div>
            </article>
          ))}

          {removedAttachments.map((attachment) => (
            <article className="attachment-row attachment-row-removed" key={attachment.id} title="Removed – not downloadable">
              <div className="attachment-file-icon" aria-hidden="true">📎</div>
              <div className="attachment-file-info">
                <strong className="attachment-file-name">{attachment.originalName}</strong>
                <span>{formatFileSize(attachment.fileSize)} · Uploaded {formatDateTime(attachment.createdAt)}</span>
                <span className="attachment-removal-detail">
                  Removed {attachment.removedAt ? formatDateTime(attachment.removedAt) : 'previously'}
                  {attachment.removalReason ? ` · Reason: ${attachment.removalReason}` : ''}
                </span>
              </div>
              <span className="attachment-removed-badge" aria-label="Removed – not downloadable">Removed</span>
            </article>
          ))}
        </div>
      </section>

      {removalTarget && (
        <div className="attachment-modal-backdrop" role="presentation">
          <div className="attachment-modal" role="dialog" aria-modal="true" aria-labelledby="remove-attachment-heading">
            <h2 id="remove-attachment-heading" className="h4">Remove attachment?</h2>
            <p className="text-muted">This keeps the attachment record for audit history but disables future downloads.</p>
            <p className="fw-semibold text-break">{removalTarget.originalName}</p>
            <label htmlFor="removal-reason" className="form-label fw-semibold">Reason <span className="required-star">*</span></label>
            <textarea
              id="removal-reason"
              className={`form-control ${removalError ? 'is-invalid' : ''}`}
              rows={4}
              value={removalReason}
              onChange={(event) => setRemovalReason(event.target.value)}
              placeholder="Why should this attachment be removed?"
              maxLength={500}
              disabled={removing}
            />
            {removalError && <div className="invalid-feedback d-block" role="alert">{removalError}</div>}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-zen-secondary" onClick={closeRemovalDialog} disabled={removing}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmRemoval} disabled={removing}>
                {removing ? 'Removing…' : 'Confirm removal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
