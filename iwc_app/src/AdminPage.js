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
      backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56']
    }]
  } : null;

  const containerStyles = {
    padding: '40px',
    background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
    minHeight: '100vh',
    fontFamily: "'Jura', sans-serif",
    color: '#ffffff',
    maxWidth: '1400px',
    margin: '0 auto',
  };

  const headingStyles = {
    fontSize: '36px',
    fontWeight: 900,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: '40px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
    background: 'linear-gradient(45deg, #fbcf34, #24cf5f)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  const sectionStyles = {
    marginBottom: '60px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(15px)',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    border: '2px solid rgba(251, 207, 52, 0.3)',
  };

  const subHeadingStyles = {
    fontSize: '24px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '24px',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
  };

  const inputStyles = {
    padding: '14px',
    border: 'none',
    borderRadius: '30px',
    background: 'rgba(20, 20, 20, 0.5)',
    color: '#ffffff',
    fontSize: '16px',
    boxShadow: 'inset 3px 3px 8px rgba(0, 0, 0, 0.3), inset -3px -3px 8px rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    flex: 1,
  };

  const inputFocusStyles = {
    boxShadow: '0 0 10px rgba(251, 207, 52, 0.5), inset 2px 2px 5px rgba(0, 0, 0, 0.2)',
    transform: 'scale(1.02)',
  };

  const buttonStyles = {
    padding: '14px 28px',
    background: 'linear-gradient(45deg, #24cf5f, #0a8c0a)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    textTransform: 'uppercase',
    boxShadow: '0 5px 20px rgba(36, 207, 95, 0.5)',
    transition: 'all 0.3s ease',
  };

  const buttonHoverStyles = {
    transform: 'scale(1.1)',
    boxShadow: '0 8px 25px rgba(36, 207, 95, 0.7)',
  };

  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
  };

  const thStyles = {
    background: 'linear-gradient(45deg, #2c2c2c, #1a1a1a)',
    color: '#ffffff',
    padding: '16px',
    textAlign: 'left',
    fontSize: '16px',
    fontWeight: 600,
    borderBottom: '2px solid rgba(251, 207, 52, 0.3)',
  };

  const tdStyles = {
    padding: '16px',
    color: '#ffffff',
    fontSize: '14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'background 0.2s ease',
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#ffffff',
          fontSize: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
          maxWidth: '1400px',
          margin: '40px auto',
        }}
      >
        Loading financial data...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '40px',
          color: '#ff4d4d',
          textAlign: 'center',
          fontSize: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
          maxWidth: '1400px',
          margin: '40px auto',
        }}
      >
        {error}
        <button
          onClick={fetchData}
          style={{ ...buttonStyles, marginLeft: '20px' }}
          onMouseOver={(e) => Object.assign(e.target.style, buttonHoverStyles)}
          onMouseOut={(e) => Object.assign(e.target.style, buttonStyles)}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h1 style={headingStyles}>Finance Dashboard</h1>

      <div style={{ ...sectionStyles, marginBottom: '40px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
          <label htmlFor="month-select" style={{ fontSize: '16px', color: '#ffffff', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>
            Select Month:
          </label>
          <input
            type="month"
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={inputStyles}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyles)}
            onBlur={(e) => Object.assign(e.target.style, inputStyles)}
          />
          <button
            onClick={fetchData}
            style={buttonStyles}
            onMouseOver={(e) => Object.assign(e.target.style, buttonHoverStyles)}
            onMouseOut={(e) => Object.assign(e.target.style, buttonStyles)}
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div style={sectionStyles}>
        <h2 style={subHeadingStyles}>
          Income Statement - {new Date(selectedMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </h2>

        {chartData && (
          <div style={{ height: '400px', marginBottom: '40px' }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { color: '#ffffff', font: { size: 14 } } },
                  title: { display: true, text: 'Financial Summary', color: '#ffffff', font: { size: 20 } }
                },
                scales: {
                  y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                  x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                }
              }}
            />
          </div>
        )}

        {incomeStatement ? (
          <div>
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={thStyles}>Category</th>
                  <th style={thStyles}>Amount (M)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'transparent' }} onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(251, 207, 52, 0.1)')} onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={tdStyles}><strong>Total Revenue</strong></td>
                  <td style={tdStyles}>{incomeStatement.revenue.total.toFixed(2)}</td>
                </tr>
                <tr style={{ background: 'transparent' }} onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(251, 207, 52, 0.1)')} onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={tdStyles}><strong>Total Expenses</strong></td>
                  <td style={tdStyles}>{incomeStatement.expenses.total.toFixed(2)}</td>
                </tr>
                <tr style={{ background: incomeStatement.netIncome >= 0 ? 'rgba(36, 207, 95, 0.1)' : 'rgba(174, 17, 0, 0.1)' }}>
                  <td style={tdStyles}><strong>Net Income</strong></td>
                  <td style={tdStyles}>{incomeStatement.netIncome.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ ...subHeadingStyles, fontSize: '20px', marginTop: '32px' }}>Revenue Details</h3>
            {incomeStatement.revenue.sales.length > 0 ? (
              <table style={tableStyles}>
                <thead>
                  <tr>
                    <th style={thStyles}>Date</th>
                    <th style={thStyles}>Item</th>
                    <th style={thStyles}>Quantity</th>
                    <th style={thStyles}>Unit Price</th>
                    <th style={thStyles}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeStatement.revenue.sales.map((sale, index) => (
                    <tr key={index} style={{ background: 'transparent' }} onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(251, 207, 52, 0.1)')} onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td style={tdStyles}>{new Date(sale.purchase_date).toLocaleDateString()}</td>
                      <td style={tdStyles}>{sale.product_name || sale.service_name || `Product/Service ID: ${sale.product_id || sale.service_id}`}</td>
                      <td style={tdStyles}>{sale.quantity}</td>
                      <td style={tdStyles}>{sale.price.toFixed(2)}</td>
                      <td style={tdStyles}>{(sale.price * sale.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: '16px', color: '#ffffff', textAlign: 'center', padding: '20px' }}>
                No sales recorded for this month
              </p>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '16px', color: '#ffffff', textAlign: 'center', padding: '20px' }}>
            No financial data available for this month
          </p>
        )}
      </div>

      <div style={sectionStyles}>
        <h2 style={subHeadingStyles}>Add New Expense</h2>
        {canAddExpense ? (
          <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Expense Name"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              required
              style={inputStyles}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyles)}
              onBlur={(e) => Object.assign(e.target.style, inputStyles)}
            />
            <input
              type="number"
              placeholder="Amount (M)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              step="0.01"
              style={inputStyles}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyles)}
              onBlur={(e) => Object.assign(e.target.style, inputStyles)}
            />
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
              style={inputStyles}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyles)}
              onBlur={(e) => Object.assign(e.target.style, inputStyles)}
            />
            <button
              type="submit"
              style={buttonStyles}
              onMouseOver={(e) => Object.assign(e.target.style, buttonHoverStyles)}
              onMouseOut={(e) => Object.assign(e.target.style, buttonStyles)}
            >
              Add Expense
            </button>
          </form>
        ) : (
          <p style={{ fontSize: '16px', color: '#ffffff', textAlign: 'center', padding: '20px' }}>
            You do not have permission to add expenses.
          </p>
        )}
      </div>

      <div style={sectionStyles}>
        <h2 style={subHeadingStyles}>All Expenses</h2>
        {expenses.length > 0 ? (
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={thStyles}>ID</th>
                <th style={thStyles}>Expense Name</th>
                <th style={thStyles}>Amount (M)</th>
                <th style={thStyles}>Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} style={{ background: 'transparent' }} onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(251, 207, 52, 0.1)')} onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={tdStyles}>{expense.id}</td>
                  <td style={tdStyles}>{expense.expense_name}</td>
                  <td style={tdStyles}>{parseFloat(expense.amount).toFixed(2)}</td>
                  <td style={tdStyles}>{new Date(expense.expense_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '16px', color: '#ffffff', textAlign: 'center', padding: '20px' }}>
            No expenses found
          </p>
        )}
      </div>
    </div>
  );
}

export default FinancePage;