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

function FinancePage() {
  const [expenseName, setExpenseName] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
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
  const userRole = decodeToken(token)?.role;
  const canAddExpense = ['finance', 'investor'].includes(userRole);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (sales.length > 0 || expenses.length > 0) {
      generateIncomeStatement();
    }
  }, [expenses, sales, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchExpenses(), fetchSales()]);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    const response = await fetch('http://localhost:5000/api/expenses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch expenses');
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) throw new Error('Invalid expenses data');
    setExpenses(result.data);
  };

  const fetchSales = async () => {
    const response = await fetch('http://localhost:5000/api/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) throw new Error('Invalid transactions data');
    const parsedSales = result.data.map(sale => ({
      ...sale,
      price: parseFloat(sale.price),
      quantity: parseInt(sale.quantity) || 1
    }));
    setSales(parsedSales);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseName || !amount || !expenseDate) {
      alert('Please fill in all fields');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      alert('Please enter a valid amount');
      return;
    }

    const payload = {
      expense_name: expenseName,
      amount: amountNum,
      expense_date: expenseDate
    };
    console.log('Sending payload:', payload);

    try {
      const response = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response:', errorData);
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setExpenseName('');
        setAmount('');
        setExpenseDate(new Date().toISOString().slice(0, 10));
        await fetchExpenses();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense: ' + error.message);
    }
  };

  const generateIncomeStatement = async () => {
    if (sales.length === 0 && expenses.length === 0) {
      setIncomeStatement(null);
      return;
    }

    const monthStart = `${selectedMonth}-01`;
    const nextMonth = new Date(new Date(monthStart).setMonth(new Date(monthStart).getMonth() + 1));
    const nextMonthStr = new Date(nextMonth).toISOString().slice(0, 10);

    const monthlyExpenses = expenses.filter(expense => {
      try {
        const expenseDate = new Date(expense.expense_date).toISOString().slice(0, 10);
        return expenseDate >= monthStart && expenseDate < nextMonthStr;
      } catch (e) {
        console.error('Error processing expense date:', expense.expense_date, e);
        return false;
      }
    });

    const monthlySales = sales.filter(sale => {
      try {
        const saleDate = new Date(sale.purchase_date).toISOString().slice(0, 10);
        return saleDate >= monthStart && saleDate < nextMonthStr;
      } catch (e) {
        console.error('Error processing sale date:', sale.purchase_date, e);
        return false;
      }
    });

    const totalRevenue = monthlySales.reduce((sum, sale) => {
      return sum + (sale.price * sale.quantity);
    }, 0);

    const totalExpenses = monthlyExpenses.reduce((sum, expense) => {
      return sum + parseFloat(expense.amount);
    }, 0);

    const netIncome = totalRevenue - totalExpenses;

    const incomeStatementData = {
      month: selectedMonth,
      revenue: {
        total: totalRevenue,
        sales: monthlySales
      },
      expenses: {
        total: totalExpenses,
        items: monthlyExpenses
      },
      netIncome: netIncome
    };

    setIncomeStatement(incomeStatementData);

    try {
      await fetch('http://localhost:5000/api/income_statements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          month_year: selectedMonth,
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_income: netIncome
        })
      });
    } catch (err) {
      console.error('Error saving income statement:', err);
    }
  };

  const chartData = incomeStatement ? {
    labels: ['Revenue', 'Expenses', 'Net Income'],
    datasets: [{
      label: `Financials for ${new Date(selectedMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`,
      data: [
        incomeStatement.revenue.total,
        incomeStatement.expenses.total,
        incomeStatement.netIncome
      ],
      backgroundColor: ['#24cf5f', '#ff4d4d', '#fbcf34'],
      borderColor: ['#1ab54a', '#c82333', '#e0a800'],
      borderWidth: 2,
      hoverBackgroundColor: ['#36eb73', '#ff6666', '#ffe066'],
    }]
  } : null;

  if (loading) {
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
        Loading financial data...
      </div>
    );
  }

  if (error) {
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
        <button
          onClick={fetchData}
          style={{
            marginLeft: '20px',
            padding: '10px 20px',
            background: 'linear-gradient(45deg, #fbcf34, #e0a800)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 8px 20px rgba(251, 207, 52, 0.6)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.4)';
          }}
          aria-label="Retry loading data"
        >
          Retry
        </button>
      </div>
    );
  }

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
          <i className="fas fa-chart-bar" style={{ marginRight: '10px' }}></i>
          Finance Dashboard
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
          <label
            htmlFor="month-select"
            style={{
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Select Month:
          </label>
          <input
            type="month"
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
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
            aria-label="Select month for financial data"
          />
          <button
            onClick={fetchData}
            style={{
              padding: '10px 20px',
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
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 8px 20px rgba(36, 207, 95, 0.6)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.4)';
            }}
            aria-label="Refresh financial data"
          >
            <i className="fas fa-sync-alt" style={{ marginRight: '8px' }}></i>
            Refresh Data
          </button>
        </div>

        <div
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
            Income Statement - {new Date(selectedMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </h2>

          {chartData && (
            <div style={{ height: '350px', marginBottom: '30px' }}>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top', labels: { color: '#fff', font: { size: 14 } } },
                    title: {
                      display: true,
                      text: 'Financial Summary',
                      color: '#fff',
                      font: { size: 20, weight: '600' },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleFont: { size: 14 },
                      bodyFont: { size: 12 },
                      callbacks: {
                        label: (context) => `${context.label}: M${context.parsed.y.toFixed(2)}`
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
          )}

          {incomeStatement ? (
            <div>
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
                      Category
                    </th>
                    <th
                      style={{
                        padding: '14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '16px',
                      }}
                    >
                      Amount (M)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'background 0.3s ease',
                    }}
                  >
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      <strong>Total Revenue</strong>
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      {incomeStatement.revenue.total.toFixed(2)}
                    </td>
                  </tr>
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'background 0.3s ease',
                    }}
                  >
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      <strong>Total Expenses</strong>
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      {incomeStatement.expenses.total.toFixed(2)}
                    </td>
                  </tr>
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'background 0.3s ease',
                      background: incomeStatement.netIncome >= 0
                        ? 'rgba(36, 207, 95, 0.1)'
                        : 'rgba(255, 77, 77, 0.1)',
                    }}
                  >
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      <strong>Net Income</strong>
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      {incomeStatement.netIncome.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#fff',
                  margin: '30px 0 20px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                }}
              >
                <i className="fas fa-money-check-alt" style={{ marginRight: '8px' }}></i>
                Revenue Details
              </h3>
              {incomeStatement.revenue.sales.length > 0 ? (
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
                        Date
                      </th>
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
                        Quantity
                      </th>
                      <th
                        style={{
                          padding: '14px',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontSize: '16px',
                        }}
                      >
                        Unit Price
                      </th>
                      <th
                        style={{
                          padding: '14px',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontSize: '16px',
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeStatement.revenue.sales.map((sale, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'background 0.3s ease',
                        }}
                      >
                        <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                          {new Date(sale.purchase_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                          {sale.product_name || sale.service_name || `Product/Service ID: ${sale.product_id || sale.service_id}`}
                        </td>
                        <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                          {sale.quantity}
                        </td>
                        <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                          {sale.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                          {(sale.price * sale.quantity).toFixed(2)}
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
                  No sales recorded for this month
                </p>
              )}
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
              No financial data available for this month
            </p>
          )}
        </div>

        <div
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
            <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i>
            Add New Expense
          </h2>
          {canAddExpense ? (
            <form
              onSubmit={handleAddExpense}
              style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}
            >
              <div style={{ flex: '2', minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Expense Name"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  required
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
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #fbcf34';
                    e.target.style.boxShadow = '0 0 10px rgba(251, 207, 52, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    e.target.style.boxShadow = 'inset 2px 2px 5px rgba(0, 0, 0, 0.2)';
                  }}
                  aria-label="Expense name"
                />
              </div>
              <div style={{ flex: '1', minWidth: '150px' }}>
                <input
                  type="number"
                  placeholder="Amount (M)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
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
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #fbcf34';
                    e.target.style.boxShadow = '0 0 10px rgba(251, 207, 52, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    e.target.style.boxShadow = 'inset 2px 2px 5px rgba(0, 0, 0, 0.2)';
                  }}
                  aria-label="Expense amount"
                />
              </div>
              <div style={{ minWidth: '150px' }}>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
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
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #fbcf34';
                    e.target.style.boxShadow = '0 0 10px rgba(251, 207, 52, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    e.target.style.boxShadow = 'inset 2px 2px 5px rgba(0, 0, 0, 0.2)';
                  }}
                  aria-label="Expense date"
                />
              </div>
              <button
                type="submit"
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
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 8px 20px rgba(36, 207, 95, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.4)';
                }}
                aria-label="Add new expense"
              >
                <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i>
                Add Expense
              </button>
            </form>
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
              You do not have permission to add expenses.
            </p>
          )}
        </div>

        <div
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
            <i className="fas fa-list-alt" style={{ marginRight: '8px' }}></i>
            All Expenses
          </h2>
          {expenses.length > 0 ? (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 5px 20px rgba(咱们, 0, 0, 0.3)',
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
                    ID
                  </th>
                  <th
                    style={{
                      padding: '14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '16px',
                    }}
                  >
                    Expense Name
                  </th>
                  <th
                    style={{
                      padding: '14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '16px',
                    }}
                  >
                    Amount (M)
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
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'background 0.3s ease',
                    }}
                  >
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      {expense.id}
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      {expense.expense_name}
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      {parseFloat(expense.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                      {new Date(expense.expense_date).toLocaleDateString()}
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
              No expenses found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinancePage;