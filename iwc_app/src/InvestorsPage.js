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

export default function InvestorsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token] = useState(localStorage.getItem('token') || '');
  const [startMonth, setStartMonth] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString().slice(0, 7)
  );
  const [endMonth, setEndMonth] = useState(new Date().toISOString().slice(0, 7));

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
      if (!decoded || decoded.role !== 'investor') {
        setError('Access denied. Requires investor role.');
        setLoading(false);
        return false;
      }
      return true;
    };

    if (!checkRole()) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const startDate = `${startMonth}-01`;
      const endDate = new Date(`${endMonth}-01`);
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().slice(0, 10);

      try {
        const [expensesRes, transactionsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/expenses?start_date=${startDate}&end_date=${endDateStr}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`http://localhost:5000/api/transactions?start_date=${startDate}&end_date=${endDateStr}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!expensesRes.ok) {
          const errorData = await expensesRes.json();
          throw new Error(`Failed to fetch expenses: ${errorData.error || 'Unknown error'} (Status: ${expensesRes.status})`);
        }
        if (!transactionsRes.ok) {
          const errorData = await transactionsRes.json();
          throw new Error(`Failed to fetch transactions: ${errorData.error || 'Unknown error'} (Status: ${transactionsRes.status})`);
        }

        const [expensesData, transactionsData] = await Promise.all([
          expensesRes.json(),
          transactionsRes.json()
        ]);

        if (!expensesData.success || !Array.isArray(expensesData.data)) {
          throw new Error('Invalid expenses data format');
        }
        if (!transactionsData.success || !Array.isArray(transactionsData.data)) {
          throw new Error('Invalid transactions data format');
        }

        const expenses = expensesData.data;
        const transactions = transactionsData.data.map(sale => ({
          ...sale,
          price: parseFloat(sale.price),
          quantity: parseInt(sale.quantity) || 1
        }));

        const monthlyFinancials = calculateMonthlyFinancials(expenses, transactions, startMonth, endMonth);

        setData({
          months: monthlyFinancials.map(item => item.month),
          revenue: monthlyFinancials.map(item => item.totalRevenue),
          expenses: monthlyFinancials.map(item => item.totalExpenses),
          netIncome: monthlyFinancials.map(item => item.netIncome)
        });
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [token, startMonth, endMonth]);

  const calculateMonthlyFinancials = (expenses, transactions, startMonth, endMonth) => {
    const startDate = new Date(`${startMonth}-01`);
    const endDate = new Date(`${endMonth}-01`);
    const months = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      months.push(currentDate.toISOString().slice(0, 7));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months.map(month => {
      const monthStart = `${month}-01`;
      const nextMonth = new Date(new Date(monthStart).setMonth(new Date(monthStart).getMonth() + 1));
      const nextMonthStr = nextMonth.toISOString().slice(0, 10);

      const monthlyExpenses = expenses.filter(expense => {
        try {
          const expenseDate = new Date(expense.expense_date).toISOString().slice(0, 10);
          return expenseDate >= monthStart && expenseDate < nextMonthStr;
        } catch (e) {
          console.error('Error processing expense date:', expense.expense_date, e);
          return false;
        }
      });

      const monthlyTransactions = transactions.filter(sale => {
        try {
          const saleDate = new Date(sale.purchase_date).toISOString().slice(0, 10);
          return saleDate >= monthStart && saleDate < nextMonthStr;
        } catch (e) {
          console.error('Error processing sale date:', sale.purchase_date, e);
          return false;
        }
      });

      const totalRevenue = monthlyTransactions.reduce((sum, sale) => {
        return sum + (sale.price * sale.quantity);
      }, 0);

      const totalExpenses = monthlyExpenses.reduce((sum, expense) => {
        return sum + parseFloat(expense.amount);
      }, 0);

      const netIncome = totalRevenue - totalExpenses;

      return { month, totalRevenue, totalExpenses, netIncome };
    });
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
  if (!data || data.months.length === 0)
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
          padding: '20px',
          textAlign: 'center',
        }}
      >
        No financial data available for the selected period
      </div>
    );

  const chartData = {
    labels: data.months,
    datasets: [
      {
        label: 'Revenue',
        data: data.revenue,
        backgroundColor: '#fbcf34',
        borderColor: '#e0a800',
        borderWidth: 2,
        hoverBackgroundColor: '#ffe066',
      },
      {
        label: 'Expenses',
        data: data.expenses,
        backgroundColor: '#ff4d4d',
        borderColor: '#c82333',
        borderWidth: 2,
        hoverBackgroundColor: '#ff6666',
      },
      {
        label: 'Net Income',
        data: data.netIncome,
        backgroundColor: '#24cf5f',
        borderColor: '#1ab54a',
        borderWidth: 2,
        hoverBackgroundColor: '#36eb73',
      }
    ]
  };

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
            background: 'linear-gradient(45deg, #fbcf34, #e0a800)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <i className="fas fa-briefcase" style={{ marginRight: '10px' }}></i>
          Investors Dashboard
        </h1>

        <div
          style={{
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label
              htmlFor="start-month"
              style={{
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Start Month:
            </label>
            <input
              type="month"
              id="start-month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              style={{
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontSize: '16px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.2)',
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label
              htmlFor="end-month"
              style={{
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              End Month:
            </label>
            <input
              type="month"
              id="end-month"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              style={{
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontSize: '16px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.2)',
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
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div style={{ height: '500px' }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { color: '#fff', font: { size: 14 } } },
                  title: {
                    display: true,
                    text: 'Monthly Financial Summary',
                    color: '#fff',
                    font: { size: 20, weight: '600' },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 12 },
                    callbacks: {
                      label: (context) => `${context.dataset.label}: M${context.parsed.y.toFixed(2)}`
                    }
                  },
                },
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: 'Amount (M)',
                      color: '#fff',
                      font: { size: 14 },
                    },
                    ticks: { color: '#fff', font: { size: 12 } },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    beginAtZero: true,
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Month',
                      color: '#fff',
                      font: { size: 14 },
                    },
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
        </div>
      </div>
    </div>
  );
}