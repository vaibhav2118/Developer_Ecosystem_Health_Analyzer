import React from 'react';

interface HealthScores {
  overall_score: number;
  activity_score: number;
  community_score: number;
  security_score: number;
  sustainability_score: number;
  maintainability_score: number;
  confidence_interval_low?: number;
  confidence_interval_high?: number;
}

interface WidgetProps {
  scores: HealthScores;
}

export const HealthScoreWidget: React.FC<WidgetProps> = ({ scores }) => {
  const score = scores.overall_score;
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine color matching risk
  const getScoreColor = (val: number) => {
    if (val >= 75) return '#10b981'; // success green
    if (val >= 50) return '#f59e0b'; // warning amber
    return '#ef4444'; // error red
  };

  const getRiskLabel = (val: number) => {
    if (val >= 75) return 'LOW RISK';
    if (val >= 50) return 'MEDIUM RISK';
    return 'CRITICAL RISK';
  };

  const subscoreLabels = [
    { label: 'Activity & Velocity', key: 'activity_score' as keyof HealthScores },
    { label: 'Community Health', key: 'community_score' as keyof HealthScores },
    { label: 'Security Posture', key: 'security_score' as keyof HealthScores },
    { label: 'Contributor Sustainability', key: 'sustainability_score' as keyof HealthScores },
    { label: 'Maintainability', key: 'maintainability_score' as keyof HealthScores },
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Circle Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg height="130" width="130" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              stroke="var(--border-color)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx="65"
              cy="65"
            />
            <circle
              stroke={getScoreColor(score)}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              r={normalizedRadius}
              cx="65"
              cy="65"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>
              {Math.round(score)}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600' }}>
              OUT OF 100
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '800',
            color: getScoreColor(score),
            background: getScoreColor(score) + '22',
            padding: '4px 10px',
            borderRadius: '12px',
            letterSpacing: '0.05em'
          }}>
            {getRiskLabel(score)}
          </div>
          {scores.confidence_interval_low !== undefined && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              CI: {scores.confidence_interval_low} - {scores.confidence_interval_high}
            </div>
          )}
        </div>
      </div>

      {/* Subscores List */}
      <div style={{ flex: '1', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ fontSize: '14px', letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
          Health Subscores
        </h4>
        {subscoreLabels.map((item) => {
          const val = scores[item.key] as number;
          return (
            <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontWeight: '600' }}>{Math.round(val)}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${val}%`,
                  height: '100%',
                  background: getScoreColor(val),
                  borderRadius: '3px',
                  transition: 'width 0.8s ease-in-out'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default HealthScoreWidget;
