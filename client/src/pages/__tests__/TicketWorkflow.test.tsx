import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { StaffTicketDetail } from '../StaffTicketDetail';
import { AuthProvider } from '../../context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TicketWorkflow Component & Status Transitions', () => {
  beforeEach(() => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        email: 'michael.brown@toktickit.com',
        fullName: 'Michael Brown',
        role: 'IT_STAFF',
      })
    );
    localStorage.setItem('token', 'fake-jwt-token');

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/staff/tickets/1')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ticket: {
              id: 1,
              ticketNumber: 'TKT-2026-000001',
              summary: 'Laptop battery drains quickly',
              description: 'Battery drains rapidly under normal load.',
              requestedPriority: 'MEDIUM',
              itPriority: 'MEDIUM',
              currentStatus: 'IN_PROGRESS',
              isRequesterResolved: false,
              category: { id: 1, name: 'Hardware' },
              relatedSystem: { id: 1, name: 'Corporate Laptop' },
              requester: { id: 2, fullName: 'Jennifer Anderson', email: 'jennifer.anderson@toktickit.com' },
              owner: { id: 1, fullName: 'Michael Brown', role: 'IT_STAFF' },
              attachments: [],
              publicComments: [],
              internalNotes: [],
              actionsTaken: [],
              createdAt: '2026-10-20T10:00:00Z',
              updatedAt: '2026-10-20T11:00:00Z',
            },
          }),
        });
      }

      if (url.includes('/staff/members')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { id: 1, fullName: 'Michael Brown', role: 'IT_STAFF' },
            { id: 2, fullName: 'Lisa Martinez', role: 'IT_STAFF' },
          ],
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      });
    });
  });

  it('renders permitted status workflow transitions for IN_PROGRESS ticket', async () => {
    render(
      <MemoryRouter initialEntries={['/staff/tickets/1']}>
        <AuthProvider>
          <Routes>
            <Route path="/staff/tickets/:id" element={<StaffTicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('TKT-2026-000001')[0]).toBeInTheDocument();
    });

    // Verify current status and options
    const statusSelect = screen.getByDisplayValue(/IN_PROGRESS/);
    expect(statusSelect).toBeInTheDocument();

    // From IN_PROGRESS, valid transitions are WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
    expect(screen.getByText('→ WAITING_FOR_REQUESTER')).toBeInTheDocument();
    expect(screen.getByText('→ RESOLVED')).toBeInTheDocument();
    expect(screen.getByText('→ CANCELLED')).toBeInTheDocument();
  });

  it('renders IT priority selector with all 4 levels', async () => {
    render(
      <MemoryRouter initialEntries={['/staff/tickets/1']}>
        <AuthProvider>
          <Routes>
            <Route path="/staff/tickets/:id" element={<StaffTicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('IT Priority:')).toBeInTheDocument();
    });

    expect(screen.getByRole('option', { name: 'LOW' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'MEDIUM' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'HIGH' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'URGENT' })).toBeInTheDocument();
  });
});
