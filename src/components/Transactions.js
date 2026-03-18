import React, { useState, useMemo } from 'react';
import TransactionItem from './common/TransactionItem';
import './Transactions.css';

const Transactions = ({ transactions, categories, onDelete }) => {
  const [filter, setFilter] = useState('all');

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  const getCategoryById = (categoryId) => {
    return categories.find(c => c.id === categoryId) || {};
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Без категории';
  };

  // Группировка по дате
  const groupedTransactions = useMemo(() => {
    const groups = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    return groups;
  }, [filteredTransactions]);

  return (
    <div className="transactions">
      <h2>Все операции</h2>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button
          className={`filter-btn ${filter === 'income' ? 'active' : ''}`}
          onClick={() => setFilter('income')}
        >
          Доходы
        </button>
        <button
          className={`filter-btn ${filter === 'expense' ? 'active' : ''}`}
          onClick={() => setFilter('expense')}
        >
          Расходы
        </button>
      </div>

      <div className="transactions-list">
        {Object.entries(groupedTransactions).map(([date, transactions]) => (
          <div key={date} className="transaction-group">
            <div className="transaction-date-header">{date}</div>
            {transactions.map(transaction => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                category={getCategoryById(transaction.category)}
                onDelete={onDelete}
              />
            ))}
          </div>
        ))}
        
        {filteredTransactions.length === 0 && (
          <p className="empty-state">Нет транзакций</p>
        )}
      </div>
    </div>
  );
};

export default Transactions;