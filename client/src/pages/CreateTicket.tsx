import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { apiFetch } from '../lib/api';
import { useRequester } from '../contexts/requesterContextCore';
import RequesterPrompt from '../components/RequesterPrompt';

interface Category {
  id: number;
  name: string;
}

interface RelatedSystem {
  id: number;
  name: string;
}

import { validateFileList } from '../lib/attachmentValidation';

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];

export default function CreateTicket() {
  const { requester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<RelatedSystem[]>([]);

  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [relatedSystemId, setRelatedSystemId] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [attachments, setAttachments] = useState<FileList | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Load categories and related systems
  useEffect(() => {
    if (!requester) {
      setCategories([]);
      setSystems([]);
      return;
    }

    apiFetch('/categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));

    apiFetch('/related-systems')
      .then(res => res.json())
      .then(data => setSystems(Array.isArray(data) ? data : []))
      .catch(() => setSystems([]));
  }, [requester]);

  const validate = (): { globalErrors: string[]; fields: Record<string, string> } => {
    const global: string[] = [];
    const fields: Record<string, string> = {};
    const addFieldError = (field: string, message: string) => {
      fields[field] ??= message;
      global.push(message);
    };

    const trimmedSummary = summary.trim();
    if (!trimmedSummary) {
      addFieldError('summary', 'Summary is required.');
    } else if (trimmedSummary.length < 10 || trimmedSummary.length > 150) {
      addFieldError('summary', 'Summary must be between 10 and 150 characters.');
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      addFieldError('description', 'Description is required.');
    } else if (trimmedDesc.length < 20 || trimmedDesc.length > 1000) {
      addFieldError('description', 'Description must be between 20 and 1000 characters.');
    }

    if (!categoryId) {
      addFieldError('categoryId', 'Please select a Category.');
    }

    if (!relatedSystemId) {
      addFieldError('relatedSystemId', 'Please select a Related System.');
    }

    if (!PRIORITY_OPTIONS.includes(priority)) {
      addFieldError('priority', 'Invalid priority selected.');
    }

    validateFileList(attachments).forEach((message) => addFieldError('attachments', message));

    return { globalErrors: global, fields };
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const { fields } = validate();
    setFieldErrors(fields);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    const attachmentErrors = validateFileList(selectedFiles);
    setAttachments(selectedFiles);
    setTouched(prev => ({ ...prev, attachments: true }));
    setFieldErrors(prev => {
      const copy = { ...prev };
      if (attachmentErrors.length > 0) {
        copy.attachments = attachmentErrors[0];
      } else {
        delete copy.attachments;
      }
      return copy;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMsg('');

    const { globalErrors, fields } = validate();
    if (globalErrors.length > 0) {
      setErrors(globalErrors);
      setFieldErrors(fields);
      setTouched({
        summary: true,
        description: true,
        categoryId: true,
        relatedSystemId: true,
        priority: true,
        attachments: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append('summary', summary.trim());
    formData.append('description', description.trim());
    formData.append('categoryId', categoryId);
    formData.append('relatedSystemId', relatedSystemId);
    formData.append('requestedPriority', priority);

    if (attachments) {
      Array.from(attachments).forEach(file => {
        formData.append('attachments', file);
      });
    }

    try {
      setSubmitting(true);
      const res = await apiFetch('/tickets', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const message = typeof data.error === 'string'
          ? data.error
          : typeof data.details?.message === 'string'
            ? data.details.message
            : 'Failed to create ticket.';
        setErrors([message]);
        return;
      }

      setSuccessMsg(`Ticket created successfully! Official Ticket Number: ${data.ticketNumber}`);
      // Reset form
      setSummary('');
      setDescription('');
      setCategoryId('');
      setRelatedSystemId('');
      setPriority('LOW');
      setAttachments(null);
      setTouched({});
      setFieldErrors({});
      const fileInput = document.getElementById('attachment-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch {
      setErrors(['Unexpected error while creating ticket. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (!requester) {
    return (
      <RequesterPrompt
        title="⚠️ Please Select a Requester"
        message="Please select a Development Requester from the dropdown in the navigation bar before creating a ticket."
      />
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-3" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="card-body">
              <h2 className="mb-2" style={{ color: 'var(--primary)' }}>📝 Create New Ticket</h2>
              <p className="text-muted small mb-4">
                Fill out the details below to submit a support request. Fields marked with <span className="required-star">*</span> are required.
              </p>

              {errors.length > 0 && (
                <div className="alert alert-danger" role="alert">
                  <strong className="d-block mb-1">Please correct the following errors:</strong>
                  <ul className="mb-0 ps-3">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success" role="alert" style={{ backgroundColor: '#E8F5E9', borderColor: 'var(--success)', color: 'var(--primary)' }}>
                  <strong>{successMsg}</strong>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Summary */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <label htmlFor="summary" className="form-label fw-semibold">
                      Summary <span className="required-star">*</span>
                    </label>
                    <span className="text-muted small">{summary.trim().length}/150</span>
                  </div>
                  <input
                    type="text"
                    className={`form-control ${touched.summary && fieldErrors.summary ? 'is-invalid' : ''}`}
                    id="summary"
                    placeholder="Brief summary of the issue (10–150 characters)"
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    onBlur={() => handleBlur('summary')}
                    required
                  />
                  {touched.summary && fieldErrors.summary ? (
                    <div className="invalid-feedback">{fieldErrors.summary}</div>
                  ) : (
                    <div className="form-text">Must be between 10 and 150 characters.</div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <label htmlFor="description" className="form-label fw-semibold">
                      Description <span className="required-star">*</span>
                    </label>
                    <span className="text-muted small">{description.trim().length}/1000</span>
                  </div>
                  <textarea
                    className={`form-control ${touched.description && fieldErrors.description ? 'is-invalid' : ''}`}
                    id="description"
                    rows={4}
                    placeholder="Detailed explanation of the problem or request (20–1000 characters)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    onBlur={() => handleBlur('description')}
                    required
                  />
                  {touched.description && fieldErrors.description ? (
                    <div className="invalid-feedback">{fieldErrors.description}</div>
                  ) : (
                    <div className="form-text">Must be between 20 and 1000 characters.</div>
                  )}
                </div>

                {/* Category & Related System */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="category" className="form-label fw-semibold">
                      Category <span className="required-star">*</span>
                    </label>
                    <select
                      className={`form-select ${touched.categoryId && fieldErrors.categoryId ? 'is-invalid' : ''}`}
                      id="category"
                      value={categoryId}
                      onChange={e => setCategoryId(e.target.value)}
                      onBlur={() => handleBlur('categoryId')}
                      required
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {touched.categoryId && fieldErrors.categoryId && (
                      <div className="invalid-feedback">{fieldErrors.categoryId}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="relatedSystem" className="form-label fw-semibold">
                      Related System <span className="required-star">*</span>
                    </label>
                    <select
                      className={`form-select ${touched.relatedSystemId && fieldErrors.relatedSystemId ? 'is-invalid' : ''}`}
                      id="relatedSystem"
                      value={relatedSystemId}
                      onChange={e => setRelatedSystemId(e.target.value)}
                      onBlur={() => handleBlur('relatedSystemId')}
                      required
                    >
                      <option value="">-- Select System --</option>
                      {systems.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {touched.relatedSystemId && fieldErrors.relatedSystemId && (
                      <div className="invalid-feedback">{fieldErrors.relatedSystemId}</div>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="mb-3">
                  <label htmlFor="priority" className="form-label fw-semibold">
                    Requested Priority <span className="required-star">*</span>
                  </label>
                  <select
                    className={`form-select ${touched.priority && fieldErrors.priority ? 'is-invalid' : ''}`}
                    id="priority"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    onBlur={() => handleBlur('priority')}
                    required
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {touched.priority && fieldErrors.priority && (
                    <div className="invalid-feedback">{fieldErrors.priority}</div>
                  )}
                </div>

                {/* Attachments */}
                <div className="mb-4">
                  <label htmlFor="attachment-input" className="form-label fw-semibold">
                    Attachments (Optional)
                  </label>
                  <input
                    className={`form-control ${fieldErrors.attachments ? 'is-invalid' : ''}`}
                    type="file"
                    id="attachment-input"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                  />
                  {fieldErrors.attachments ? (
                    <div className="invalid-feedback">{fieldErrors.attachments}</div>
                  ) : (
                    <div className="form-text">
                      Max 5 files. Allowed formats: JPG, PNG, WEBP, PDF (Up to 5 MB each).
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-zen-primary px-4 py-2"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
