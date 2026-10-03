import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserManagement } from '../UserManagement';
import { AuthProvider } from '../../context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('UserManagement Component', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [
          {
            id: 1,
            fullName: 'Jennifer Anderson',
            email: 'jennifer.anderson@toktickit.com',
            role: 'REQUESTER',
            isActive: true,
            mustChangePassword: false,
            createdAt: '2026-05-12T09:14:00Z',
          },
        ],
      }),
    } as unknown as Response);
  });

  it('renders User Management header and user records', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <UserManagement />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/User Management/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Jennifer Anderson')).toBeInTheDocument();
      expect(screen.getByText('jennifer.anderson@toktickit.com')).toBeInTheDocument();
    });
  });
});
