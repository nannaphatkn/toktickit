import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

describe('App - Category Client Test', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('renders initial state correctly', () => {
    render(<App />);
    expect(screen.getByText('TokTickIT IT Service Desk')).toBeInTheDocument();
    expect(screen.getByText('[ Check System ]')).toBeInTheDocument();
    expect(screen.queryByText('System Status:')).not.toBeInTheDocument();
  });

  it('fetches and displays categories when Check System is clicked', async () => {
    // Mock the responses for /api/health and /api/categories
    (global.fetch as Mock).mockImplementation((url: string) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok', service: 'TokTickIT API' }),
        });
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: '1', name: 'Hardware' },
            { id: '2', name: 'Software' },
          ]),
        });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<App />);
    
    const button = screen.getByText('[ Check System ]');
    fireEvent.click(button);

    // It should display loading state
    expect(screen.getByText('⏳ "loading"...')).toBeInTheDocument();

    // After fetch resolves, it should display the categories
    await waitFor(() => {
      expect(screen.getByText('System Status: Online')).toBeInTheDocument();
    });

    expect(screen.getByText('Supported Request Categories')).toBeInTheDocument();
    expect(screen.getByText('1. Hardware')).toBeInTheDocument();
    expect(screen.getByText('2. Software')).toBeInTheDocument();
  });

  it('displays error if fetch fails', async () => {
    (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

    render(<App />);
    
    const button = screen.getByText('[ Check System ]');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('System Status: Offline')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Unable to connect to TokTickIT API')).toBeInTheDocument();
  });
});
