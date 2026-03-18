import React, { useMemo } from 'react';
import BalanceCard from './common/BalanceCard';
import TransactionItem from './common/TransactionItem';
import './Dashboard.css';

const Dashboard = ({ transactions, categories, onDelete }) => {
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const getCategoryById = (categoryId) => {
    return categories.find(c => c.id === categoryId) || {};
  };

  return (
    <div className="dashboard">
      <h2>Главная</h2>
      
      <BalanceCard stats={stats} />

      <div className="dashboard-section">
        <h3>Последние операции</h3>
        {recentTransactions.length > 0 ? (
          <div className="transactions-list">
            {recentTransactions.map(transaction => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                category={getCategoryById(transaction.category)}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <p className="empty-state">Нет транзакций</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;