const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '69409204',
  database: 'iwb_system',
});

db.connect((err) => {
  if (err) {
    console.error('Failed to connect to MySQL:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database.');
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email', // Replace with real SMTP service in production
  port: 587,
  auth: {
    user: 'your-test-email@ethereal.email', // Replace with real email credentials
    pass: 'your-test-password' // Replace with real password
  }
});

// Enhanced word similarity function
const calculateSimilarity = (message, prevMessage) => {
  const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with']);
  
  const preprocess = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  };

  const words1 = preprocess(message);
  const words2 = preprocess(prevMessage);

  if (words1.length === 0 || words2.length === 0) return 0;

  const freq1 = {};
  const freq2 = {};
  words1.forEach(word => freq1[word] = (freq1[word] || 0) + 1);
  words2.forEach(word => freq2[word] = (freq2[word] || 0) + 1);

  const intersection = new Set([...words1, ...words2]);
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  intersection.forEach(word => {
    const f1 = freq1[word] || 0;
    const f2 = freq2[word] || 0;
    dotProduct += f1 * f2;
    norm1 += f1 * f1;
    norm2 += f2 * f2;
  });

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (norm1 * norm2);
};

// Middleware to verify JWT and role
const authenticateToken = (roles) => (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ success: false, error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Invalid token:', err.message);
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }

    if (user.role !== 'developer' && !roles.includes(user.role)) {
      console.log('Insufficient permissions:', user.role);
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    req.user = user;
    next();
  });
};

// ===== AUTHENTICATION =====
app.post('/api/login', (req, res) => {
  const { username, password, mfa_code } = req.body;
  console.log('Login attempt:', { username, mfa_code });

  if (!username || !password || !mfa_code) {
    console.log('Missing required fields');
    return res.status(400).json({ success: false, error: 'Username, password, and MFA code are required' });
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    if (results.length === 0) {
      console.log('User not found:', username);
      return res.status(401).json({ success: false, error: 'Invalid username' });
    }

    const user = results[0];
    console.log('User found:', { username: user.username, role: user.role });

    if (password !== user.password_hash) {
      console.log('Password mismatch for user:', username);
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    if (mfa_code !== user.mfa_secret) {
      console.log('Invalid MFA code for user:', username);
      return res.status(401).json({ success: false, error: 'Invalid MFA code' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    console.log('Login successful, token issued for:', username);
    res.json({ success: true, token });
  });
});

// Developer access endpoint for role switching
app.post('/api/developer-access', authenticateToken(['sales', 'finance', 'iwc_partner', 'investor', 'developer']), (req, res) => {
  const { username, password, mfa_secret, role, isDeveloper } = req.body;
  console.log('Developer access attempt:', { username, role, isDeveloper });

  if (!role) {
    console.log('Missing required role field');
    return res.status(400).json({ success: false, error: 'Role is required' });
  }

  if (isDeveloper && req.user.role === 'developer') {
    const token = jwt.sign({ id: req.user.id, role }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Developer access granted, token issued for:', role);
    return res.json({ success: true, token });
  }

  if (!username || !password || !mfa_secret) {
    console.log('Missing required fields for non-developer');
    return res.status(400).json({ success: false, error: 'Username, password, and MFA secret are required' });
  }

  db.query('SELECT * FROM users WHERE username = ? AND role = ?', [username, role], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    if (results.length === 0) {
      console.log('User not found or role mismatch:', username, role);
      return res.status(401).json({ success: false, error: 'Invalid username or role' });
    }

    const user = results[0];

    if (password !== user.password_hash) {
      console.log('Password mismatch for user:', username);
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    if (mfa_secret !== user.mfa_secret) {
      console.log('Invalid MFA code for user:', username);
      return res.status(401).json({ success: false, error: 'Invalid MFA code' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Access granted, token issued for:', username, role);
    res.json({ success: true, token });
  });
});

// ===== PRODUCTS =====
app.get('/api/products', authenticateToken(['sales', 'developer', 'iwc_partner']), (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('Failed to fetch products:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
    res.json({ success: true, data: results });
  });
});

app.post('/api/products', authenticateToken(['sales', 'developer']), (req, res) => {
  const { name, description, price, stock_quantity } = req.body;
  if (!name || !price || stock_quantity == null) {
    console.log('Missing required product fields');
    return res.status(400).json({ success: false, error: 'Name, price, and stock quantity are required' });
  }
  db.query(
    'INSERT INTO products (name, description, price, stock_quantity) VALUES (?, ?, ?, ?)',
    [name, description, price, stock_quantity],
    (err) => {
      if (err) {
        console.error('Failed to add product:', err);
        return res.status(500).json({ success: false, error: 'Failed to add product' });
      }
      res.json({ success: true, message: 'Product added successfully' });
    }
  );
});

app.put('/api/products/:id', authenticateToken(['sales', 'developer']), (req, res) => {
  const { name, description, price, stock_quantity } = req.body;
  if (!name || !price || stock_quantity == null) {
    console.log('Missing required product fields for update');
    return res.status(400).json({ success: false, error: 'Name, price, and stock quantity are required' });
  }
  db.query(
    'UPDATE products SET name=?, description=?, price=?, stock_quantity=? WHERE id=?',
    [name, description, price, stock_quantity, req.params.id],
    (err) => {
      if (err) {
        console.error('Failed to update product:', err);
        return res.status(500).json({ success: false, error: 'Failed to update product' });
      }
      res.json({ success: true, message: 'Product updated successfully' });
    }
  );
});

app.delete('/api/products/:id', authenticateToken(['sales', 'developer']), (req, res) => {
  db.query('DELETE FROM products WHERE id=?', [req.params.id], (err) => {
    if (err) {
      console.error('Failed to delete product:', err);
      return res.status(500).json({ success: false, error: 'Failed to delete product' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  });
});

// ===== SERVICES =====
app.get('/api/services', authenticateToken(['sales', 'developer', 'iwc_partner']), (req, res) => {
  db.query('SELECT * FROM services', (err, results) => {
    if (err) {
      console.error('Failed to fetch services:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch services' });
    }
    res.json({ success: true, data: results });
  });
});

app.post('/api/services', authenticateToken(['sales', 'developer']), (req, res) => {
  const { name, description, price } = req.body;
  if (!name || !price) {
    console.log('Missing required service fields');
    return res.status(400).json({ success: false, error: 'Name and price are required' });
  }
  db.query(
    'INSERT INTO services (name, description, price) VALUES (?, ?, ?)',
    [name, description, price],
    (err) => {
      if (err) {
        console.error('Failed to add service:', err);
        return res.status(500).json({ success: false, error: 'Failed to add service' });
      }
      res.json({ success: true, message: 'Service added successfully' });
    }
  );
});

app.put('/api/services/:id', authenticateToken(['sales', 'developer']), (req, res) => {
  const { name, description, price } = req.body;
  if (!name || !price) {
    console.log('Missing required service fields for update');
    return res.status(400).json({ success: false, error: 'Name and price are required' });
  }
  db.query(
    'UPDATE services SET name=?, description=?, price=? WHERE id=?',
    [name, description, price, req.params.id],
    (err) => {
      if (err) {
        console.error('Failed to update service:', err);
        return res.status(500).json({ success: false, error: 'Failed to update service' });
      }
      res.json({ success: true, message: 'Service updated successfully' });
    }
  );
});

app.delete('/api/services/:id', authenticateToken(['sales', 'developer']), (req, res) => {
  db.query('DELETE FROM services WHERE id=?', [req.params.id], (err) => {
    if (err) {
      console.error('Failed to delete service:', err);
      return res.status(500).json({ success: false, error: 'Failed to delete service' });
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  });
});

// ===== EXPENSES =====
app.get('/api/expenses', authenticateToken(['finance', 'iwc_partner', 'investor', 'developer']), (req, res) => {
  const { start_date, end_date } = req.query;
  let query = 'SELECT * FROM expenses ORDER BY expense_date DESC';
  let params = [];

  if (start_date && end_date) {
    query = 'SELECT * FROM expenses WHERE expense_date BETWEEN ? AND ? ORDER BY expense_date DESC';
    params = [start_date, end_date];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Failed to fetch expenses:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
    }
    res.json({ success: true, data: results });
  });
});

app.post('/api/expenses', authenticateToken(['finance', 'investor', 'developer']), (req, res) => {
  const { expense_name, amount, expense_date } = req.body;
  if (!expense_name || amount == null || !expense_date) {
    console.log('Missing required expense fields');
    return res.status(400).json({ success: false, error: 'Expense name, amount, and date are required' });
  }
  const formattedDate = new Date(expense_date).toISOString().slice(0, 10); // e.g., '2025-04-30'
  db.query(
    'INSERT INTO expenses (expense_name, amount, expense_date) VALUES (?, ?, ?)',
    [expense_name, amount, formattedDate],
    (err) => {
      if (err) {
        console.error('Failed to add expense:', err);
        return res.status(500).json({ success: false, error: `Failed to add expense: ${err.message}` });
      }
      res.json({ success: true, message: 'Expense added successfully' });
    }
  );
});

// ===== TRANSACTIONS =====
app.get('/api/transactions', authenticateToken(['sales', 'finance', 'iwc_partner', 'investor', 'developer']), (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `
    SELECT 
      t.id,
      t.product_id,
      t.service_id,
      t.quantity,
      t.price,
      t.purchase_date,
      p.name AS product_name,
      s.name AS service_name
    FROM transactions t
    LEFT JOIN products p ON t.product_id = p.id
    LEFT JOIN services s ON t.service_id = s.id
    ORDER BY t.purchase_date DESC
  `;
  let params = [];

  if (start_date && end_date) {
    query = `
      SELECT 
        t.id,
        t.product_id,
        t.service_id,
        t.quantity,
        t.price,
        t.purchase_date,
        p.name AS product_name,
        s.name AS service_name
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN services s ON t.service_id = s.id
      WHERE t.purchase_date BETWEEN ? AND ?
      ORDER BY t.purchase_date DESC
    `;
    params = [start_date, end_date];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Failed to fetch transactions:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch transactions', message: err.message });
    }
    res.json({ success: true, data: results });
  });
});

// ===== CUSTOMER QUERIES =====
app.get('/api/customer_queries', authenticateToken(['sales', 'developer']), (req, res) => {
  db.query('SELECT * FROM customer_queries ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Failed to fetch queries:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch queries' });
    }
    res.json({ success: true, data: results });
  });
});

app.put('/api/customer_queries/:id', authenticateToken(['sales', 'developer']), (req, res) => {
  const { reply_text, status } = req.body;
  if (!reply_text || !status) {
    console.log('Missing required query fields');
    return res.status(400).json({ success: false, error: 'Reply text and status are required' });
  }
  db.query(
    'UPDATE customer_queries SET reply_text = ?, status = ?, auto_replied = FALSE WHERE id = ?',
    [reply_text, status, req.params.id],
    (err) => {
      if (err) {
        console.error('Failed to update query:', err);
        return res.status(500).json({ success: false, error: 'Failed to update query' });
      }
      res.json({ success: true, message: 'Query updated successfully' });
    }
  );
});

app.post('/api/customer_queries', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    console.log('Missing required query fields');
    return res.status(400).json({ success: false, error: 'Name, email, and message are required' });
  }

  try {
    const [prevQueries] = await db.promise().query(
      'SELECT * FROM customer_queries WHERE status = "complete"'
    );

    let autoReply = null;
    let autoReplied = false;

    for (const prevQuery of prevQueries) {
      const similarity = calculateSimilarity(message, prevQuery.message);
      if (similarity > 0.6) {
        autoReply = prevQuery.reply_text || 'Thank you for your query. We have received similar requests and will address it shortly.';
        autoReplied = true;
        break;
      }
    }

    await db.promise().query(
      'INSERT INTO customer_queries (name, email, message, status, reply_text, auto_replied) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, message, autoReplied ? 'complete' : 'pending', autoReply, autoReplied]
    );

    if (autoReplied && autoReply) {
      const mailOptions = {
        from: 'no-reply@iwb.com',
        to: email,
        subject: 'IWB Auto-Reply to Your Query',
        text: `Dear ${name},\n\nThank you for reaching out to IWB. Here is our response to your query:\n\n${autoReply}\n\nBest regards,\nIWB Team`
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Auto-reply email sent to ${email}`);
      } catch (emailErr) {
        console.error('Error sending auto-reply email:', emailErr);
      }
    }

    res.json({ success: true, autoReplied, reply: autoReply, message: 'Query submitted successfully' });
  } catch (err) {
    console.error('Failed to submit query:', err);
    res.status(500).json({ success: false, error: 'Failed to submit query' });
  }
});

// ===== INCOME STATEMENTS =====
app.get('/api/income_statements', authenticateToken(['finance', 'investor', 'iwc_partner', 'developer']), (req, res) => {
  const { start_date, end_date } = req.query;
  let query = 'SELECT * FROM income_statements ORDER BY month_year DESC';
  let params = [];

  if (start_date && end_date) {
    query = 'SELECT * FROM income_statements WHERE month_year BETWEEN ? AND ? ORDER BY month_year DESC';
    params = [start_date.slice(0, 7), end_date.slice(0, 7)];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Failed to fetch income statements:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch income statements' });
    }
    res.json({ success: true, data: results });
  });
});

app.post('/api/income_statements', authenticateToken(['finance', 'developer']), (req, res) => {
  const { month_year, total_revenue, total_expenses, net_income } = req.body;
  if (!month_year || total_revenue == null || total_expenses == null || net_income == null) {
    console.log('Missing required income statement fields');
    return res.status(400).json({ success: false, error: 'Month year, total revenue, total expenses, and net income are required' });
  }
  db.query(
    'INSERT INTO income_statements (month_year, total_revenue, total_expenses, net_income) VALUES (?, ?, ?, ?)',
    [month_year, total_revenue, total_expenses, net_income],
    (err) => {
      if (err) {
        console.error('Failed to save income statement:', err);
        return res.status(500).json({ success: false, error: 'Failed to save income statement' });
      }
      res.json({ success: true, message: 'Income statement saved successfully' });
    }
  );
});

// ===== BACKUPS =====
app.post('/api/backup/transactions', authenticateToken(['developer']), (req, res) => {
  db.query(
    'INSERT INTO transactions_backup (product_id, service_id, quantity, price, purchase_date) SELECT product_id, service_id, quantity, price, purchase_date FROM transactions',
    (err) => {
      if (err) {
        console.error('Failed to backup transactions:', err);
        return res.status(500).json({ success: false, error: 'Failed to backup transactions' });
      }
      res.json({ success: true, message: 'Transactions backed up successfully' });
    }
  );
});

app.post('/api/backup/queries', authenticateToken(['developer']), (req, res) => {
  db.query(
    'INSERT INTO customer_queries_backup (name, email, message, status, reply_text, auto_replied, created_at) SELECT name, email, message, status, reply_text, auto_replied, created_at FROM customer_queries',
    (err) => {
      if (err) {
        console.error('Failed to backup queries:', err);
        return res.status(500).json({ success: false, error: 'Failed to backup queries' });
      }
      res.json({ success: true, message: 'Queries backed up successfully' });
    }
  );
});

// Catch-all route for undefined endpoints
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});