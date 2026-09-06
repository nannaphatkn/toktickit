import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequesterProvider } from '../contexts/RequesterContext';
import { useRequester, type Requester } from '../contexts/requesterContextCore';
import MyTickets from './MyTickets';

const requesterA: Requester = {
  id: 1,
  name: 'Jennifer Anderson',
  email: 'jennifer@example.com',
  isActive: true,
};

const requesterB: Requester = {
  id: 2,
  name: 'Michael Chen',
  email: 'michael@example.com',
  isActive: true,
};

const ticket = {
  id: 12,
  ticketNumber: 'TKT-2026-000012',
  summary: 'Corporate VPN disconnects every few minutes',
  category: { id: 1, name: 'Network' },
  requestedPriority: 'HIGH',
  itPriority: null,
  currentStatus: 'IN_PROGRESS',
  createdAt: '2026-09-06T08:00:00.000Z',
  updatedAt: '2026-09-06T08:00:00.000Z',
};

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

function ticketResponse(data = [ticket], total = data.length, page = 1, totalPages = total > 0 ? 1 : 0) {
  return jsonResponse({ data, meta: { total, page, limit: 10, totalPages } });
}

function renderPage(extra?: React.ReactNode) {
  return render(
    <RequesterProvider>
      <MemoryRouter>
        {extra}
        <MyTickets />
      </MemoryRouter>
    </RequesterProvider>
  );
}

function SwitchRequesterButton() {
  const { setRequester } = useRequester();
  return <button onClick={() => setRequester(requesterB)}>Switch test requester</button>;
}

describe('MyTickets', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('requester', JSON.stringify(requesterA));
    localStorage.setItem('requesterId', String(requesterA.id));
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlString = url.toString();
      if (urlString.includes('/categories')) {
        return Promise.resolve(jsonResponse([{ id: 1, name: 'Network' }]));
      }
      return Promise.resolve(ticketResponse());
    });
  });

  it('renders the desktop table, mobile card content, and styled badges', async () => {
    renderPage();

    expect((await screen.findAllByText(ticket.ticketNumber)).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(ticket.summary).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('HIGH')[0]).toHaveClass('priority-high');
    expect(screen.getAllByText('In Progress').some((element) => element.classList.contains('status-in_progress'))).toBe(true);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('guards the page when no requester is selected', () => {
    localStorage.clear();
    renderPage();
    expect(screen.getByText(/Please Select a Requester/i)).toBeInTheDocument();
  });

  it('shows a loading state while tickets are being fetched', async () => {
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      if (url.toString().includes('/categories')) return Promise.resolve(jsonResponse([]));
      return new Promise<Response>(() => undefined);
    });

    renderPage();
    expect(await screen.findByText(/Loading your tickets/i)).toBeInTheDocument();
  });

  it('updates the API query from search, filters, and sorting controls', async () => {
    renderPage();
    await screen.findAllByText('Network');

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'vpn access' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'HIGH' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'IN_PROGRESS' } });
    fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'oldest' } });

    await waitFor(() => {
      const ticketCalls = vi.mocked(globalThis.fetch).mock.calls
        .map(([url]) => url.toString())
        .filter((url) => url.includes('/tickets?'));
      expect(ticketCalls.some((url) =>
        url.includes('search=vpn+access') &&
        url.includes('categoryId=1') &&
        url.includes('requestedPriority=HIGH') &&
        url.includes('currentStatus=IN_PROGRESS') &&
        url.includes('sortDesc=false')
      )).toBe(true);
    });
  });

  it('renders a friendly empty state when the requester has no tickets', async () => {
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      if (url.toString().includes('/categories')) return Promise.resolve(jsonResponse([]));
      return Promise.resolve(ticketResponse([], 0, 1, 0));
    });

    renderPage();
    expect(await screen.findByText('No tickets yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create your first ticket/i })).toBeInTheDocument();
  });

  it('distinguishes no search results and can reset filters', async () => {
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlString = url.toString();
      if (urlString.includes('/categories')) return Promise.resolve(jsonResponse([]));
      if (urlString.includes('search=missing')) return Promise.resolve(ticketResponse([], 0, 1, 0));
      return Promise.resolve(ticketResponse());
    });

    renderPage();
    await screen.findAllByText(ticket.ticketNumber);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'missing' } });

    expect(await screen.findByText('No matching tickets')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(await screen.findAllByText(ticket.ticketNumber)).not.toHaveLength(0);
  });

  it('loads the requested pagination page', async () => {
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      if (url.toString().includes('/categories')) return Promise.resolve(jsonResponse([]));
      const page = url.toString().includes('page=2') ? 2 : 1;
      return Promise.resolve(ticketResponse([ticket], 20, page, 2));
    });

    renderPage();
    await screen.findAllByText(ticket.ticketNumber);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch).mock.calls.some(([url]) => url.toString().includes('/tickets?page=2'))).toBe(true);
    });
  });

  it('shows a non-blocking failure state and retries', async () => {
    let ticketRequests = 0;
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      if (url.toString().includes('/categories')) return Promise.resolve(jsonResponse([]));
      ticketRequests += 1;
      if (ticketRequests === 1) return Promise.resolve(jsonResponse({ error: 'Service temporarily unavailable' }, false));
      return Promise.resolve(ticketResponse());
    });

    renderPage();
    expect(await screen.findByText('Service temporarily unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect((await screen.findAllByText(ticket.ticketNumber)).length).toBeGreaterThan(0);
  });

  it('refetches with the new header when requester context changes', async () => {
    renderPage(<SwitchRequesterButton />);
    await screen.findAllByText(ticket.ticketNumber);

    fireEvent.click(screen.getByRole('button', { name: 'Switch test requester' }));

    await waitFor(() => {
      const requesterHeaders = vi.mocked(globalThis.fetch).mock.calls
        .filter(([url]) => url.toString().includes('/tickets?'))
        .map(([, options]) => new Headers(options?.headers).get('X-Requester-Id'));
      expect(requesterHeaders).toContain('2');
    });
  });
});
