import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as apiModule from './lib/api';

describe('App - Lab 03 Authentication Guard & Navigation', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('redirects to login screen when unauthenticated', async () => {
    vi.spyOn(apiModule, 'apiFetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    } as unknown as Response);

    render(<App />);
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('renders user welcome dashboard when authenticated', async () => {
    const mockUser = {
      id: 1,
      fullName: 'Jennifer Anderson',
      email: 'jennifer.anderson@toktickit.com',
      role: 'REQUESTER',
      mustChangePassword: false,
    };

    localStorage.setItem('toktickit_token', 'mock-valid-token');
    localStorage.setItem('toktickit_user', JSON.stringify(mockUser));

    vi.spyOn(apiModule, 'apiFetch').mockImplementation((path: string) => {
      if (path.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ user: mockUser }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ tickets: [] }),
      } as unknown as Response);
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Jennifer Anderson!/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Create Ticket/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
