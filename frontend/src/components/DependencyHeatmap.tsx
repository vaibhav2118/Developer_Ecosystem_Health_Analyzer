import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Vulnerability {
  osv_id: string;
  title: string;
  summary?: string;
  severity: string;
  cvss_score: number;
  fixed_in?: string;
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

interface HeatmapProps {
  dependencies: Dependency[];
}

export const DependencyHeatmap: React.FC<HeatmapProps> = ({ dependencies }) => {
  const [selectedDep, setSelectedDep] = useState<Dependency | null>(null);

  const getRiskColor = (dep: Dependency) => {
    if (dep.vulnerability_score >= 30) return '#ef4444'; // critical red
    if (dep.vulnerability_score > 0) return '#f97316'; // high orange
    if (dep.staleness_score >= 50) return '#f59e0b'; // stale amber
    if (dep.staleness_score > 0) return '#3b82f6'; // minor stale blue
    return '#10b981'; // safe green
  };

  const getRiskLabel = (dep: Dependency) => {
    if (dep.vulnerability_score >= 30) return 'Critical CVE';
    if (dep.vulnerability_score > 0) return 'Vulnerable';
    if (dep.staleness_score >= 50) return 'Severely Stale';
    if (dep.staleness_score > 0) return 'Outdated';
    return 'Up-to-date';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Dependency Risk Heatmap</h3>
        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Click packages to inspect licensing and OSV CVE advisories</span>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Heatmap Grid */}
        <div style={{ flex: '2', minWidth: '320px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '12px'
          }}>
            {dependencies.map((dep, idx) => {
              const color = getRiskColor(dep);
              return (
                <div
                  key={`${dep.name}-${idx}`}
                  onClick={() => setSelectedDep(dep)}
                  style={{
                    background: color + '15',
                    border: `2px solid ${selectedDep?.name === dep.name ? 'var(--text-primary)' : color + '40'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  className="heatmap-tile"
                >
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px'
                  }}>
                    {getRiskLabel(dep)}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dep.name}>
                    {dep.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    v{dep.version}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Package Details */}
        <div style={{ flex: '1', minWidth: '280px' }}>
          <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Manifest Inspector
            </h4>
            
            {selectedDep ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{selectedDep.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ecosystem:</span>
                  <span style={{ textTransform: 'uppercase', fontWeight: '600' }}>{selectedDep.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Installed:</span>
                  <span>v{selectedDep.version}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Latest Version:</span>
                  <span style={{ color: 'var(--status-success)', fontWeight: '600' }}>v{selectedDep.latest_version}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Staleness Index:</span>
                  <span>{selectedDep.staleness_score}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>License:</span>
                  <span style={{
                    background: 'var(--bg-tertiary)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>{selectedDep.license}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Popularity index:</span>
                  <span>{selectedDep.popularity} / 100</span>
                </div>
                
                {/* Vulnerabilities Block */}
                {selectedDep.vulnerabilities && selectedDep.vulnerabilities.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ color: 'var(--status-error)', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={14} /> Security Advisories ({selectedDep.vulnerabilities.length})
                    </div>
                    {selectedDep.vulnerabilities.map((v, i) => (
                      <div key={i} style={{ background: 'var(--status-error-bg)', border: '1px solid var(--status-error)33', borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--status-error)' }}>{v.osv_id} ({v.severity})</div>
                        <div style={{ fontWeight: '600', fontSize: '12px', marginTop: '2px' }}>{v.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '14px' }}>{v.summary}</div>
                        {v.fixed_in && (
                          <div style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: '600', marginTop: '4px' }}>
                            Fixed in version: {v.fixed_in}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>
                Select a package from the grid on the left to inspect detailed version gaps, license details, and CVSS vulnerability details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DependencyHeatmap;
