import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import RequesterPrompt from '../components/RequesterPrompt';
import { useRequester } from '../contexts/requesterContextCore';
import { apiFetch } from '../lib/api';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface Category {
  id: number;
  name: string;
}

interface TicketListItem {
  id: number;
  ticketNumber: string;
  summary: string;
  category: Category;
  requestedPriority: Priority;
  itPriority: Priority | null;
  currentStatus: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

interface TicketListResponse {
  data: TicketListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const PAGE_SIZE = 10;

function displayStatus(status: TicketStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`ticket-badge status-${status.toLowerCase()}`}>{displayStatus(status)}</span>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`ticket-badge priority-${priority.toLowerCase()}`}>{priority}</span>;
}

export default function MyTickets() {
  const { requester } = useRequester();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<TicketListResponse['meta']>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch('/categories', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load categories');
        return response.json();
      })
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((loadError: Error) => {
        if (loadError.name !== 'AbortError') setCategories([]);
      });
    return () => controller.abort();
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sortBy: 'createdAt',
      sortDesc: String(sortDesc),
    });
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    if (priority) params.set('requestedPriority', priority);
    if (status) params.set('currentStatus', status);
    return params.toString();
  }, [categoryId, page, priority, search, sortDesc, status]);

  useEffect(() => {
    if (!requester) {
      setTickets([]);
      setMeta({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 });
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    apiFetch(`/tickets?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to load tickets');
        }
        return payload as TicketListResponse;
      })
      .then((payload) => {
        if (!Array.isArray(payload.data) || !payload.meta) {
          throw new Error('Invalid ticket list response');
        }
        setTickets(payload.data);
        setMeta(payload.meta);
      })
      .catch((loadError: Error) => {
        if (loadError.name !== 'AbortError') {
          setTickets([]);
          setError(loadError.message || 'Unable to load tickets');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, requester, retryCount]);

  const filtersActive = Boolean(search || categoryId || priority || status);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategoryId('');
    setPriority('');
    setStatus('');
    setSortDesc(true);
    setPage(1);
  };

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  if (!requester) {
    return (
      <RequesterPrompt
        title="⚠️ Please Select a Requester"
        message="Please select a Development Requester before viewing My Tickets."
      />
    );
  }

  return (
    <div className="container my-4 my-md-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
        <div>
          <p className="section-kicker mb-1">Requester workspace</p>
          <h1 className="h2 mb-1">My Tickets</h1>
          <p className="text-muted mb-0">Support requests submitted by {requester.name}</p>
        </div>
        <Link to="/create-ticket" className="btn btn-zen-primary align-self-start">
          + Create Ticket
        </Link>
      </div>

      <section className="ticket-filters mb-4" aria-label="Ticket search and filters">
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <label htmlFor="ticket-search" className="form-label fw-semibold">Search</label>
            <input
              id="ticket-search"
              className="form-control"
              type="search"
              placeholder="Ticket number or summary"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-2">
            <label htmlFor="category-filter" className="form-label fw-semibold">Category</label>
            <select
              id="category-filter"
              className="form-select"
              value={categoryId}
              onChange={(event) => updateFilter(setCategoryId, event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-sm-6 col-lg-2">
            <label htmlFor="priority-filter" className="form-label fw-semibold">Priority</label>
            <select
              id="priority-filter"
              className="form-select"
              value={priority}
              onChange={(event) => updateFilter(setPriority, event.target.value)}
            >
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="col-12 col-sm-6 col-lg-2">
            <label htmlFor="status-filter" className="form-label fw-semibold">Status</label>
            <select
              id="status-filter"
              className="form-select"
              value={status}
              onChange={(event) => updateFilter(setStatus, event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="col-12 col-sm-6 col-lg-2">
            <label htmlFor="sort-order" className="form-label fw-semibold">Sort</label>
            <select
              id="sort-order"
              className="form-select"
              value={sortDesc ? 'newest' : 'oldest'}
              onChange={(event) => {
                setSortDesc(event.target.value === 'newest');
                setPage(1);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-zen-secondary" onClick={resetFilters} disabled={!filtersActive && sortDesc}>
            Clear filters
          </button>
        </div>
      </section>

      {loading && (
        <div className="ticket-state" role="status" aria-live="polite">
          <div className="spinner-border text-success mb-3" aria-hidden="true" />
          <p className="mb-0">Loading your tickets…</p>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-zen-secondary" onClick={() => setRetryCount((count) => count + 1)}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && meta.total === 0 && !filtersActive && (
        <div className="ticket-state">
          <div className="ticket-state-icon" aria-hidden="true">🗂️</div>
          <h2 className="h4">No tickets yet</h2>
          <p className="text-muted">When you submit a support request, it will appear here.</p>
          <Link to="/create-ticket" className="btn btn-zen-primary">Create your first ticket</Link>
        </div>
      )}

      {!loading && !error && meta.total === 0 && filtersActive && (
        <div className="ticket-state">
          <div className="ticket-state-icon" aria-hidden="true">🔎</div>
          <h2 className="h4">No matching tickets</h2>
          <p className="text-muted">Try a different search or clear your filters.</p>
          <button type="button" className="btn btn-zen-secondary" onClick={resetFilters}>Reset filters</button>
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <>
          <div className="ticket-table-wrap d-none d-md-block">
            <table className="table ticket-table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Ticket #</th>
                  <th scope="col">Summary</th>
                  <th scope="col">Category</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col"><span className="visually-hidden">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="fw-semibold text-nowrap">{ticket.ticketNumber}</td>
                    <td className="ticket-summary">{ticket.summary}</td>
                    <td><span className="category-badge">{ticket.category.name}</span></td>
                    <td><PriorityBadge priority={ticket.requestedPriority} /></td>
                    <td><StatusBadge status={ticket.currentStatus} /></td>
                    <td className="text-nowrap">{formatDate(ticket.createdAt)}</td>
                    <td className="text-end">
                      <Link to={`/tickets/${ticket.id}`} className="ticket-detail-link" aria-label={`View ${ticket.ticketNumber}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-grid gap-3 d-md-none">
            {tickets.map((ticket) => (
              <article className="ticket-card p-3" key={ticket.id}>
                <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                  <strong>{ticket.ticketNumber}</strong>
                  <StatusBadge status={ticket.currentStatus} />
                </div>
                <h2 className="h5 ticket-card-summary">{ticket.summary}</h2>
                <dl className="ticket-card-meta mb-3">
                  <div><dt>Category</dt><dd><span className="category-badge">{ticket.category.name}</span></dd></div>
                  <div><dt>Priority</dt><dd><PriorityBadge priority={ticket.requestedPriority} /></dd></div>
                  <div><dt>Created</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
                </dl>
                <Link to={`/tickets/${ticket.id}`} className="ticket-detail-link" aria-label={`View ${ticket.ticketNumber}`}>
                  View ticket →
                </Link>
              </article>
            ))}
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 mt-4">
            <p className="text-muted mb-0">
              Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </p>
            {meta.totalPages > 1 && (
              <nav aria-label="My Tickets pagination">
                <ul className="pagination mb-0">
                  <li className={`page-item ${meta.page <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" type="button" onClick={() => setPage((current) => current - 1)} disabled={meta.page <= 1}>
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: meta.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <li className={`page-item ${pageNumber === meta.page ? 'active' : ''}`} key={pageNumber}>
                      <button
                        className="page-link"
                        type="button"
                        aria-current={pageNumber === meta.page ? 'page' : undefined}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${meta.page >= meta.totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" type="button" onClick={() => setPage((current) => current + 1)} disabled={meta.page >= meta.totalPages}>
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </>
      )}
    </div>
  );
}
