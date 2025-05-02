import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function IWCPartnersPage() {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token] = useState(localStorage.getItem('token') || '');

  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      console.error('Invalid token:', e);
      return null;
    }
  };

  useEffect(() => {
    const checkRole = () => {
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        return false;
      }
      const decoded = decodeToken(token);
      if (!decoded || decoded.role !== 'iwc_partner') {
        setError('Access denied. Requires iwc_partner role.');
        setLoading(false);
        return false;
      }
      return true;
    };

    if (!checkRole()) return;

    const fetchData = async () => {
      try {
        const [servicesRes, productsRes, salesRes, incomeRes] = await Promise.all([
          fetch('http://localhost:5000/api/services', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/products', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/transactions', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/income_statements', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const responses = await Promise.all([
          servicesRes.json(),
          productsRes.json(),
          salesRes.json(),
          incomeRes.json()
        ]);

        const [servicesData, productsData, salesData, incomeData] = responses;

        if (!servicesRes.ok || !servicesData.success || !Array.isArray(servicesData.data)) {
          throw new Error(`Services fetch failed: ${servicesData.error || 'Invalid response'}`);
        }
        if (!productsRes.ok || !productsData.success || !Array.isArray(productsData.data)) {
          throw new Error(`Products fetch failed: ${productsData.error || 'Invalid response'}`);
        }
        if (!salesRes.ok || !salesData.success || !Array.isArray(salesData.data)) {
          throw new Error(`Sales fetch failed: ${salesData.error || 'Invalid response'}`);
        }
        if (!incomeRes.ok || !incomeData.success || !Array.isArray(incomeData.data)) {
          throw new Error(`Income statements fetch failed: ${incomeData.error || 'Invalid response'}`);
        }

        setServices(servicesData.data);
        setProducts(productsData.data);
        setSales(salesData.data);
        setIncomeStatement({
          months: incomeData.data.map(is => is.month_year),
          revenue: incomeData.data.map(is => parseFloat(is.total_revenue)),
          expenses: incomeData.data.map(is => parseFloat(is.total_expenses)),
          netIncome: incomeData.data.map(is => parseFloat(is.net_income)),
        });
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Failed to fetch data: ${err.message}`);
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

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
        {error}
      </div>
    );

  const chartData = incomeStatement && incomeStatement.months.length > 0 ? {
    labels: incomeStatement.months,
    datasets: [
      {
        label: 'Revenue',
        data: incomeStatement.revenue,
        backgroundColor: 'rgba(36, 207, 95, 0.5)',
        borderColor: '#24cf5f',
        borderWidth: 2,
        hoverBackgroundColor: 'rgba(36, 207, 95, 0.7)',
      },
      {
        label: 'Expenses',
        data: incomeStatement.expenses,
        backgroundColor: 'rgba(255, 77, 77, 0.5)',
        borderColor: '#ff4d4d',
        borderWidth: 2,
        hoverBackgroundColor: 'rgba(255, 77, 77, 0.7)',
      },
      {
        label: 'Net Income',
        data: incomeStatement.netIncome,
        backgroundColor: 'rgba(251, 207, 52, 0.5)',
        borderColor: '#fbcf34',
        borderWidth: 2,
        hoverBackgroundColor: 'rgba(251, 207, 52, 0.7)',
      },
    ],
  } : null;

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
          <i className="fas fa-handshake" style={{ marginRight: '10px' }}></i>
          IWC Partners Dashboard
        </h1>

        <section
          style={{
            marginBottom: '40px',
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
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
            <i className="fas fa-concierge-bell" style={{ marginRight: '8px' }}></i>
            Services
          </h2>
          {services.length > 0 ? (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px',
              }}
            >
              {services.map((service) => (
                <li
                  key={service.id}
                  style={{
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.3)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(36, 207, 95, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
                  }}
                >
                  <i className="fas fa-check-circle" style={{ marginRight: '8px', color: '#24cf5f' }}></i>
                  {service.name} - M{parseFloat(service.price).toFixed(2)}
                </li>
              ))}
            </ul>
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
              No services available
            </p>
          )}
        </section>

        <section
          style={{
            marginBottom: '40px',
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
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
            <i className="fas fa-box" style={{ marginRight: '8px' }}></i>
            Products
          </h2>
          {products.length > 0 ? (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px',
              }}
            >
              {products.map((product) => (
                <li
                  key={product.id}
                  style={{
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.3)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(36, 207, 95, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
                  }}
                >
                  <i className="fas fa-check-circle" style={{ marginRight: '8px', color: '#24cf5f' }}></i>
                  {product.name} - M{parseFloat(product.price).toFixed(2)}
                </li>
              ))}
            </ul>
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
              No products available
            </p>
          )}
        </section>

        <section
          style={{
            marginBottom: '40px',
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
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
            <i className="fas fa-money-check-alt" style={{ marginRight: '8px' }}></i>
            Sales
          </h2>
          {sales.length > 0 ? (
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
                    Item
                  </th>
                  <th
                    style={{
                      padding: '14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '16px',
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: '14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '16px',
                    }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      {sale.product_name || sale.service_name || 'Unknown'}
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      M{parseFloat(sale.price).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      {new Date(sale.purchase_date).toLocaleDateString()}
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
              No sales recorded
            </p>
          )}
        </section>

        <section
          style={{
            marginBottom: '40px',
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
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
            <i className="fas fa-file-invoice-dollar" style={{ marginRight: '8px' }}></i>
            Income Statement
          </h2>
          {chartData ? (
            <div style={{ height: '400px' }}>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top', labels: { color: '#fff', font: { size: 14 } } },
                    title: {
                      display: true,
                      text: 'Monthly Income Statement',
                      color: '#fff',
                      font: { size: 20, weight: '600' },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleFont: { size: 14 },
                      bodyFont: { size: 12 },
                    },
                  },
                  scales: {
                    y: {
                      ticks: { color: '#fff', font: { size: 12 } },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                    x: {
                      ticks: { color: '#fff', font: { size: 12 } },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
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
              No income statements available
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default IWCPartnersPage;