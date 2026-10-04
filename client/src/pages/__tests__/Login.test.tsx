import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../Login';
import { AuthProvider } from '../../context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Login Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login form inputs and sign in button', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('displays error message when login fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid email or password.' }),
    } as unknown as Response);

    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'WrongPass!' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });
});
