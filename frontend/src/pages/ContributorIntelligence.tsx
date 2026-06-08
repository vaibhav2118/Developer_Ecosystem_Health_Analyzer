import React, { useEffect, useState } from 'react';
import { NetworkGraph } from '../components/NetworkGraph';
import { AlertOctagon, HelpCircle, Users, Activity, LogOut } from 'lucide-react';

interface ContributorMetrics {
  bus_factor: number;
  concentration_index: number;
  core_contributor_ratio: number;
  new_contributor_rate: number;
  churn_rate: number;
  retention_rate: number;
  total_active_contributors: number;
  contributor_distribution: Record<string, number>;
}

interface RepoData {
  id: number;
  name: string;
  full_name: string;
  contributor_metrics: ContributorMetrics;
  network_metrics: any;
}

export const ContributorIntelligence: React.FC = () => {
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRepoId, setSelectedRepoId] = useState<string>(localStorage.getItem('selectedRepoId') || '');

  useEffect(() => {
    // Reload on storage selection changes
    const handleStorageChange = () => {
      setSelectedRepoId(localStorage.getItem('selectedRepoId') || '');
    };
    
    window.addEventListener('storage', handleStorageChange);
    if (selectedRepoId) {
      fetchRepoDetails(selectedRepoId);
    } else {
      setLoading(false);
    }
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedRepoId]);

  const fetchRepoDetails = async (id: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/repositories/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRepoData(data);
      }
    } catch (e) {
      console.error("Failed to load repo contributor metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ height: '40px', width: '250px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div className="skeleton" style={{ height: '120px' }} />
          <div className="skeleton" style={{ height: '120px' }} />
          <div className="skeleton" style={{ height: '120px' }} />
        </div>
        <div className="skeleton" style={{ height: '380px', marginTop: '20px' }} />
      </div>
    );
  }

  if (!selectedRepoId || !repoData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
        No repository selected. Please select a repository in the topbar or register one in Repository Explorer.
      </div>
    );
  }

  const { contributor_metrics, network_metrics } = repoData;

  const getHhiLabel = (hhi: number) => {
    if (hhi >= 2500) return 'Highly Concentrated (Duopoly/Monopoly)';
    if (hhi >= 1500) return 'Moderately Concentrated';
    return 'Highly Distributed (Low Risk)';
  };

  const getHhiColor = (hhi: number) => {
    if (hhi >= 2500) return 'var(--status-error)';
    if (hhi >= 1500) return 'var(--status-warning)';
    return 'var(--status-success)';
  };

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>Contributor Intelligence</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Assess project sustainability, Bus Factor vulnerabilities, and collaboration bottle necks for <b>{repoData.full_name}</b>.
        </p>
      </div>

      {/* Contributor Key Numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        <div className="glass-card">
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bus Factor
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: contributor_metrics.bus_factor <= 1 ? 'var(--status-error)' : 'var(--text-primary)' }}>
            {contributor_metrics.bus_factor}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Min developers accounting for &gt;50% of commits.
          </p>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Concentration Index (HHI)
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: getHhiColor(contributor_metrics.concentration_index) }}>
            {contributor_metrics.concentration_index}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {getHhiLabel(contributor_metrics.concentration_index)}
          </p>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Contributor Retention
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: contributor_metrics.retention_rate >= 70 ? 'var(--status-success)' : 'var(--status-warning)' }}>
            {contributor_metrics.retention_rate}%
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Percentage of active developers retained over 90 days.
          </p>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Core Contributor Ratio
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px' }}>
            {Math.round(contributor_metrics.core_contributor_ratio * 100)}%
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Ratio of developers making &gt;10% of total commits.
          </p>
        </div>
      </div>

      {/* Network Visualization */}
      <NetworkGraph data={network_metrics} />

      {/* Commit Distribution Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Top Contributor Commit Shares</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {Object.entries(contributor_metrics.contributor_distribution).map(([username, count], idx) => (
            <div key={username} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-tertiary)' }}>#{idx + 1}</span>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{username}</span>
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><b>{count}</b> commits</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ContributorIntelligence;
