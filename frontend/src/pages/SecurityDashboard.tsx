import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, AlertOctagon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Vulnerability {
  osv_id: string;
  title: string;
  summary: string;
  details: string;
  severity: string;
  cvss_score: number;
  fixed_in?: string;
  affected_versions?: string;
  packageName: string;
}

interface RepoData {
  id: number;
  name: string;
  full_name: string;
  scores: {
    security_score: number;
  };
  dependencies: Array<{
    name: string;
    vulnerabilities: Array<{
      osv_id: string;
      title: string;
      summary: string;
      details: string;
      severity: string;
      cvss_score: number;
      fixed_in?: string;
      affected_versions?: string;
    }>;
  }>;
}

export const SecurityDashboard: React.FC = () => {
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
      console.error("Failed to load repo security details:", e);
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
        <div className="skeleton" style={{ height: '300px', marginTop: '20px' }} />
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

  // Extract all vulnerabilities with package references
  const vulns: Vulnerability[] = [];
  repoData.dependencies.forEach((dep) => {
    if (dep.vulnerabilities) {
      dep.vulnerabilities.forEach((v) => {
        vulns.push({
          ...v,
          packageName: dep.name
        });
      });
    }
  });

  // Calculate severity statistics
  const severityCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };

  vulns.forEach((v) => {
    const sev = v.severity.toUpperCase();
    if (sev in severityCounts) {
      severityCounts[sev as keyof typeof severityCounts] += 1;
    } else {
      severityCounts.MEDIUM += 1; // Default fallback
    }
  });

  const chartData = [
    { name: 'Critical', value: severityCounts.CRITICAL, fill: '#ef4444' },
    { name: 'High', value: severityCounts.HIGH, fill: '#f97316' },
    { name: 'Medium', value: severityCounts.MEDIUM, fill: '#f59e0b' },
    { name: 'Low', value: severityCounts.LOW, fill: '#3b82f6' }
  ];

  const secScore = repoData.scores?.security_score || 0.0;
  const getScoreColor = (val: number) => {
    if (val >= 75) return 'var(--status-success)';
    if (val >= 50) return 'var(--status-warning)';
    return 'var(--status-error)';
  };

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>Security Intelligence Dashboard</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Evaluate CVE advisories, CVSS distributions, and library vulnerabilities for <b>{repoData.full_name}</b>.
        </p>
      </div>

      {/* Security Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: getScoreColor(secScore) }}>
            <Shield size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Security Posture Index
            </span>
            <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', color: getScoreColor(secScore) }}>
              {Math.round(secScore)}/100
            </h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--status-error)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Critical CVE Warnings
            </span>
            <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', color: severityCounts.CRITICAL > 0 ? 'var(--status-error)' : 'var(--text-primary)' }}>
              {severityCounts.CRITICAL}
            </h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--status-warning)' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>
              High/Medium Vulnerabilities
            </span>
            <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', color: (severityCounts.HIGH + severityCounts.MEDIUM) > 0 ? 'var(--status-warning)' : 'var(--text-primary)' }}>
              {severityCounts.HIGH + severityCounts.MEDIUM}
            </h3>
          </div>
        </div>
      </div>

      {/* Chart and distribution details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Severity Distribution Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '320px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Vulnerability Severity Distribution</h3>
          {vulns.length > 0 ? (
            <div style={{ flex: '1', width: '100%', height: '100%', minHeight: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '1', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>
              Great job! No package vulnerabilities detected.
            </div>
          )}
        </div>

        {/* Detailed Vulnerability list */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '320px', flex: '1.5' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Active CVE Security Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '300px', flex: '1' }}>
            {vulns.length > 0 ? (
              vulns.map((v, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '16px', 
                    background: 'var(--bg-primary)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--status-error)' }}>{v.osv_id}</span>
                      <span style={{ fontSize: '11px', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '12px' }}>
                        {v.packageName}
                      </span>
                    </div>
                    <span style={{
                      fontWeight: '700',
                      fontSize: '11px',
                      color: v.severity === 'CRITICAL' ? 'var(--status-error)' : 'var(--text-secondary)'
                    }}>
                      CVSS: {v.cvss_score} ({v.severity})
                    </span>
                  </div>
                  
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{v.title}</div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '18px' }}>{v.details || v.summary}</p>
                  
                  {v.fixed_in && (
                    <div style={{ fontSize: '12px', color: 'var(--status-success)', fontWeight: '600', marginTop: '4px' }}>
                      Remediation action: Upgrade package to version <b>{v.fixed_in}</b> or newer.
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '1', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>
                All clear! No active advisories.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SecurityDashboard;
