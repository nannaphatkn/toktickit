import RequesterSelector from './RequesterSelector';
import { useRequester } from '../contexts/RequesterContext';

export default function Navbar() {
  const { requester, clearRequester } = useRequester();

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark sticky-top"
      style={{
        backgroundColor: 'rgba(0, 107, 60, 0.95)',
        minHeight: '64px',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div className="container-fluid">
        <span className="navbar-brand fw-bold">
          🎫 TokTickIT
        </span>

        <div className="navbar-nav me-auto ms-3 d-flex flex-row gap-3">
          <span className="nav-link disabled text-white-50">📝 Create Ticket</span>
          <span className="nav-link disabled text-white-50">📋 My Tickets</span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <RequesterSelector />

          {requester && (
            <span className="text-white small d-none d-md-inline">
              👤 {requester.name}
              <button
                className="btn btn-sm btn-outline-light ms-2"
                onClick={clearRequester}
                title="Switch Requester"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
