import React, { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { RefreshCw, Play, CheckCircle } from 'lucide-react';

interface RepoSummary {
  id: number;
  name: string;
  full_name: string;
  language?: string;
  health_score?: number;
}

export const Navbar: React.FC = () => {
  const [repositories, setRepositories] = useState<RepoSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    fetchRepositories();
    
    // Listen for storage change events to keep selector in sync
    const handleStorageChange = () => {
      const stored = localStorage.getItem('selectedRepoId') || '';
      setSelectedId(stored);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchRepositories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/repositories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRepositories(data);
        
        // Pick default selected if none in storage
        const stored = localStorage.getItem('selectedRepoId');
        if (stored) {
          setSelectedId(stored);
        } else if (data.length > 0) {
          localStorage.setItem('selectedRepoId', data[0].id.toString());
          setSelectedId(data[0].id.toString());
          // Trigger global storage update event
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (e) {
      console.error("Failed to load repo list in topbar:", e);
    }
  };

  const handleRepoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    localStorage.setItem('selectedRepoId', id);
    window.dispatchEvent(new Event('storage'));
  };

  const handleManualAnalyze = async () => {
    if (!selectedId) return;
    const repo = repositories.find(r => r.id.toString() === selectedId);
    if (!repo) return;
    
    setIsAnalyzing(true);
    setStatusMessage('Scheduling scan...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/repositories/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ full_name: repo.full_name, frequency: 'weekly' })
      });
      
      if (response.ok) {
        setStatusMessage('Scan in progress. Reloading in 3s...');
        setTimeout(() => {
          setIsAnalyzing(false);
          setStatusMessage('');
          window.dispatchEvent(new Event('storage')); // trigger rerender
        }, 3000);
      } else {
        setIsAnalyzing(false);
        setStatusMessage('Scan request failed');
      }
    } catch (e) {
      setIsAnalyzing(false);
      setStatusMessage('Network error');
    }
  };

  return (
    <div style={{
      height: '70px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Selector Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
          Selected Repository:
        </span>
        {repositories.length > 0 ? (
          <select
            value={selectedId}
            onChange={handleRepoChange}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name} {r.health_score ? `(${Math.round(r.health_score)}/100)` : ''}
              </option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No repositories registered. Explorer repository list to add.
          </span>
        )}

        {selectedId && (
          <button
            onClick={handleManualAnalyze}
            disabled={isAnalyzing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              opacity: isAnalyzing ? 0.6 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
            <span>{isAnalyzing ? 'Evaluating...' : 'Scan Now'}</span>
          </button>
        )}

        {statusMessage && (
          <span style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: '500' }}>
            {statusMessage}
          </span>
        )}
      </div>

      {/* Control Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ThemeToggle />
      </div>
    </div>
  );
};
export default Navbar;
