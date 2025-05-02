import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onLogin(username, password, mfaCode);
    if (result.success) {
      const decoded = JSON.parse(atob(result.token.split('.')[1]));
      const role = decoded.role;
      const redirectTo = {
        sales: '/queries',
        developer: '/admin',
        finance: '/finance',
        iwc_partner: '/iwc-partners',
        investor: '/investors',
      }[role] || '/';
      navigate(redirectTo);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(15px)',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '400px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#fff',
            textAlign: 'center',
            marginBottom: '20px', // Fixed syntax error here
          }}
        >
          Login
        </h2>
        {error && (
          <div
            style={{
              color: '#ff4d4d',
              marginBottom: '16px',
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontSize: '16px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.1)',
              }}
              onFocus={(e) =>
                (e.target.style.borderBottom = '2px solid #fbcf34')
              }
              onBlur={(e) =>
                (e.target.style.borderBottom = '2px solid rgba(255, 255, 255, 0.3)')
              }
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontSize: '16px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.1)',
              }}
              onFocus={(e) =>
                (e.target.style.borderBottom = '2px solid #fbcf34')
              }
              onBlur={(e) =>
                (e.target.style.borderBottom = '2px solid rgba(255, 255, 255, 0.3)')
              }
            />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label
              htmlFor="mfaCode"
              style={{
                display: 'block',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              MFA Code
            </label>
            <input
              type="text"
              id="mfaCode"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontSize: '16px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.1)',
              }}
              onFocus={(e) =>
                (e.target.style.borderBottom = '2px solid #fbcf34')
              }
              onBlur={(e) =>
                (e.target.style.borderBottom = '2px solid rgba(255, 255, 255, 0.3)')
              }
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(45deg, #24cf5f, #1ab54a)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '3px 3px 20px rgba(0, 0, 0, 0.2)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              if (!loading) e.target.style.transform = 'scale(1)';
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;