import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('App - Requester Access Guard & Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as unknown as Response);
  });

  it('renders welcome screen prompting requester selection when unauthenticated', async () => {
    render(<App />);
    expect(screen.getByText(/Welcome to TokTickIT/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Please select a Development Requester from the dropdown/i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Development Requester/i })).not.toBeDisabled();
    });
  });

  it('renders user welcome and action cards when a requester is selected', async () => {
    localStorage.setItem(
      'requester',
      JSON.stringify({
        id: 1,
        name: 'Jennifer Anderson',
        email: 'jennifer.a@company.com',
        isActive: true,
      })
    );

    render(<App />);
    expect(screen.getByText(/Welcome, Jennifer Anderson!/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Create Ticket/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/My Tickets/i).length).toBeGreaterThanOrEqual(1);
    expect(localStorage.getItem('requesterId')).toBe('1');
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Development Requester/i })).not.toBeDisabled();
    });
  });

  it('rejects an inactive requester restored from localStorage', async () => {
    localStorage.setItem(
      'requester',
      JSON.stringify({ id: 9, name: 'Inactive User', email: 'inactive@example.com', isActive: false })
    );

    render(<App />);
    expect(screen.getByText(/Welcome to TokTickIT/i)).toBeInTheDocument();
    expect(localStorage.getItem('requester')).toBeNull();
    expect(localStorage.getItem('requesterId')).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Development Requester/i })).not.toBeDisabled();
    });
  });

  it('clears a stored requester that is no longer returned as active', async () => {
    localStorage.setItem(
      'requester',
      JSON.stringify({ id: 1, name: 'Former User', email: 'former@example.com', isActive: true })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to TokTickIT/i)).toBeInTheDocument();
      expect(localStorage.getItem('requester')).toBeNull();
    });
  });
});
