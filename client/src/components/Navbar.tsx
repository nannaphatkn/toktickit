import { Link, NavLink } from 'react-router-dom';
import RequesterSelector from './RequesterSelector';
import { useRequester } from '../contexts/requesterContextCore';

export default function Navbar() {
  const { requester, clearRequester } = useRequester();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav
        className="navbar navbar-expand-lg navbar-dark sticky-top"
        style={{
          backgroundColor: 'rgba(0, 107, 60, 0.95)',
          minHeight: '64px',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div className="container-fluid px-4">
          <Link to="/" className="navbar-brand fw-bold d-flex align-items-center gap-2 text-decoration-none">
            <span style={{ fontSize: '1.4rem' }}>🎫</span>
            <span style={{ letterSpacing: '0.5px' }}>TokTickIT</span>
          </Link>

          <div className="navbar-nav me-auto ms-3 d-flex flex-row gap-3">
            <NavLink
              to="/create-ticket"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active-nav' : 'text-white'}`
              }
            >
              📝 Create Ticket
            </NavLink>
            <NavLink
              to="/my-tickets"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active-nav' : 'text-white'}`
              }
            >
              📋 My Tickets
            </NavLink>
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
                  aria-label="Switch Requester"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
