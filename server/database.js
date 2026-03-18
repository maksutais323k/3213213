const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

class Database {
  async init() {
    const db = await open({
      filename: 'finance.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        telegram_id TEXT UNIQUE,
        first_name TEXT,
        username TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT CHECK(type IN ('income', 'expense')),
        amount REAL,
        category INTEGER,
        description TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        type TEXT CHECK(type IN ('income', 'expense')),
        color TEXT,
        icon TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX idx_transactions_date ON transactions(date);
      CREATE INDEX idx_transactions_type ON transactions(type);
      CREATE INDEX idx_categories_user_id ON categories(user_id);
    `);

    return db;
  }
}

module.exports = new Database();