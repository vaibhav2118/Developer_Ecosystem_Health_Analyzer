import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, GitBranch, Star, AlertTriangle, 
  User, Activity 
} from 'lucide-react';
import { 
  Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

interface DashboardStats {
  total_repositories: number;
  total_stars: number;
  total_forks: number;
  active_alerts: number;
  average_health_score: number;
  health_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  recent_activity: Array<{
    id: number;
    username: string;
    action: string;
    details: string;
    created_at: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, alertsRes] = await Promise.all([
        fetch('http://localhost:8000/api/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/api/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsRes.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (statsRes.ok && alertsRes.ok) {
        const statsData = await statsRes.json();
        const alertsData = await alertsRes.json();
        setStats(statsData);
        setAlerts(alertsData);
      }
    } catch (e) {
      console.error("Failed to load dashboard summary:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ height: '40px', width: '250px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
          <div className="skeleton" style={{ height: '120px' }} />
          <div className="skeleton" style={{ height: '120px' }} />
          <div className="skeleton" style={{ height: '120px' }} />
          <div className="skeleton" style={{ height: '120px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '20px' }}>
          <div className="skeleton" style={{ height: '300px' }} />
          <div className="skeleton" style={{ height: '300px' }} />
        </div>
      </div>
    );
  }

  // Formatting for Recharts
  const distributionData = stats ? [
    { name: 'Highly Viable (>=75)', value: stats.health_distribution.high, color: '#10b981' },
    { name: 'Stable (50-74)', value: stats.health_distribution.medium, color: '#f59e0b' },
    { name: 'Critical Risk (<50)', value: stats.health_distribution.low, color: '#ef4444' }
  ].filter(d => d.value > 0) : [];

  const getAlertIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return <ShieldAlert size={16} color="var(--status-error)" />;
      default:
        return <AlertTriangle size={16} color="var(--status-warning)" />;
    }
  };

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>Ecosystem Operations Console</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Real-time aggregates of tracked open-source software dependency repositories.
        </p>
      </div>

      {/* Aggregate Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '20px' }}>
            <div style={{ flex: '1' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tracked Repos
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px' }}>{stats.total_repositories}</h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--brand-primary)' }}>
              <GitBranch size={22} />
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '20px' }}>
            <div style={{ flex: '1' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Aggregate Stars
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px' }}>{stats.total_stars.toLocaleString()}</h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--status-warning)' }}>
              <Star size={22} />
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '20px' }}>
            <div style={{ flex: '1' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Avg Health Index
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: stats.average_health_score >= 70 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                {stats.average_health_score}/100
              </h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--status-success)' }}>
              <Activity size={22} />
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '20px' }}>
            <div style={{ flex: '1' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Warnings
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: stats.active_alerts > 0 ? 'var(--status-error)' : 'var(--text-primary)' }}>
                {stats.active_alerts}
              </h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--status-error)' }}>
              <ShieldAlert size={22} />
            </div>
          </div>
        </div>
      )}

      {/* Visualizations row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Health Distribution Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '320px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Portfolio Health Segmentation</h3>
          {distributionData.length > 0 ? (
            <div style={{ flex: '1', width: '100%', height: '100%', minHeight: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} repos`, 'Count']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '1', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>
              No health data available. Add repositories first.
            </div>
          )}
        </div>

        {/* Actionable Alerts Dashboard */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '320px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Operational Risk Warnings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '240px', flex: '1' }}>
            {alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    padding: '12px', 
                    background: 'var(--bg-primary)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{getAlertIcon(alert.severity)}</div>
                  <div style={{ flex: '1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                      <span>{alert.repository_name}</span>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: alert.severity === 'Critical' ? 'var(--status-error)' : 'var(--text-tertiary)' }}>
                        {alert.severity}
                      </span>
                    </div>
                    <p style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{alert.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '1', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>
                All systems clear! No active warning triggers.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs Trail */}
      {stats && stats.recent_activity && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Security & Audit Trail</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', height: '32px' }}>
                  <th style={{ padding: '8px 12px' }}>Actor</th>
                  <th style={{ padding: '8px 12px' }}>Event</th>
                  <th style={{ padding: '8px 12px' }}>Details</th>
                  <th style={{ padding: '8px 12px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_activity.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)33', height: '40px' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={12} color="var(--text-tertiary)" />
                        <span>{log.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        background: 'var(--bg-tertiary)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>{log.action.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{log.details}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-tertiary)' }}>
                      {new Date(log.created_at).toLocaleString()}
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
export default Dashboard;
