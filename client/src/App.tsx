import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CreateTicket from './pages/CreateTicket';
import { RequesterProvider } from './contexts/RequesterContext';
import { useRequester } from './contexts/requesterContextCore';
import Navbar from './components/Navbar';
import RequesterPrompt from './components/RequesterPrompt';
import MyTickets from './pages/MyTickets';

function MainContent() {
  const { requester } = useRequester();

  if (!requester) {
    return (
      <RequesterPrompt
        title="🎫 Welcome to TokTickIT"
        message="Please select a Development Requester from the dropdown above to get started."
      />
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm border-0" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="card-body p-4">
              <h3 style={{ color: 'var(--primary)' }}>Welcome, {requester.name}! 👋</h3>
              <p className="text-muted">You are logged in as a Development Requester.</p>
              <hr />
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="card h-100 border-0" style={{ backgroundColor: '#F0FAF5' }}>
                    <div className="card-body text-center p-4">
                      <h5 style={{ color: 'var(--primary)' }}>📝 Create Ticket</h5>
                      <p className="text-muted small">Submit a new support request with attachments</p>
                      <Link to="/create-ticket" className="btn btn-zen-primary btn-sm">
                        Create Ticket
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100 border-0" style={{ backgroundColor: '#F0FAF5' }}>
                    <div className="card-body text-center p-4">
                      <h5 style={{ color: 'var(--primary)' }}>📋 My Tickets</h5>
                      <p className="text-muted small">View and manage your submitted tickets</p>
                      <Link to="/my-tickets" className="btn btn-zen-primary btn-sm">
                        View My Tickets
                      </Link>
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
        <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--bg)' }}>
          <Navbar />
          <main id="main-content" className="main-content pb-5">
            <Routes>
              <Route path="/" element={<MainContent />} />
              <Route path="/create-ticket" element={<CreateTicket />} />
              <Route path="/my-tickets" element={<MyTickets />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </RequesterProvider>
  );
}

export default App;
