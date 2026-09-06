export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

function displayStatus(status: TicketStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`ticket-badge status-${status.toLowerCase()}`}>{displayStatus(status)}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`ticket-badge priority-${priority.toLowerCase()}`}>{priority}</span>;
}
