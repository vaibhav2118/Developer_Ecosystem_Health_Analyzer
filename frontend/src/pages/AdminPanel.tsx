import React, { useEffect, useState } from 'react';
import { ShieldAlert, Clock, User } from 'lucide-react';

interface AuditLog {
  id: number;
  user_id?: number;
  username: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export const AdminPanel: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.roles ? user.roles[0] : '');
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to load audit trail logs:", e);
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'Admin' && userRole !== 'Analyst') {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '60vh' }}>
        <ShieldAlert size={48} color="var(--status-error)" />
        <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Unauthorized Access</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: '380px' }}>
          Your current account role (<b>{userRole || 'Viewer'}</b>) does not possess sufficient privileges to inspect administrative security logs.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>Admin Console</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Inspect global system events, repository scans, and user audit trails.
        </p>
      </div>

      {/* Audit table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} /> Platform Activity Trail
        </h3>
        
        {loading ? (
          <div className="skeleton" style={{ height: '200px' }} />
        ) : logs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', height: '32px' }}>
                  <th style={{ padding: '8px 12px' }}>Timestamp</th>
                  <th style={{ padding: '8px 12px' }}>User</th>
                  <th style={{ padding: '8px 12px' }}>Action</th>
                  <th style={{ padding: '8px 12px' }}>Target Category</th>
                  <th style={{ padding: '8px 12px' }}>Details Log</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Target ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)33', height: '40px' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--text-tertiary)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={12} color="var(--text-tertiary)" />
                        <span>{log.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>{log.action.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '8px 12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {log.target_type}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{log.details}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-tertiary)' }}>
                      {log.target_id || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '30px' }}>
            No platform events logged yet.
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminPanel;
