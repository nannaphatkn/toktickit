import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StaffDashboard } from '../StaffDashboard';
import { AuthProvider } from '../../context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('StaffDashboard Component', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/dashboard/staff')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            unassigned: 8,
            myTickets: 3,
            openInProgress: 12,
            urgentPriority: 4,
            byStatus: {
              NEW: 2,
              OPEN: 5,
              IN_PROGRESS: 7,
              WAITING_FOR_REQUESTER: 3,
              RESOLVED: 10,
              CLOSED: 15,
              REOPENED: 1,
              CANCELLED: 2,
            },
            byPriority: {
              LOW: 5,
              MEDIUM: 15,
              HIGH: 8,
              URGENT: 4,
            },
            recentTickets: [
              {
                id: 1,
                ticketNumber: 'TKT-2026-000001',
                summary: 'Laptop battery drains quickly',
                currentStatus: 'IN_PROGRESS',
                itPriority: 'HIGH',
                updatedAt: '2026-10-30T10:00:00Z',
                owner: { id: 10, fullName: 'Michael Brown' },
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
  });

  it('renders all 4 metric cards with correct values and labels', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      </AuthProvider>
    );

    // Header check
    expect(screen.getByText(/IT Staff Service Operations Dashboard/i)).toBeInTheDocument();

    // Metric cards check
    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
      expect(screen.getAllByText('8').length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('My Assigned')).toBeInTheDocument();
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Open / In Progress')).toBeInTheDocument();
      expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Urgent Priority')).toBeInTheDocument();
      expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders status breakdown section and recent ticket list', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <StaffDashboard />
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Ticket Status Breakdown/i)).toBeInTheDocument();
      expect(screen.getByText('TKT-2026-000001')).toBeInTheDocument();
      expect(screen.getByText('Laptop battery drains quickly')).toBeInTheDocument();
    });
  });
});
