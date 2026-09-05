import { render, screen } from '@testing-library/react';
import App from './App';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('App - Requester Access Guard & Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  it('renders welcome screen prompting requester selection when unauthenticated', () => {
    render(<App />);
    expect(screen.getByText(/Welcome to TokTickIT/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Please select a Development Requester from the dropdown/i)
    ).toBeInTheDocument();
  });

  it('renders user welcome and action cards when a requester is selected', () => {
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
  });
});
