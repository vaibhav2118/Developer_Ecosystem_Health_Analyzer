import React, { useEffect, useState } from 'react';
import { FileText, Download, Play, RefreshCw } from 'lucide-react';

interface RepoSummary {
  id: number;
  name: string;
  full_name: string;
}

interface ReportItem {
  id: number;
  repository_name: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

export const ReportsCenter: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [repositories, setRepositories] = useState<RepoSummary[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('');
  
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchReports();
    fetchRepositories();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (e) {
      console.error("Failed to load generated reports:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/repositories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRepositories(data);
        if (data.length > 0) {
          setSelectedRepoId(data[0].id.toString());
        }
      }
    } catch (e) {
      console.error("Failed to load repositories for reports:", e);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setIsCompiling(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          repository_id: parseInt(selectedRepoId),
          name: reportTitle || 'Ecosystem Intelligence Health Audit'
        })
      });

      if (response.ok) {
        setMsg({ text: 'PDF Report compiled and ready for download!', type: 'success' });
        setReportTitle('');
        fetchReports();
      } else {
        const data = await response.json();
        setMsg({ text: data.detail || 'PDF compilation failed.', type: 'error' });
      }
    } catch (e) {
      setMsg({ text: 'Connection failed.', type: 'error' });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownload = async (id: number, filename: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/reports/download/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        // Trigger file download in browser
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('File download failed. The report PDF might have been cleaned from storage.');
      }
    } catch (e) {
      alert('Network error during download.');
    }
  };

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>Reports Center</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Generate, schedule, and download production-grade PDF executive review reports.
        </p>
      </div>

      {msg && (
        <div style={{
          background: msg.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          border: `1px solid ${msg.type === 'success' ? 'var(--status-success)' : 'var(--status-error)'}44`,
          color: msg.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Reports List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Generated PDF Reports</h3>
          
          {loading ? (
            <div className="skeleton" style={{ height: '150px' }} />
          ) : reports.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', height: '32px' }}>
                    <th style={{ padding: '8px 12px' }}>Report Name</th>
                    <th style={{ padding: '8px 12px' }}>Repository</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                    <th style={{ padding: '8px 12px' }}>Created At</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((rep) => (
                    <tr key={rep.id} style={{ borderBottom: '1px solid var(--border-color)33', height: '48px' }}>
                      <td style={{ padding: '8px 12px', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={14} color="var(--text-secondary)" />
                          <span>{rep.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{rep.repository_name}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          background: rep.status === 'completed' ? 'var(--status-success-bg)' : 'var(--bg-tertiary)',
                          color: rep.status === 'completed' ? 'var(--status-success)' : 'var(--text-secondary)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>{rep.status}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-tertiary)' }}>
                        {new Date(rep.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        {rep.status === 'completed' && (
                          <button
                            onClick={() => handleDownload(rep.id, `${rep.repository_name.replace('/', '_')}_report.pdf`)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--brand-primary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            <Download size={14} /> Download
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '30px' }}>
              No reports have been compiled yet. Use the right panel to compile one.
            </div>
          )}
        </div>

        {/* Generate Report Form */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Request Health Audit</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '18px' }}>
            Choose a registered repository and enter a report subtitle to compile a formal, multi-page ReportLab PDF evaluation sheet.
          </p>

          <form onSubmit={handleCreateReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Target Repository</label>
              <select
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
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
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>{repo.full_name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Report Subtitle / Reference</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. Q3 Vendor Security Assessment"
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

            <button
              type="submit"
              disabled={isCompiling || !selectedRepoId}
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
                cursor: (isCompiling || !selectedRepoId) ? 'not-allowed' : 'pointer',
                marginTop: '6px'
              }}
            >
              {isCompiling ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>{isCompiling ? 'Compiling PDF...' : 'Generate Report'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ReportsCenter;
