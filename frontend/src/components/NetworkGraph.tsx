import React, { useEffect, useRef, useState } from 'react';

interface Node {
  id: string;
  group: number; // 1 = Core, 2 = Other
  degree_centrality: number;
  betweenness_centrality: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface NetworkData {
  nodes: Node[];
  links: Link[];
  density: number;
  average_clustering: number;
  spof_contributors: string[];
}

interface GraphProps {
  data: NetworkData;
}

export const NetworkGraph: React.FC<GraphProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  
  useEffect(() => {
    // Clone nodes to attach physics properties safely
    const initialNodes = data.nodes.map(n => ({
      ...n,
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 300,
      vx: 0,
      vy: 0
    }));
    setNodes(initialNodes);
  }, [data]);

  useEffect(() => {
    if (nodes.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Standard simple force-directed simulation step
    const step = () => {
      const k = 0.08; // spring constant
      const repulse = 150; // repulsion factor
      const damping = 0.85;

      // 1. Repulsion force between all nodes
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x! - n1.x!;
          const dy = n2.y! - n1.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1.0;
          
          if (dist < 180) {
            const force = repulse / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            n1.vx! -= fx;
            n1.vy! -= fy;
            n2.vx! += fx;
            n2.vy! += fy;
          }
        }
      }

      // 2. Attraction force along link edges
      data.links.forEach((link) => {
        const sourceNode = nodes.find(n => n.id === (typeof link.source === 'object' ? (link.source as any).id : link.source));
        const targetNode = nodes.find(n => n.id === (typeof link.target === 'object' ? (link.target as any).id : link.target));
        
        if (sourceNode && targetNode) {
          const dx = targetNode.x! - sourceNode.x!;
          const dy = targetNode.y! - sourceNode.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1.0;
          const targetDist = 90; // ideal spring length
          const force = (dist - targetDist) * k;
          
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          sourceNode.vx! += fx;
          sourceNode.vy! += fy;
          targetNode.vx! -= fx;
          targetNode.vy! -= fy;
        }
      });

      // 3. Center gravity force
      const cx = width / 2;
      const cy = height / 2;
      nodes.forEach((node) => {
        const dx = cx - node.x!;
        const dy = cy - node.y!;
        node.vx! += dx * 0.01;
        node.vy! += dy * 0.01;
      });

      // 4. Update coordinates & constraint boundaries
      nodes.forEach((node) => {
        node.x! += node.vx!;
        node.y! += node.vy!;
        
        node.vx! *= damping;
        node.vy! *= damping;
        
        // Bounds checking
        node.x = Math.max(20, Math.min(width - 20, node.x!));
        node.y = Math.max(20, Math.min(height - 20, node.y!));
      });

      // 5. Draw
      ctx.clearRect(0, 0, width, height);

      // Draw links
      data.links.forEach((link) => {
        const s = nodes.find(n => n.id === (typeof link.source === 'object' ? (link.source as any).id : link.source));
        const t = nodes.find(n => n.id === (typeof link.target === 'object' ? (link.target as any).id : link.target));
        
        if (s && t) {
          ctx.beginPath();
          ctx.moveTo(s.x!, s.y!);
          ctx.lineTo(t.x!, t.y!);
          ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'dark' 
            ? 'rgba(75, 85, 99, 0.4)' 
            : 'rgba(209, 213, 219, 0.7)';
          ctx.lineWidth = Math.min(4, link.value / 1.5);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const isSpof = data.spof_contributors.includes(node.id);
        const radius = node.group === 1 ? 12 : 8;
        
        // Draw SPOF warning ring
        if (isSpof) {
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, radius + 6, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw node circle
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.group === 1 
          ? '#3b82f6' // core dev
          : '#8b5cf6'; // external dev
          
        if (hoveredNode && hoveredNode.id === node.id) {
          ctx.fillStyle = '#10b981'; // hover color
        }
        
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Node label
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#cbd5e1' : '#1f2937';
        ctx.fillText(node.id, node.x! + radius + 4, node.y! + 4);
      });

      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [nodes, hoveredNode, data]);

  // Handle canvas mouse move to select hovered nodes
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: Node | null = null;
    for (const node of nodes) {
      const radius = node.group === 1 ? 12 : 8;
      const dx = node.x! - mx;
      const dy = node.y! - my;
      if (dx * dx + dy * dy < (radius + 5) * (radius + 5)) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Developer Collaboration Topology</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Hover nodes to inspect centralities</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
          <div>Density: <b>{data.density}</b></div>
          <div>Clustering: <b>{data.average_clustering}</b></div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '2', minWidth: '350px', background: 'var(--bg-primary)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            onMouseMove={handleMouseMove}
            style={{ width: '100%', height: '100%', display: 'block', cursor: hoveredNode ? 'pointer' : 'default' }}
          />
        </div>

        <div style={{ flex: '1', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Contributor Inspector
            </h4>
            {hoveredNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div>Username: <b>{hoveredNode.id}</b></div>
                <div>Role: <b>{hoveredNode.group === 1 ? 'Core Maintainer' : 'External Collaborator'}</b></div>
                <div>Degree Centrality: <b>{hoveredNode.degree_centrality}</b></div>
                <div>Betweenness Centrality: <b>{hoveredNode.betweenness_centrality}</b></div>
                {data.spof_contributors.includes(hoveredNode.id) && (
                  <div style={{ color: 'var(--status-error)', fontWeight: '600', marginTop: '8px', display: 'flex', gap: '4px' }}>
                    ⚠️ Single Point of Failure (SPOF)
                  </div>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                Hover a node in the graph to display contributor structural centralities.
              </span>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-secondary)' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Legend & Health Signs
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
                <span>Core Maintainer node</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }} />
                <span>External Contributor node</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(239, 68, 68, 0.6)', background: 'transparent' }} />
                <span>SPOF Warning Ring (key risk)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NetworkGraph;
