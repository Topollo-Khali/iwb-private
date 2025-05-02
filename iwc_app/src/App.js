import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import AdminPage from './AdminPage';
import FinancePage from './FinancePage';
import IWCPartnersPage from './IWCPartnersPage';
import InvestorsPage from './InvestorsPage';
import QueryManagement from './QueryManagement';
import QueryReport from './QueryReport';
import LoginPage from './LoginPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      console.error('Invalid token:', e);
      return null;
    }
  };

  const userRole = token ? decodeToken(token)?.role : null;

  const navLinksByRole = {
    sales: [
      { to: '/queries', label: 'Queries' },
      { to: '/query-report', label: 'Query Report' },
      { to: '/admin', label: 'Admin' },
    ],
    developer: [{ to: '/admin', label: 'Admin' }],
    finance: [{ to: '/finance', label: 'Finance' }],
    iwc_partner: [{ to: '/iwc-partners', label: 'IWC Partners' }],
    investor: [{ to: '/investors', label: 'Investors' }],
  };

  const allowedLinks = userRole && navLinksByRole[userRole] ? navLinksByRole[userRole] : [];

  const handleLogin = async (username, password, mfa_code) => {
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, mfa_code }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        return { success: true, token: data.token };
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  const ProtectedRoute = ({ children, roles }) => {
    if (!token) {
      return <Navigate to="/login" />;
    }
    const decoded = decodeToken(token);
    if (!decoded || !roles.includes(decoded.role)) {
      return <Navigate to="/" />;
    }
    return children;
  };

  const navStyles = {
    background: 'linear-gradient(135deg, rgba(10, 180, 180, 0.3), rgba(36, 207, 95, 0.3))',
    backdropFilter: 'blur(15px)',
    padding: '20px 30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.1)',
    borderBottom: '2px solid rgba(251, 207, 52, 0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const ulStyles = {
    display: 'flex',
    listStyle: 'none',
    gap: '30px',
    margin: 0,
    padding: 0,
    alignItems: 'center',
  };

  const linkStyles = {
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '18px',
    fontFamily: "'Jura', sans-serif",
    fontWeight: 600,
    textTransform: 'uppercase',
    padding: '12px 20px',
    borderRadius: '8px',
    background: 'rgba(20, 20, 20, 0.2)',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    overflow: 'hidden',
  };

  const linkHoverStyles = {
    background: 'rgba(251, 207, 52, 0.4)',
    transform: 'scale(1.1)',
    boxShadow: '0 4px 15px rgba(251, 207, 52, 0.5)',
    color: '#1a1a1a',
  };

  const buttonStyles = {
    background: 'linear-gradient(45deg, #AE1100, #DC3545)',
    color: '#ffffff',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: "'Montserrat', sans-serif",
    boxShadow: '0 5px 15px rgba(174, 17, 0, 0.4), inset 0 0 5px rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease-in-out',
    textTransform: 'uppercase',
    position: 'relative',
    overflow: 'hidden',
  };

  const buttonHoverStyles = {
    boxShadow: '0 8px 20px rgba(174, 17, 0, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.3)',
    transform: 'scale(1.1)',
  };

  const handleMouseOver = (e, hoverStyles) => {
    Object.assign(e.target.style, hoverStyles);
  };

  const handleMouseOut = (e, baseStyles) => {
    Object.assign(e.target.style, baseStyles);
  };

  return (
    <Router>
      <div>
        <nav style={navStyles}>
          <ul style={ulStyles}>
            <li>
              <Link
                to="/"
                style={linkStyles}
                onMouseOver={(e) => handleMouseOver(e, linkHoverStyles)}
                onMouseOut={(e) => handleMouseOut(e, linkStyles)}
              >
                Home
              </Link>
            </li>
            {token ? (
              <>
                {allowedLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      style={linkStyles}
                      onMouseOver={(e) => handleMouseOver(e, linkHoverStyles)}
                      onMouseOut={(e) => handleMouseOut(e, linkStyles)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    onClick={handleLogout}
                    style={buttonStyles}
                    onMouseOver={(e) => handleMouseOver(e, buttonHoverStyles)}
                    onMouseOut={(e) => handleMouseOut(e, buttonStyles)}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  to="/login"
                  style={linkStyles}
                  onMouseOver={(e) => handleMouseOver(e, linkHoverStyles)}
                  onMouseOut={(e) => handleMouseOut(e, linkStyles)}
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <h1
                style={{
                  padding: '32px',
                  fontSize: '28px',
                  fontFamily: "'Jura', sans-serif",
                  color: '#1a1a1a',
                  textAlign: 'center',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                }}
              >
                Welcome to the Home Page
              </h1>
            }
          />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['sales', 'developer']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute roles={['finance']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/queries"
            element={
              <ProtectedRoute roles={['sales']}>
                <QueryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/query-report"
            element={
              <ProtectedRoute roles={['sales']}>
                <QueryReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/iwc-partners"
            element={
              <ProtectedRoute roles={['iwc_partner']}>
                <IWCPartnersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investors"
            element={
              <ProtectedRoute roles={['investor']}>
                <InvestorsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;