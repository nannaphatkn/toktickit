import { useState } from 'react';

import './App.css';

interface Category {
  id: string;
  name: string;
}

function App() {
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkSystem = async () => {
    setLoading(true);
    setError(null);
    setSystemStatus(null);
    setCategories([]);

    try {
      const [healthRes, categoriesRes] = await Promise.all([
        fetch('http://localhost:5001/api/health'),
        fetch('http://localhost:5001/api/categories')
      ]);

      if (!healthRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch from API');
      }

      const healthData = await healthRes.json();
      const categoriesData = await categoriesRes.json();

      setSystemStatus(healthData.status === 'ok' ? 'Online' : 'Offline');
      setCategories(categoriesData);
    } catch (err) {
      console.error(err);
      setSystemStatus('Offline');
      setError('Unable to connect to TokTickIT API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card p-4 shadow-sm" style={{ border: '1px solid black', borderRadius: '0' }}>
        <h4 className="mb-4">TokTickIT IT Service Desk</h4>
        
        <div className="mb-4">
          <button 
            className="btn btn-outline-dark" 
            style={{ borderRadius: '0', padding: '0.375rem 1rem' }}
            onClick={checkSystem}
            disabled={loading}
          >
            [ Check System ]
          </button>
        </div>

        {loading && (
          <div className="mt-3">
            <p>⏳ "loading"...</p>
          </div>
        )}

        {systemStatus && (
          <div className="mt-4" style={{ fontFamily: 'monospace' }}>
            <p className="mb-3">System Status: {systemStatus}</p>
            
            {error && (
              <p className="text-danger">{error}</p>
            )}

            {categories.length > 0 && (
              <div>
                <p className="mb-2">Supported Request Categories</p>
                <ul className="list-unstyled mb-0" style={{ paddingLeft: '1rem' }}>
                  {categories.map((category, index) => (
                    <li key={category.id}>{index + 1}. {category.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
