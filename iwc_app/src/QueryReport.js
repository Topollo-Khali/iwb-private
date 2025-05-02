import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function QueryReport() {
  const [chartData, setChartData] = useState(null);
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
      const queries = response.data;

      const pending = queries.filter(q => q.status === 'pending').length;
      const complete = queries.filter(q => q.status === 'complete').length;

      setChartData({
        labels: ['Pending', 'Complete'],
        datasets: [{
          data: [pending, complete],
          backgroundColor: ['#ff4d4d', '#24cf5f'],
          borderColor: ['#c82333', '#1ab54a'],
          borderWidth: 2,
          hoverBackgroundColor: ['#ff6666', '#36eb73'],
        }]
      });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
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
          <i className="fas fa-chart-pie" style={{ marginRight: '10px' }}></i>
          Query Status Report
        </h1>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {chartData && (chartData.datasets[0].data[0] > 0 || chartData.datasets[0].data[1] > 0) ? (
            <div style={{ width: '500px', height: '500px' }}>
              <Pie
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: { color: '#fff', font: { size: 14 } }
                    },
                    title: {
                      display: true,
                      text: 'Query Status Distribution',
                      color: '#fff',
                      font: { size: 20, weight: '600' },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleFont: { size: 14 },
                      bodyFont: { size: 12 },
                    },
                  },
                  animation: {
                    duration: 1500,
                    easing: 'easeOutBounce',
                  },
                }}
              />
            </div>
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
      </div>
    </div>
  );
}

export default QueryReport;