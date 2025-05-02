import React, { useState, useEffect } from 'react';

function QueryManagement() {
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/customer_queries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch queries');
      const response = await res.json();
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error('Invalid data format');
      }
      setQueries(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedQuery) return;

    try {
      const res = await fetch(`http://localhost:5000/api/customer_queries/${selectedQuery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reply_text: replyText, status })
      });
      if (!res.ok) throw new Error('Failed to update query');
      setReplyText('');
      setStatus('pending');
      setSelectedQuery(null);
      fetchQueries();
    } catch (err) {
      setError('Failed to send reply: ' + err.message);
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
          color: '#fff',
          fontSize: '24px',
          fontWeight: 600,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading...
      </div>
    );
  if (error)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
          color: '#ff4d4d',
          fontSize: '24px',
          fontWeight: 600,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <i className="fas fa-exclamation-circle" style={{ marginRight: '10px' }}></i>
        Error: {error}
      </div>
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
        padding: '40px 20px',
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#fff',
            textAlign: 'center',
            marginBottom: '40px',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            background: 'linear-gradient(45deg, #24cf5f, #fbcf34)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <i className="fas fa-envelope" style={{ marginRight: '10px' }}></i>
          Query Management
        </h1>

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div
            style={{
              flex: '1',
              minWidth: '300px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#fff',
                marginBottom: '20px',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <i className="fas fa-list" style={{ marginRight: '8px' }}></i>
              Queries
            </h2>
            {queries.length > 0 ? (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'linear-gradient(45deg, #24cf5f, #1ab54a)',
                      color: '#fff',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <th
                      style={{
                        padding: '14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '16px',
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: '14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '16px',
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        padding: '14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '16px',
                      }}
                    >
                      Message
                    </th>
                    <th
                      style={{
                        padding: '14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '16px',
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map(query => (
                    <tr
                      key={query.id}
                      onClick={() => setSelectedQuery(query)}
                      style={{
                        cursor: 'pointer',
                        background: selectedQuery?.id === query.id ? 'rgba(251, 207, 52, 0.2)' : 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseOver={(e) =>
                        selectedQuery?.id !== query.id && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')
                      }
                      onMouseOut={(e) =>
                        selectedQuery?.id !== query.id && (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {query.name}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {query.email}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {query.message}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        <span
                          style={{
                            padding: '5px 10px',
                            borderRadius: '12px',
                            background: query.status === 'complete' ? 'rgba(36, 207, 95, 0.3)' : 'rgba(255, 77, 77, 0.3)',
                            color: query.status === 'complete' ? '#24cf5f' : '#ff4d4d',
                            fontWeight: 600,
                          }}
                        >
                          {query.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p
                style={{
                  textAlign: 'center',
                  color: '#fff',
                  fontSize: '18px',
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                }}
              >
                No queries available
              </p>
            )}
          </div>

          {selectedQuery && (
            <div
              style={{
                flex: '1',
                minWidth: '300px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(15px)',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: '20px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                }}
              >
                <i className="fas fa-reply" style={{ marginRight: '8px' }}></i>
                Reply to Query
              </h2>
              <p style={{ color: '#fff', fontSize: '16px', marginBottom: '10px' }}>
                <strong>Name:</strong> {selectedQuery.name}
              </p>
              <p style={{ color: '#fff', fontSize: '16px', marginBottom: '10px' }}>
                <strong>Email:</strong> {selectedQuery.email}
              </p>
              <p style={{ color: '#fff', fontSize: '16px', marginBottom: '10px' }}>
                <strong>Message:</strong> {selectedQuery.message}
              </p>
              <p style={{ color: '#fff', fontSize: '16px', marginBottom: '10px' }}>
                <strong>Auto Replied:</strong> {selectedQuery.auto_replied ? 'Yes' : 'No'}
              </p>
              {selectedQuery.auto_replied && (
                <p style={{ color: '#fff', fontSize: '16px', marginBottom: '10px' }}>
                  <strong>Auto Reply:</strong> {selectedQuery.reply_text}
                </p>
              )}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter reply"
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#fff',
                  fontSize: '16px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.2)',
                  resize: 'vertical',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #fbcf34';
                  e.target.style.boxShadow = '0 0 10px rgba(251, 207, 52, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                  e.target.style.boxShadow = 'inset 2px 2px 5px rgba(0, 0, 0, 0.2)';
                }}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#fff',
                  fontSize: '16px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.2)',
                  margin: '15px 0',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #fbcf34';
                  e.target.style.boxShadow = '0 0 10px rgba(251, 207, 52, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                  e.target.style.boxShadow = 'inset 2px 2px 5px rgba(0, 0, 0, 0.2)';
                }}
              >
                <option value="pending">Pending</option>
                <option value="complete">Complete</option>
              </select>
              <button
                onClick={handleReply}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(45deg, #24cf5f, #1ab54a)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 8px 20px rgba(36, 207, 95, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.4)';
                }}
              >
                <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>
                Send Reply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QueryManagement;