import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CreateTicket from './CreateTicket';
import { RequesterProvider } from '../contexts/RequesterContext';

const renderWithContext = () => {
  return render(
    <RequesterProvider>
      <CreateTicket />
    </RequesterProvider>
  );
};

describe('CreateTicket Component', () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Hardware' }],
        } as Response);
      }
      if (urlStr.includes('/related-systems')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Corporate Laptop' }],
        } as Response);
      }
      if (urlStr.includes('/tickets')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 1,
            ticketNumber: 'TKT-2026-000001',
            summary: 'My laptop screen is broken',
            currentStatus: 'NEW',
            createdAt: new Date().toISOString(),
          }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    });
  });

  it('T-02: renders prompt to select requester when unauthenticated', () => {
    renderWithContext();
    expect(screen.getByText(/Please Select a Requester/i)).toBeInTheDocument();
  });

  it('renders form and validates required fields when requester is selected', async () => {
    localStorage.setItem(
      'requester',
      JSON.stringify({ id: 1, name: 'Jennifer Anderson', email: 'jennifer@example.com', isActive: true })
    );
    localStorage.setItem('requesterId', '1');

    renderWithContext();

    expect(screen.getByText(/Create New Ticket/i)).toBeInTheDocument();

    // Click submit without entering data
    const submitBtn = screen.getByRole('button', { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Summary is required/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Description is required/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Please select a Category/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Please select a Related System/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('submits form successfully and displays official ticket number', async () => {
    localStorage.setItem(
      'requester',
      JSON.stringify({ id: 1, name: 'Jennifer Anderson', email: 'jennifer@example.com', isActive: true })
    );
    localStorage.setItem('requesterId', '1');

    renderWithContext();

    // Wait for categories and systems to load
    await waitFor(() => {
      expect(screen.getByText('Hardware')).toBeInTheDocument();
      expect(screen.getByText('Corporate Laptop')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Summary/i), {
      target: { value: 'This is a valid summary with more than 10 characters' },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'This is a valid description with more than 20 characters length.' },
    });
    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText(/Related System/i), {
      target: { value: '1' },
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ticket created successfully! Official Ticket Number: TKT-2026-000001/i)).toBeInTheDocument();
    });

    const ticketCall = vi.mocked(globalThis.fetch).mock.calls.find(([url]) => url.toString().includes('/tickets'));
    expect(ticketCall).toBeDefined();
    const headers = new Headers(ticketCall?.[1]?.headers);
    expect(headers.get('X-Requester-Id')).toBe('1');
  });

  it('T-04: shows a validation error immediately for a file larger than 5 MB', async () => {
    localStorage.setItem(
      'requester',
      JSON.stringify({ id: 1, name: 'Jennifer Anderson', email: 'jennifer@example.com', isActive: true })
    );

    renderWithContext();
    await screen.findByText('Hardware');
    const oversizedFile = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      'oversized.png',
      { type: 'image/png' }
    );
    fireEvent.change(screen.getByLabelText(/Attachments/i), {
      target: { files: [oversizedFile] },
    });

    expect(screen.getByText(/File size exceeds 5 MB/i)).toBeInTheDocument();
  });

  it('shows a validation error immediately for an unsupported file type', async () => {
    localStorage.setItem(
      'requester',
      JSON.stringify({ id: 1, name: 'Jennifer Anderson', email: 'jennifer@example.com', isActive: true })
    );

    renderWithContext();
    await screen.findByText('Hardware');
    const executable = new File(['payload'], 'malicious.exe', { type: 'application/x-msdownload' });
    fireEvent.change(screen.getByLabelText(/Attachments/i), {
      target: { files: [executable] },
    });

    expect(screen.getByText(/Unsupported file type/i)).toBeInTheDocument();
  });

  it('shows a validation error immediately when more than five files are selected', async () => {
    localStorage.setItem(
      'requester',
      JSON.stringify({ id: 1, name: 'Jennifer Anderson', email: 'jennifer@example.com', isActive: true })
    );

    renderWithContext();
    await screen.findByText('Hardware');
    const files = Array.from(
      { length: 6 },
      (_, index) => new File(['image'], `image-${index}.png`, { type: 'image/png' })
    );
    fireEvent.change(screen.getByLabelText(/Attachments/i), {
      target: { files },
    });

    expect(screen.getByText(/maximum of 5 files/i)).toBeInTheDocument();
  });

  it('rejects a file whose extension does not match its MIME type', async () => {
    localStorage.setItem(
      'requester',
      JSON.stringify({ id: 1, name: 'Jennifer Anderson', email: 'jennifer@example.com', isActive: true })
    );

    renderWithContext();
    await screen.findByText('Hardware');
    const disguisedFile = new File(['payload'], 'disguised.exe', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText(/Attachments/i), {
      target: { files: [disguisedFile] },
    });

    expect(screen.getByText(/Unsupported file type/i)).toBeInTheDocument();
  });
});
