import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RequesterDashboard } from '../RequesterDashboard';
import { AuthProvider } from '../../context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('RequesterDashboard Component', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/dashboard/requester')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            openTickets: 4,
            waitingForRequester: 1,
            recentlyUpdated: 3,
            recentlyResolved: 2,
            recentTickets: [
              {
                id: 42,
                ticketNumber: 'TKT-2026-000042',
                summary: 'VPN authentication timeout',
                currentStatus: 'WAITING_FOR_REQUESTER',
                requestedPriority: 'HIGH',
                updatedAt: '2026-10-30T14:00:00Z',
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
  });

  it('renders 4 requester metric cards and recent updates table', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <RequesterDashboard />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/My Support Requests Dashboard/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Open Tickets')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();

      expect(screen.getByText('Waiting for You')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();

      expect(screen.getByText('Recently Updated')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      expect(screen.getByText('Recently Resolved')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      expect(screen.getByText('TKT-2026-000042')).toBeInTheDocument();
      expect(screen.getByText('VPN authentication timeout')).toBeInTheDocument();
    });
  });
});
