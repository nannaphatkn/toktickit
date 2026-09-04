import RequesterSelector from './RequesterSelector';
import { useRequester } from '../contexts/RequesterContext';

export default function Navbar() {
  const { requester, clearRequester } = useRequester();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#006B3C' }}>
      <div className="container-fluid">
        <span className="navbar-brand fw-bold">
          🎫 TokTickIT
        </span>

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
