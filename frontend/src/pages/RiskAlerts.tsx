import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

interface AlertItem {
  id: number;
  repository_id: number;
  repository_name: string;
  type: string;
  severity: string;
  message: string;
  description: string;
  recommendation?: string;
  created_at: string;
}

export const RiskAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, typeFilter]);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:8000/api/alerts';
      const params = [];
      if (severityFilter) params.push(`severity=${severityFilter}`);
      if (typeFilter) params.push(`type=${typeFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error("Failed to load global alerts:", e);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return '#ef4444'; // red
      case 'high': return '#f97316'; // orange
      case 'medium': return '#f59e0b'; // amber
      default: return '#3b82f6'; // blue
    }
  };

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>Risk Alerts Center</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Evaluate active operational exceptions, dependency staleness warnings, and licensing policy risks.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Filters:</div>
        
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
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
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
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
          <option value="">All Categories</option>
          <option value="security">Security Posture</option>
          <option value="dependency">Dependency Staleness</option>
          <option value="bus_factor">Bus Factor SPOFs</option>
          <option value="maintenance">Maintenance Velocity</option>
          <option value="contributor_departure">Contributor Departure Churn</option>
        </select>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="skeleton" style={{ height: '120px' }} />
          <div className="skeleton" style={{ height: '120px' }} />
        </div>
      ) : alerts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {alerts.map((alert) => {
            const color = getAlertColor(alert.severity);
            return (
              <div
                key={alert.id}
                className="glass-card"
                style={{
                  borderLeft: `4px solid ${color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {alert.repository_name}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      background: color + '15',
                      color: color,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {alert.severity}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    Triggered: {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: '700' }}>
                  {alert.message}
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '18px' }}>
                  {alert.description}
                </p>

                {alert.recommendation && (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px 16px',
                    background: 'var(--bg-primary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px'
                  }}>
                    <div style={{ color: 'var(--brand-primary)', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Info size={14} /> OSPO Recommendation
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>{alert.recommendation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '14px' }}>
          No active warnings logged for current filter criteria.
        </div>
      )}
    </div>
  );
};
export default RiskAlerts;
