import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChangePassword } from '../ChangePassword';
import { AuthProvider } from '../../context/AuthContext';
import { describe, it, expect } from 'vitest';

describe('ChangePassword Component', () => {
  it('disables submit button until password complexity requirements are met', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <ChangePassword />
        </BrowserRouter>
      </AuthProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /Save & Continue/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Current \(temporary\) password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/^New password$/i), { target: { value: 'NewPass123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: 'NewPass123!' } });

    expect(submitBtn).not.toBeDisabled();
  });
});
