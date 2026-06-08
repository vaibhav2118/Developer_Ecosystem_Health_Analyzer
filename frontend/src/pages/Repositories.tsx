import React, { useEffect, useState } from 'react';
import { Search, Plus, GitBranch, ShieldAlert, Star, RefreshCw } from 'lucide-react';

interface RepoItem {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  language?: string;
  last_scanned_at?: string;
  health_score?: number;
  alerts_count: number;
}

export const Repositories: React.FC = () => {
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [langFilter, setLangFilter] = useState<string>('');
  const [newRepoName, setNewRepoName] = useState<string>('');
  const [scanFrequency, setScanFrequency] = useState<string>('weekly');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchRepositories();
  }, [search, langFilter]);

  const fetchRepositories = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:8000/api/repositories';
      const params = [];
      if (search) params.push(`search=${search}`);
      if (langFilter) params.push(`language=${langFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRepos(data);
      }
    } catch (e) {
      console.error("Failed to load repo list:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/repositories/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ full_name: newRepoName, frequency: scanFrequency })
      });

      if (response.ok) {
        setSuccessMsg('Repository registered. Analysis scheduled!');
        setNewRepoName('');
        fetchRepositories();
        // Trigger navbar update
        window.dispatchEvent(new Event('storage'));
      } else {
        const data = await response.json();
        setErrorMsg(data.detail || 'Analysis request failed.');
      }
    } catch (e) {
      setErrorMsg('Connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectRepository = (id: number) => {
    localStorage.setItem('selectedRepoId', id.toString());
    window.dispatchEvent(new Event('storage')); // update topbar selection
    setSuccessMsg('Repository focus updated.');
  };

  const getScoreColor = (val?: number) => {
    if (!val) return 'var(--text-tertiary)';
    if (val >= 75) return 'var(--status-success)';
    if (val >= 50) return 'var(--status-warning)';
    return 'var(--status-error)';
  };

  // Extract unique languages for filter dropdown
  const uniqueLanguages = Array.from(new Set(repos.map(r => r.language).filter(Boolean)));

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>Repository Explorer</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Monitor, query, and register open-source software libraries.
        </p>
      </div>

      {successMsg && (
        <div style={{ background: 'var(--status-success-bg)', border: '1px solid var(--status-success)44', color: 'var(--status-success)', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Repository Grid List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '6px 12px' }}>
              <Search size={14} color="var(--text-tertiary)" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories..."
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', width: '100%' }}
              />
            </div>

            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Languages</option>
              {uniqueLanguages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Grid list */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton" style={{ height: '100px' }} />
              <div className="skeleton" style={{ height: '100px' }} />
            </div>
          ) : repos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => selectRepository(repo.id)}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '20px 24px',
                    borderLeft: `4px solid ${getScoreColor(repo.health_score)}`
                  }}
                >
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '800' }}>{repo.full_name}</span>
                      {repo.language && (
                        <span style={{ fontSize: '11px', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                          {repo.language}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical' }}>
                      {repo.description || 'No description provided.'}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={12} /> {repo.stars.toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <GitBranch size={12} /> {repo.forks.toLocaleString()}
                      </div>
                      {repo.last_scanned_at && (
                        <div>Last Scanned: {new Date(repo.last_scanned_at).toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingLeft: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '700', letterSpacing: '0.05em' }}>HEALTH</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: getScoreColor(repo.health_score) }}>
                        {repo.health_score ? Math.round(repo.health_score) : '—'}
                      </div>
                    </div>

                    {repo.alerts_count > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--status-error)' }}>
                        <ShieldAlert size={20} />
                        <span style={{ fontSize: '10px', fontWeight: '700', marginTop: '2px' }}>{repo.alerts_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '14px' }}>
              No repositories found matching current criteria.
            </div>
          )}
        </div>

        {/* Register Side Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Register Repository</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '18px' }}>
            Submit a GitHub repository path (e.g. <code>owner/repo</code>) to trigger immediate health index collection.
          </p>

          {errorMsg && (
            <div style={{ background: 'var(--status-error-bg)', border: '1px solid var(--status-error)44', color: 'var(--status-error)', padding: '8px 10px', borderRadius: '4px', fontSize: '12px' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAddRepo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Full GitHub Name</label>
              <input
                type="text"
                required
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value)}
                placeholder="e.g. fastapi/fastapi"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Scan Interval</label>
              <select
                value={scanFrequency}
                onChange={(e) => setScanFrequency(e.target.value)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="daily">Daily Analysis</option>
                <option value="weekly">Weekly Analysis</option>
                <option value="monthly">Monthly Analysis</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-purple))',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>{isSubmitting ? 'Submitting...' : 'Analyze Repository'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Repositories;
