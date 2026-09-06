import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequesterProvider } from '../contexts/RequesterContext';
import { type Requester, useRequester } from '../contexts/requesterContextCore';
import TicketDetail from './TicketDetail';

const requester: Requester = {
  id: 7,
  name: 'Alex Requester',
  email: 'alex@example.com',
  isActive: true,
};

const requesterB: Requester = {
  id: 8,
  name: 'Michael Chen',
  email: 'michael@example.com',
  isActive: true,
};

function SwitchRequesterButton() {
  const { setRequester } = useRequester();
  return <button onClick={() => setRequester(requesterB)}>Switch test requester</button>;
}

const detail = {
  id: 42,
  ticketNumber: 'TKT-2026-000042',
  summary: 'Cannot connect to the corporate VPN',
  description: 'The VPN connection fails after entering the one-time password.\nIt happens on every attempt.',
  requestedPriority: 'HIGH',
  itPriority: 'MEDIUM',
  currentStatus: 'IN_PROGRESS',
  category: { id: 1, name: 'Network' },
  relatedSystem: { id: 2, name: 'Corporate VPN' },
  requester: { id: requester.id, name: requester.name, email: requester.email },
  attachments: [
    {
      id: 101,
      originalName: 'vpn-error.png',
      fileType: 'image/png',
      fileSize: 2048,
      isRemoved: false,
      removalReason: null,
      removedAt: null,
      createdAt: '2026-09-06T08:00:00.000Z',
    },
    {
      id: 102,
      originalName: 'old-log.pdf',
      fileType: 'application/pdf',
      fileSize: 4096,
      isRemoved: true,
      removalReason: 'Outdated evidence',
      removedAt: '2026-09-06T09:00:00.000Z',
      createdAt: '2026-09-05T08:00:00.000Z',
    },
  ],
  createdAt: '2026-09-05T07:00:00.000Z',
  updatedAt: '2026-09-06T09:30:00.000Z',
};

const detailAtAttachmentLimit = {
  ...detail,
  attachments: Array.from({ length: 5 }, (_, index) => ({
    ...detail.attachments[0],
    id: 200 + index,
    originalName: `limit-${index}.png`,
  })),
};

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500): Response {
  return {
    ok,
    status,
    json: async () => body,
    blob: async () => new Blob(),
  } as Response;
}

function renderPage(extra?: ReactNode) {
  return render(
    <RequesterProvider>
      <MemoryRouter initialEntries={['/tickets/42']}>
        {extra}
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetail />} />
        </Routes>
      </MemoryRouter>
    </RequesterProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('requester', JSON.stringify(requester));
  localStorage.setItem('requesterId', String(requester.id));
  globalThis.fetch = vi.fn((url: string | URL | Request) => {
    if (url.toString().includes('/tickets/42')) return Promise.resolve(jsonResponse(detail));
    return Promise.resolve(jsonResponse({}));
  });
});

describe('TicketDetail', () => {
  it('renders read-only ticket metadata and active/removed attachment states', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: detail.ticketNumber })).toBeInTheDocument();
    expect(screen.getAllByText('Cannot connect to the corporate VPN')).toHaveLength(2);
    expect(screen.getByText('Network')).toBeInTheDocument();
    expect(screen.getByText('Corporate VPN')).toBeInTheDocument();
    expect(screen.getByText('Alex Requester')).toBeInTheDocument();
    expect(screen.getByText(/The VPN connection fails/)).toBeInTheDocument();
    expect(screen.getByText('vpn-error.png')).toBeInTheDocument();
    expect(screen.getByText('old-log.pdf')).toBeInTheDocument();
    expect(screen.getByText('Outdated evidence', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Removed')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Download' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Remove attachment' })).toHaveLength(1);
    expect(screen.getByTitle('Removed – not downloadable')).toHaveClass('attachment-row-removed');
    expect(screen.getByLabelText('Removed – not downloadable')).toBeInTheDocument();
  });

  it('requires a requester before making the detail request', () => {
    localStorage.clear();
    renderPage();
    expect(screen.getByText(/Please Select a Requester/i)).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('shows the loading skeleton while ticket details are being fetched', async () => {
    globalThis.fetch = vi.fn(() => new Promise<Response>(() => undefined));
    renderPage();
    expect(await screen.findByText(/Loading ticket details/)).toBeInTheDocument();
    expect(document.querySelector('.ticket-detail-skeleton')).toBeInTheDocument();
  });

  it('shows an empty attachment state when the ticket has no files', async () => {
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      if (url.toString().includes('/tickets/42')) return Promise.resolve(jsonResponse({ ...detail, attachments: [] }));
      return Promise.resolve(jsonResponse({}));
    });
    renderPage();
    expect(await screen.findByText('No attachments have been added to this ticket.')).toBeInTheDocument();
  });

  it('validates upload type and size before calling the API', async () => {
    renderPage();
    await screen.findByText('vpn-error.png');
    const picker = screen.getByLabelText(/Add attachment/) as HTMLInputElement;

    fireEvent.change(picker, {
      target: { files: [new File(['unsafe'], 'unsafe.exe', { type: 'application/x-msdownload' })] },
    });
    expect(await screen.findByText(/Only JPG, JPEG, PNG, WEBP, and PDF/)).toBeInTheDocument();
    expect(vi.mocked(globalThis.fetch).mock.calls.some(([url]) => url.toString().includes('/attachments'))).toBe(false);

    const tooLarge = new File(['large'], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(tooLarge, 'size', { value: 5 * 1024 * 1024 + 1 });
    fireEvent.change(picker, { target: { files: [tooLarge] } });
    expect(await screen.findByText(/must not exceed 5 MB/)).toBeInTheDocument();
  });

  it('uploads a valid file and refreshes the ticket detail', async () => {
    let detailRequests = 0;
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlString = url.toString();
      if (urlString.includes('/tickets/42/attachments')) return Promise.resolve(jsonResponse({ id: 103 }));
      if (urlString.includes('/tickets/42')) {
        detailRequests += 1;
        return Promise.resolve(jsonResponse(detail));
      }
      return Promise.resolve(jsonResponse({}));
    });

    renderPage();
    await screen.findByText('vpn-error.png');
    const picker = screen.getByLabelText(/Add attachment/) as HTMLInputElement;
    fireEvent.change(picker, {
      target: { files: [new File(['valid image'], 'new.png', { type: 'image/png' })] },
    });

    await waitFor(() => expect(detailRequests).toBe(2));
    const uploadCall = vi.mocked(globalThis.fetch).mock.calls.find(([url]) => url.toString().includes('/attachments'));
    expect(uploadCall?.[1]?.method).toBe('POST');
    expect(uploadCall?.[1]?.body).toBeInstanceOf(FormData);
  });

  it('disables the add control when five active attachments already exist', async () => {
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      if (url.toString().includes('/tickets/42')) return Promise.resolve(jsonResponse(detailAtAttachmentLimit));
      return Promise.resolve(jsonResponse({}));
    });

    renderPage();
    await screen.findByText('limit-0.png');
    expect(screen.getByLabelText(/Add attachment/)).toBeDisabled();
    expect(screen.getByText(/5 of 5 active attachments/)).toBeInTheDocument();
  });

  it('downloads an active attachment and opens the reason modal for removal', async () => {
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    let detailRequests = 0;
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlString = url.toString();
      if (urlString.includes('/attachments/101/download')) {
        return Promise.resolve(jsonResponse({ file: true }));
      }
      if (urlString.includes('/attachments/101') && urlString.includes('api')) {
        return Promise.resolve(jsonResponse({ success: true }));
      }
      if (urlString.includes('/tickets/42')) {
        detailRequests += 1;
        return Promise.resolve(jsonResponse(detail));
      }
      return Promise.resolve(jsonResponse({}));
    });

    renderPage();
    await screen.findByText('vpn-error.png');
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    anchorClick.mockRestore();

    fireEvent.click(screen.getByRole('button', { name: 'Remove attachment' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));
    expect(await screen.findByText(/between 3 and 500 characters/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'No longer needed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));
    await waitFor(() => expect(detailRequests).toBe(2));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const deleteCall = vi.mocked(globalThis.fetch).mock.calls.find(([url, options]) =>
      url.toString().endsWith('/attachments/101') && options?.method === 'DELETE',
    );
    expect(deleteCall?.[1]?.body).toBe(JSON.stringify({ removalReason: 'No longer needed' }));
  });

  it('shows a retryable error state for an unavailable ticket', async () => {
    let ticketRequests = 0;
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      if (url.toString().includes('/tickets/42')) {
        ticketRequests += 1;
        return ticketRequests === 1
          ? Promise.resolve(jsonResponse({ error: 'Ticket service unavailable' }, false, 503))
          : Promise.resolve(jsonResponse(detail));
      }
      return Promise.resolve(jsonResponse({}));
    });
    renderPage();
    expect(await screen.findByText('Ticket service unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: detail.ticketNumber })).toBeInTheDocument();
    expect(ticketRequests).toBe(2);
    expect(screen.getByRole('link', { name: /Back to My Tickets/ })).toBeInTheDocument();
  });

  it('shows a clear unavailable state for a forbidden ticket', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve(jsonResponse({ error: 'You do not have access to this ticket' }, false, 403)));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Ticket unavailable' })).toBeInTheDocument();
    expect(screen.getByText('You do not have access to this ticket')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('P1 regression: clears ticket detail immediately upon requester switch and does not leak prior owner data', async () => {
    globalThis.fetch = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const urlString = url.toString();
      if (urlString.includes('/tickets/42')) {
        const headers = new Headers(init?.headers);
        const reqId = headers.get('X-Requester-Id');
        if (reqId === String(requester.id)) {
          return Promise.resolve(jsonResponse(detail));
        }
        return Promise.resolve(jsonResponse({ error: 'You do not have access to this ticket' }, false, 403));
      }
      return Promise.resolve(jsonResponse({}));
    });

    renderPage(<SwitchRequesterButton />);
    expect(await screen.findByRole('heading', { name: detail.ticketNumber })).toBeInTheDocument();
    expect(screen.getAllByText(detail.summary).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Switch test requester' }));

    expect(screen.queryByRole('heading', { name: detail.ticketNumber })).not.toBeInTheDocument();
    expect(screen.queryByText(detail.summary)).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Ticket unavailable' })).toBeInTheDocument();
    expect(screen.getByText('You do not have access to this ticket')).toBeInTheDocument();
  });
});
