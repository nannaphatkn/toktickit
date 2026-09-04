import { useState, useEffect } from 'react';
import { useRequester, type Requester } from '../contexts/RequesterContext';

export default function RequesterSelector() {
  const { requester, setRequester } = useRequester();
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequesters() {
      try {
        const res = await fetch('http://localhost:5001/api/requesters');
        if (!res.ok) throw new Error('Failed to fetch requesters');
        const data: Requester[] = await res.json();
        setRequesters(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load requesters');
      } finally {
        setLoading(false);
      }
    }
    fetchRequesters();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    if (selectedId === 0) {
      setRequester(null);
      return;
    }
    const selected = requesters.find((r) => r.id === selectedId);
    if (selected) {
      setRequester(selected);
    }
  };

  if (loading) {
    return (
      <select className="form-select form-select-sm" disabled style={{ width: '200px' }}>
        <option>Loading...</option>
      </select>
    );
  }

  if (error) {
    return (
      <select className="form-select form-select-sm" disabled style={{ width: '200px' }}>
        <option>{error}</option>
      </select>
    );
  }

  return (
    <select
      id="requester-selector"
      className="form-select form-select-sm"
      value={requester?.id ?? 0}
      onChange={handleChange}
      style={{ width: '220px' }}
    >
      <option value={0}>-- Select Requester --</option>
      {requesters.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </select>
  );
}
