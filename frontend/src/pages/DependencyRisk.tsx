import React, { useEffect, useState } from 'react';
import { DependencyHeatmap } from '../components/DependencyHeatmap';
import { Package, ShieldCheck, AlertTriangle, Scale } from 'lucide-react';

interface Vulnerability {
  osv_id: string;
  title: string;
  severity: string;
  cvss_score: number;
}

interface Dependency {
  name: string;
  version: string;
  file_path: string;
  type: string;
  latest_version: string;
  age_days: number;
  popularity: number;
  maintenance_activity: string;
  staleness_score: number;
  vulnerability_score: number;
  license: string;
  vulnerabilities?: Vulnerability[];
}

interface RepoData {
  id: number;
  name: string;
  full_name: string;
  dependencies: Dependency[];
}

export const DependencyRisk: React.FC = () => {
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRepoId, setSelectedRepoId] = useState<string>(localStorage.getItem('selectedRepoId') || '');

  useEffect(() => {
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
      console.error("Failed to load repo dependencies:", e);
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

  const { dependencies } = repoData;
  const totalDeps = dependencies.length;
  const outdatedDeps = dependencies.filter(d => d.staleness_score > 0).length;
  const vulnDeps = dependencies.filter(d => d.vulnerability_score > 0).length;

  // Extract licenses
  const licenses = Array.from(new Set(dependencies.map(d => d.license).filter(Boolean)));

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>Dependency Intelligence Center</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Review dependency manifest files, freshness indices, and package security profiles for <b>{repoData.full_name}</b>.
        </p>
      </div>

      {/* Aggregate Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--brand-primary)' }}>
            <Package size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Total Libraries
            </span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>{totalDeps}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--status-warning)' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Outdated Libraries
            </span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>{outdatedDeps}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--status-error)' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Security Vulnerabilities
            </span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginTop: '4px', color: vulnDeps > 0 ? 'var(--status-error)' : 'var(--text-primary)' }}>
              {vulnDeps}
            </h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--accent-purple)' }}>
            <Scale size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Unique Licenses
            </span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>{licenses.length}</h3>
          </div>
        </div>
      </div>

      {/* Dependency Heatmap */}
      {dependencies.length > 0 ? (
        <DependencyHeatmap dependencies={dependencies} />
      ) : (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
          No dependencies found. Check that requirements.txt, package.json, pom.xml, or go.mod exist in repository.
        </div>
      )}

      {/* Manifest Grid Details Table */}
      {dependencies.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Dependency Manifest Details</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', height: '32px' }}>
                  <th style={{ padding: '8px 12px' }}>Package Name</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Installed</th>
                  <th style={{ padding: '8px 12px' }}>Latest Release</th>
                  <th style={{ padding: '8px 12px' }}>License</th>
                  <th style={{ padding: '8px 12px' }}>Staleness</th>
                  <th style={{ padding: '8px 12px' }}>Vulnerabilities</th>
                </tr>
              </thead>
              <tbody>
                {dependencies.map((dep, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)33', height: '40px' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600' }}>{dep.name}</td>
                    <td style={{ padding: '8px 12px', textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-secondary)' }}>{dep.type}</td>
                    <td style={{ padding: '8px 12px' }}>v{dep.version}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--status-success)', fontWeight: '500' }}>v{dep.latest_version}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                        {dep.license}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontWeight: '700', color: dep.staleness_score >= 50 ? 'var(--status-warning)' : 'var(--text-primary)' }}>
                        {Math.round(dep.staleness_score)}%
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {dep.vulnerabilities && dep.vulnerabilities.length > 0 ? (
                        <span style={{ background: 'var(--status-error-bg)', color: 'var(--status-error)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          {dep.vulnerabilities.length} CVE
                        </span>
                      ) : (
                        <span style={{ color: 'var(--status-success)', fontSize: '11px', fontWeight: '600' }}>Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default DependencyRisk;
