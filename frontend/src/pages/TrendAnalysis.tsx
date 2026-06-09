import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface RepoData {
  id: number;
  name: string;
  full_name: string;
  score_history: Array<{
    date: string;
    overall_score: number;
    activity_score: number;
    community_score: number;
    security_score: number;
    sustainability_score: number;
    maintainability_score: number;
  }>;
  forecasts: {
    trend_direction: string;
    slope: number;
    weekly_commit_history: number[];
    forecast_commits: number[];
    forecast_contributors: number[];
    forecast_maintenance_risk: number[];
    current_maintenance_risk: number;
    projected_maintenance_risk_level: string;
  };
}

export const TrendAnalysis: React.FC = () => {
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
      console.error("Failed to load repo forecasts:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ height: '40px', width: '250px' }} />
        <div className="skeleton" style={{ height: '300px' }} />
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

  const { score_history, forecasts } = repoData;

  // Format historical score dates for chart
  const historyChartData = score_history.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString()
  }));

  // Format weekly commits + forecast
  // history has indices 0-7, forecast has 8-19
  const combinedCommitsData: any[] = [];
  forecasts.weekly_commit_history.forEach((val, idx) => {
    combinedCommitsData.push({
      weekLabel: `Wk -${8 - idx}`,
      actualCommits: val,
      projectedCommits: null
    });
  });
  
  // Link history endpoint to forecast
  if (combinedCommitsData.length > 0) {
    combinedCommitsData[combinedCommitsData.length - 1].projectedCommits = forecasts.weekly_commit_history[forecasts.weekly_commit_history.length - 1];
  }

  forecasts.forecast_commits.forEach((val, idx) => {
    combinedCommitsData.push({
      weekLabel: `Wk +${idx + 1}`,
      actualCommits: null,
      projectedCommits: val
    });
  });

  // Format risk forecast
  const riskChartData = forecasts.forecast_maintenance_risk.map((val, idx) => ({
    weekLabel: `Wk +${idx + 1}`,
    riskScore: val
  }));

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'var(--status-error)';
      case 'medium': return 'var(--status-warning)';
      default: return 'var(--status-success)';
    }
  };

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>Trend Forecasting Dashboard</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Evaluate historical scoring indicators and project operational risk indexes for <b>{repoData.full_name}</b>.
        </p>
      </div>

      {/* Stats Forecaster widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        <div className="glass-card">
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>
            Velocity Slope
          </span>
          <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {forecasts.slope > 0 ? '+' : ''}{forecasts.slope}
            {forecasts.trend_direction === 'upward' ? (
              <TrendingUp size={20} color="var(--status-success)" />
            ) : forecasts.trend_direction === 'downward' ? (
              <TrendingDown size={20} color="var(--status-error)" />
            ) : (
              <Activity size={20} color="var(--text-tertiary)" />
            )}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Commit growth rate direction: <b style={{ textTransform: 'uppercase' }}>{forecasts.trend_direction}</b>
          </p>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase' }}>
            Projected Maintenance Risk
          </span>
          <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', color: getRiskColor(forecasts.projected_maintenance_risk_level) }}>
            {forecasts.projected_maintenance_risk_level.toUpperCase()}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Calculated risk over next 90 days.
          </p>
        </div>
      </div>

      {/* Historical line chart */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '380px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Historical Health Index Trends</h3>
        {score_history.length > 0 ? (
          <div style={{ flex: '1', width: '100%', height: '100%', minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyChartData}>
                <XAxis dataKey="formattedDate" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--text-tertiary)" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="overall_score" name="Overall Health" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="security_score" name="Security" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="sustainability_score" name="Sustainability" stroke="#8b5cf6" strokeWidth={1.5} />
                <Line type="monotone" dataKey="activity_score" name="Activity" stroke="#10b981" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '1', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>
            Not enough score historical snapshots. Run scan manual jobs to generate entries.
          </div>
        )}
      </div>

      {/* Scikit-Learn forecasts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Commits forecasts */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '320px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Commit Velocity Forecast (12 Weeks)</h3>
          <div style={{ flex: '1', width: '100%', height: '100%', minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedCommitsData}>
                <XAxis dataKey="weekLabel" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actualCommits" name="Weekly Commits (History)" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="projectedCommits" name="Projected Commits (ML Forecast)" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance risk forecasts */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '320px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Projected Attrition & Maintenance Risk</h3>
          <div style={{ flex: '1', width: '100%', height: '100%', minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskChartData}>
                <XAxis dataKey="weekLabel" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--text-tertiary)" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="riskScore" name="Attrition Risk Index" stroke="#ec4899" fill="rgba(236, 72, 153, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TrendAnalysis;
