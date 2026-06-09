import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, GitBranch, Users, Boxes, ShieldAlert, 
  BellRing, LineChart, FileText, ShieldCheck, LogOut 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const menuItems = [
    { name: 'Executive Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Repository Explorer', path: '/repositories', icon: <GitBranch size={18} /> },
    { name: 'Contributor Intelligence', path: '/contributors', icon: <Users size={18} /> },
    { name: 'Dependency Risk Center', path: '/dependencies', icon: <Boxes size={18} /> },
    { name: 'Security Dashboard', path: '/security', icon: <ShieldAlert size={18} /> },
    { name: 'Risk Alerts Center', path: '/alerts', icon: <BellRing size={18} /> },
    { name: 'Trend Analysis', path: '/trends', icon: <LineChart size={18} /> },
    { name: 'Reports Center', path: '/reports', icon: <FileText size={18} /> },
    { name: 'Admin Panel', path: '/admin', icon: <ShieldCheck size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div style={{
      width: '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      {/* Brand Logo Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-purple))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: '800',
          fontSize: '16px'
        }}>
          Ω
        </div>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '18px', fontFamily: 'var(--font-title)' }}>
            ECOSYSTEM
          </h1>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', letterSpacing: '0.05em' }}>
            INTELLIGENCE
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div id="sidebar-nav" style={{ flex: '1', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '500',
              textDecoration: 'none',
              color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--brand-primary)15' : 'transparent',
              transition: 'all 0.15s ease',
            })}
            className="sidebar-link"
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* User Footer Account block */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-primary)80'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--accent-purple)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '14px',
            textTransform: 'uppercase'
          }}>
            {user.username ? user.username[0] : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.username || 'User'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>
              {user.roles ? user.roles[0] : 'Viewer'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--status-error)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
};
export default Sidebar;
