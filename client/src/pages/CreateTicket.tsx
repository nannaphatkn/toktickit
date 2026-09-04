import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { apiFetch } from '../lib/api';
import { useRequester } from '../contexts/RequesterContext';

interface Category {
  id: string;
  name: string;
}

interface RelatedSystem {
  id: number;
  name: string;
}

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

  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Load reference data
  useEffect(() => {
    apiFetch('/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setCategories([]));
    apiFetch('/related-systems')
      .then(res => res.json())
      .then(data => setSystems(data))
      .catch(() => setSystems([]));
  }, []);

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!summary.trim() || summary.length < 10 || summary.length > 150) {
      errs.push('Summary must be between 10 and 150 characters.');
    }
    if (!description.trim() || description.length < 20 || description.length > 1000) {
      errs.push('Description must be between 20 and 1000 characters.');
    }
    if (!categoryId) {
      errs.push('Please select a Category.');
    }
    if (!relatedSystemId) {
      errs.push('Please select a Related System.');
    }
    if (!PRIORITY_OPTIONS.includes(priority)) {
      errs.push('Invalid priority selected.');
    }
    if (attachments) {
      if (attachments.length > 5) {
        errs.push('You can attach up to 5 files only.');
      }
      Array.from(attachments).forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          errs.push(`File "${file.name}" exceeds 5 MiB limit.`);
        }
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowed.includes(file.type)) {
          errs.push(`File "${file.name}" has an unsupported type (${file.type}).`);
        }
      });
    }
    return errs;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAttachments(e.target.files);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMsg('');

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
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
      const res = await apiFetch('/tickets', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors([data.error || 'Failed to create ticket.']);
        return;
      }
      const ticket = await res.json();
      setSuccessMsg(`Ticket created successfully! Ticket Number: ${ticket.ticketNumber}`);
      // reset form
      setSummary('');
      setDescription('');
      setCategoryId('');
      setRelatedSystemId('');
      setPriority('LOW');
      setAttachments(null);
      const fileInput = document.getElementById('attachment-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setErrors(['Unexpected error while creating ticket.']);
    }
  };

  if (!requester) return null;

  return (
    <div className="container mt-4">
      <h2 className="mb-4" style={{ color: '#006B3C' }}>📝 Create New Ticket</h2>
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert">
          <ul className="mb-0">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" role="alert">
          {successMsg}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="summary" className="form-label">Summary</label>
          <input type="text" className="form-control" id="summary" value={summary} onChange={e => setSummary(e.target.value)} required />
          <div className="form-text">10‑150 characters</div>
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea className="form-control" id="description" rows={4} value={description} onChange={e => setDescription(e.target.value)} required />
          <div className="form-text">20‑1000 characters</div>
        </div>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label htmlFor="category" className="form-label">Category</label>
            <select className="form-select" id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
              <option value="">-- Select Category --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="relatedSystem" className="form-label">Related System</label>
            <select className="form-select" id="relatedSystem" value={relatedSystemId} onChange={e => setRelatedSystemId(e.target.value)} required>
              <option value="">-- Select System --</option>
              {systems.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="priority" className="form-label">Requested Priority</label>
          <select className="form-select" id="priority" value={priority} onChange={e => setPriority(e.target.value)} required>
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="attachment-input" className="form-label">Attachments (max 5, 5 MiB each)</label>
          <input className="form-control" type="file" id="attachment-input" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileChange} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}>Submit Ticket</button>
      </form>
    </div>
  );
}
