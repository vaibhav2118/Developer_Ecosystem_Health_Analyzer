import React, { useState } from 'react';

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('Analyst');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register API call
        const response = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email: email || undefined, password, roles: [role] })
        });
        if (response.ok) {
          setIsRegister(false);
          setError('Account created successfully. Please login.');
        } else {
          const data = await response.json();
          setError(data.detail || 'Registration failed');
        }
      } else {
        // Login API call
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/';
        } else {
          const data = await response.json();
          setError(data.detail || 'Invalid credentials');
        }
      }
    } catch (e) {
      setError('Connection failed. Is the API server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
      padding: '20px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '900',
            fontSize: '20px',
            margin: '0 auto 12px'
          }}>
            Ω
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>
            Ecosystem Intelligence
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {isRegister ? 'Create your platform account' : 'Sign in to evaluate repository health'}
          </p>
        </div>

        {error && (
          <div style={{
            background: error.includes('success') ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
            border: `1px solid ${error.includes('success') ? 'var(--status-success)' : 'var(--status-error)'}44`,
            color: error.includes('success') ? 'var(--status-success)' : 'var(--status-error)',
            fontSize: '12px',
            padding: '10px 12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Enter username"
            />
          </div>

          {isRegister && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
                placeholder="developer@company.com"
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Analyst">Analyst (Write Access)</option>
                <option value="Security Engineer">Security Engineer</option>
                <option value="Executive Viewer">Executive Viewer (Read Only)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-purple))',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '10px',
              transition: 'opacity 0.2s ease',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {loading ? 'Processing...' : (isRegister ? 'Register Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--brand-primary)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>

        {/* Default Admin Seed Note */}
        {!isRegister && (
          <div style={{
            marginTop: '24px',
            padding: '12px',
            background: 'var(--bg-primary)',
            borderRadius: '6px',
            border: '1px dashed var(--border-color)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: '16px'
          }}>
            🔑 Demo Login Credentials Seeded:<br/>
            Username: <b style={{ color: 'var(--text-primary)' }}>admin</b> | Password: <b style={{ color: 'var(--text-primary)' }}>admin123</b>
          </div>
        )}
      </div>
    </div>
  );
};
export default Login;
