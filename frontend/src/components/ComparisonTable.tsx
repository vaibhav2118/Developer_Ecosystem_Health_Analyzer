import React from 'react';

interface RepoComparisonData {
  id: number;
  name: string;
  full_name: string;
  language: string;
  stars: number;
  forks: number;
  open_issues: number;
  contributors_count: number;
  bus_factor: number;
  pr_merge_time_hours: number;
  overall_score: number;
  activity_score: number;
  community_score: number;
  security_score: number;
  sustainability_score: number;
  maintainability_score: number;
}

interface BenchmarkData {
  stars: number;
  forks: number;
  open_issues: number;
  overall_score: number;
  activity_score: number;
  community_score: number;
  security_score: number;
  sustainability_score: number;
  maintainability_score: number;
  bus_factor: number;
}

interface CompareProps {
  data: {
    repositories: RepoComparisonData[];
    benchmarks: BenchmarkData;
  };
}

export const ComparisonTable: React.FC<CompareProps> = ({ data }) => {
  const { repositories, benchmarks } = data;

  const getScoreColor = (val: number) => {
    if (val >= 75) return 'var(--status-success)';
    if (val >= 50) return 'var(--status-warning)';
    return 'var(--status-error)';
  };

  const rows = [
    { label: 'Language', key: 'language', formatter: (val: any) => val || 'N/A' },
    { label: 'GitHub Stars', key: 'stars', formatter: (val: any) => val.toLocaleString() },
    { label: 'GitHub Forks', key: 'forks', formatter: (val: any) => val.toLocaleString() },
    { label: 'Open Issues', key: 'open_issues', formatter: (val: any) => val.toLocaleString() },
    { label: 'Bus Factor', key: 'bus_factor', formatter: (val: any) => val },
    { label: 'Active Contributors', key: 'contributors_count', formatter: (val: any) => val },
    
    // Scores
    { label: 'Overall Health Index', key: 'overall_score', isScore: true, formatter: (val: any) => `${Math.round(val)}/100` },
    { label: 'Activity Index', key: 'activity_score', isScore: true, formatter: (val: any) => `${Math.round(val)}/100` },
    { label: 'Community Index', key: 'community_score', isScore: true, formatter: (val: any) => `${Math.round(val)}/100` },
    { label: 'Security Index', key: 'security_score', isScore: true, formatter: (val: any) => `${Math.round(val)}/100` },
    { label: 'Sustainability Index', key: 'sustainability_score', isScore: true, formatter: (val: any) => `${Math.round(val)}/100` },
    { label: 'Maintainability Index', key: 'maintainability_score', isScore: true, formatter: (val: any) => `${Math.round(val)}/100` },
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>Evaluation Metric</th>
            {repositories.map((repo) => (
              <th key={repo.id} style={{ padding: '16px 12px' }}>
                <div style={{ fontSize: '15px', fontWeight: '800' }}>{repo.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                  {repo.full_name}
                </div>
              </th>
            ))}
            <th style={{ padding: '16px 12px', background: 'var(--bg-tertiary)', borderRadius: '4px 4px 0 0' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>OSPO Benchmark</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Industry Standard</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
              <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{row.label}</td>
              {repositories.map((repo) => {
                const val = (repo as any)[row.key];
                return (
                  <td key={repo.id} style={{
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: row.isScore ? '700' : '400',
                    color: row.isScore ? getScoreColor(val) : 'var(--text-primary)'
                  }}>
                    {row.formatter(val)}
                  </td>
                );
              })}
              {/* Benchmark value */}
              <td style={{
                padding: '12px',
                fontSize: '13px',
                fontWeight: row.isScore ? '700' : '400',
                background: 'var(--bg-tertiary)',
                color: row.isScore ? getScoreColor((benchmarks as any)[row.key]) : 'var(--text-secondary)'
              }}>
                {(benchmarks as any)[row.key] !== undefined 
                  ? row.formatter((benchmarks as any)[row.key])
                  : 'N/A'
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default ComparisonTable;
