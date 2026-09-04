import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CreateTicket from './pages/CreateTicket';
import { RequesterProvider, useRequester } from './contexts/RequesterContext';
import Navbar from './components/Navbar';

function MainContent() {
  const { requester } = useRequester();

  if (!requester) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-sm border-0">
              <div className="card-body text-center p-5">
                <h2 className="mb-3" style={{ color: '#006B3C' }}>🎫 Welcome to TokTickIT</h2>
                <p className="text-muted mb-4">
                  Please select a Development Requester from the dropdown above to get started.
                </p>
                <div className="alert alert-info" role="alert">
                  👆 Use the selector in the navigation bar to choose your identity.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h3 style={{ color: '#006B3C' }}>Welcome, {requester.name}! 👋</h3>
              <p className="text-muted">You are logged in as a Development Requester.</p>
              <hr />
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="card h-100 border-0" style={{ backgroundColor: '#f0f9f4' }}>
                    <div className="card-body text-center">
                      <h5 style={{ color: '#006B3C' }}>📝 Create Ticket</h5>
                      <p className="text-muted small">Submit a new support request</p>
                      <Link to="/create-ticket" className="btn btn-sm" style={{ backgroundColor: '#006B3C', color: 'white' }}>
                        Go
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100 border-0" style={{ backgroundColor: '#f0f9f4' }}>
                    <div className="card-body text-center">
                      <h5 style={{ color: '#006B3C' }}>📋 My Tickets</h5>
                      <p className="text-muted small">View your submitted tickets</p>
                      <button className="btn btn-sm" style={{ backgroundColor: '#006B3C', color: 'white' }} disabled>
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <RequesterProvider>
      <BrowserRouter>
        <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/create-ticket" element={<CreateTicket />} />
          </Routes>
        </div>
      </BrowserRouter>
    </RequesterProvider>
  );
}

export default App;
