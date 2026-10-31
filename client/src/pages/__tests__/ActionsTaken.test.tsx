import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionsTakenSection, ActionTaken } from '../../components/ActionsTakenSection';
import { AuthProvider } from '../../context/AuthContext';
import { describe, it, expect, vi } from 'vitest';

const mockActions: ActionTaken[] = [
  {
    id: 1,
    ticketId: 10,
    actionDateTime: '2026-10-30T10:00:00Z',
    actionDescription: 'Replaced faulty power supply unit.',
    result: 'Workstation powers on smoothly.',
    followUpRequired: true,
    followUpNote: 'Monitor for random restarts over 48 hours.',
    attachmentNotes: 'psu_model_500w.png',
    performedBy: { id: 2, fullName: 'Lisa Martinez', role: 'IT_STAFF' },
    createdAt: '2026-10-30T10:05:00Z',
    updatedAt: '2026-10-30T10:05:00Z',
  },
];

describe('ActionsTakenSection Component', () => {
  it('renders actions list with author, description, result, and follow-up', () => {
    render(
      <AuthProvider>
        <ActionsTakenSection
          ticketId={10}
          actions={mockActions}
          readOnly={true}
          onActionsUpdated={vi.fn()}
        />
      </AuthProvider>
    );

    expect(screen.getByText(/Actions Taken/i)).toBeInTheDocument();
    expect(screen.getByText('Replaced faulty power supply unit.')).toBeInTheDocument();
    expect(screen.getByText('Workstation powers on smoothly.')).toBeInTheDocument();
    expect(screen.getByText(/Lisa Martinez/i)).toBeInTheDocument();
    expect(screen.getByText(/Follow-Up Required/i)).toBeInTheDocument();
    expect(screen.getByText('Monitor for random restarts over 48 hours.')).toBeInTheDocument();
  });

  it('hides "Record Action" button in readOnly mode', () => {
    render(
      <AuthProvider>
        <ActionsTakenSection
          ticketId={10}
          actions={mockActions}
          readOnly={true}
          onActionsUpdated={vi.fn()}
        />
      </AuthProvider>
    );

    expect(screen.queryByText(/Record Action/i)).not.toBeInTheDocument();
  });

  it('renders empty state when no actions exist', () => {
    render(
      <AuthProvider>
        <ActionsTakenSection
          ticketId={10}
          actions={[]}
          readOnly={true}
          onActionsUpdated={vi.fn()}
        />
      </AuthProvider>
    );

    expect(screen.getByText(/No actions recorded yet/i)).toBeInTheDocument();
  });
});
