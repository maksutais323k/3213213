const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const database = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

// Database initialization
let db;

(async () => {
  db = await database.init();
  console.log('Database initialized');
})();

// Auth middleware
app.use(async (req, res, next) => {
  if (req.path === '/api/auth' || req.path.startsWith('/static/')) {
    return next();
  }

  const telegramId = req.headers['x-telegram-id'];
  if (!telegramId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', telegramId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Routes
app.post('/api/auth', async (req, res) => {
  const { id, first_name, username } = req.body;

  try {
    let user = await db.get('SELECT * FROM users WHERE telegram_id = ?', id);
    
    if (!user) {
      const result = await db.run(
        'INSERT INTO users (telegram_id, first_name, username) VALUES (?, ?, ?)',
        [id, first_name, username]
      );
      
      // Add default categories
      const defaultCategories = [
        ['Зарплата', 'income', '#4CAF50', '💰'],
        ['Подработка', 'income', '#8BC34A', '💼'],
        ['Инвестиции', 'income', '#FFC107', '📈'],
        ['Продукты', 'expense', '#F44336', '🛒'],
        ['Транспорт', 'expense', '#FF9800', '🚗'],
        ['Развлечения', 'expense', '#9C27B0', '🎮'],
        ['Здоровье', 'expense', '#2196F3', '⚕️'],
        ['Коммунальные', 'expense', '#795548', '🏠'],
        ['Одежда', 'expense', '#E91E63', '👕'],
        ['Рестораны', 'expense', '#FF5722', '🍽️']
      ];

      for (const [name, type, color, icon] of defaultCategories) {
        await db.run(
          'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
          [result.lastID, name, type, color, icon]
        );
      }

      user = await db.get('SELECT * FROM users WHERE telegram_id = ?', id);
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await db.all(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon 
       FROM transactions t
       LEFT JOIN categories c ON t.category = c.id
       WHERE t.user_id = ?
       ORDER BY t.date DESC
       LIMIT 100`,
      req.user.id
    );
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  const { type, amount, category, description } = req.body;

  try {
    const result = await db.run(
      'INSERT INTO transactions (user_id, type, amount, category, description) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, type, amount, category, description]
    );

    const transaction = await db.get(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon 
       FROM transactions t
       LEFT JOIN categories c ON t.category = c.id
       WHERE t.id = ?`,
      result.lastID
    );

    res.json(transaction);
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await db.run(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.all(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY type, name',
      req.user.id
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name, type, color, icon } = req.body;

  try {
    const result = await db.run(
      'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, type, color, icon]
    );

    const category = await db.get(
      'SELECT * FROM categories WHERE id = ?',
      result.lastID
    );

    res.json(category);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

app.get('/api/analytics', async (req, res) => {
  const { period = 'month' } = req.query;
  let dateFilter = '';

  switch (period) {
    case 'week':
      dateFilter = "AND date >= datetime('now', '-7 days')";
      break;
    case 'month':
      dateFilter = "AND date >= datetime('now', '-30 days')";
      break;
    case 'year':
      dateFilter = "AND date >= datetime('now', '-1 year')";
      break;
  }

  try {
    const balance = await db.get(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM transactions 
      WHERE user_id = ? ${dateFilter}
    `, req.user.id);

    const expensesByCategory = await db.all(`
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category = c.id
      WHERE t.user_id = ? AND t.type = 'expense' ${dateFilter}
      GROUP BY t.category
      ORDER BY total DESC
    `, req.user.id);

    const incomeByCategory = await db.all(`
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category = c.id
      WHERE t.user_id = ? AND t.type = 'income' ${dateFilter}
      GROUP BY t.category
      ORDER BY total DESC
    `, req.user.id);

    const dailyTransactions = await db.all(`
      SELECT 
        DATE(date) as day,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions 
      WHERE user_id = ? ${dateFilter}
      GROUP BY DATE(date)
      ORDER BY day DESC
      LIMIT 30
    `, req.user.id);

    res.json({
      balance: {
        income: balance.total_income || 0,
        expense: balance.total_expense || 0,
        net: (balance.total_income || 0) - (balance.total_expense || 0)
      },
      expensesByCategory,
      incomeByCategory,
      dailyTransactions: dailyTransactions.reverse()
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});