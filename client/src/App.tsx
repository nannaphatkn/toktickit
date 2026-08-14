import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';
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
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="Hero" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>TokTickIT IT Service Desk</h1>
        </div>
        
        <button
          type="button"
          className="counter"
          onClick={checkSystem}
          disabled={loading}
          style={{ marginBottom: '20px' }}
        >
          {loading ? '⏳ "loading"...' : '[ Check System ]'}
        </button>

        {systemStatus && (
          <div style={{ textAlign: 'left', display: 'inline-block', minWidth: '300px', backgroundColor: '#f9f9f9', color: '#333', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>System Status: {systemStatus}</p>
            
            {error && (
              <p style={{ color: '#d32f2f', margin: '0' }}>{error}</p>
            )}

            {categories.length > 0 && (
              <>
                <p style={{ margin: '15px 0 10px 0', fontWeight: 'bold' }}>Supported Request Categories</p>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {categories.map((category, index) => (
                    <li key={category.id} style={{ marginBottom: '5px' }}>{index + 1}. {category.name}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  );
}

export default App;

