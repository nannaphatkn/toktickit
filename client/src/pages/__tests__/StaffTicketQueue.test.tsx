import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StaffQueue } from '../StaffQueue';
import { AuthProvider } from '../../context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('StaffQueue Component', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 1, name: 'Hardware' }] });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          tickets: [
            {
              id: 1,
              ticketNumber: 'TKT-2026-000001',
              summary: 'Laptop battery drains quickly',
              itPriority: 'HIGH',
              currentStatus: 'IN_PROGRESS',
              category: { id: 1, name: 'Hardware' },
              requester: { id: 1, fullName: 'Jennifer Anderson' },
              owner: null,
              createdAt: '2026-05-12T09:14:00Z',
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      });
    });
  });

  it('renders queue title, filter controls, and tickets table', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <StaffQueue />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/IT Staff Ticket Queue/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-000001')).toBeInTheDocument();
      expect(screen.getByText('Laptop battery drains quickly')).toBeInTheDocument();
    });
  });
});
