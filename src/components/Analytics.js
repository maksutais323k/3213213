import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, subMonths, subYears, isAfter } from 'date-fns';
import { ru } from 'date-fns/locale';
import './Analytics.css';

const Analytics = ({ transactions, categories }) => {
  const [period, setPeriod] = useState('month');

  const getDateFilter = () => {
    const now = new Date();
    switch (period) {
      case 'week':
        return subDays(now, 7);
      case 'month':
        return subMonths(now, 1);
      case 'year':
        return subYears(now, 1);
      default:
        return subMonths(now, 1);
    }
  };

  const filteredTransactions = useMemo(() => {
    const dateFilter = getDateFilter();
    return transactions.filter(t => isAfter(new Date(t.date), dateFilter));
  }, [transactions, period]);

  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income: totalIncome,
      expense: totalExpense,
      savings: totalIncome - totalExpense
    };
  }, [filteredTransactions]);

  const expensesByCategory = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const grouped = {};

    expenses.forEach(t => {
      const category = categories.find(c => c.id === t.category);
      if (!category) return;
      
      if (!grouped[category.id]) {
        grouped[category.id] = {
          name: category.name,
          color: category.color,
          icon: category.icon,
          total: 0
        };
      }
      grouped[category.id].total += t.amount;
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories]);

  const incomeByCategory = useMemo(() => {
    const incomes = filteredTransactions.filter(t => t.type === 'income');
    const grouped = {};

    incomes.forEach(t => {
      const category = categories.find(c => c.id === t.category);
      if (!category) return;
      
      if (!grouped[category.id]) {
        grouped[category.id] = {
          name: category.name,
          color: category.color,
          icon: category.icon,
          total: 0
        };
      }
      grouped[category.id].total += t.amount;
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories]);

  const dailyData = useMemo(() => {
    const data = {};
    
    filteredTransactions.forEach(t => {
      const day = format(new Date(t.date), 'dd.MM');
      if (!data[day]) {
        data[day] = { day, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        data[day].income += t.amount;
      } else {
        data[day].expense += t.amount;
      }
    });

    return Object.values(data).sort((a, b) => {
      const [aDay, aMonth] = a.day.split('.');
      const [bDay, bMonth] = b.day.split('.');
      return aMonth === bMonth ? aDay - bDay : aMonth - bMonth;
    });
  }, [filteredTransactions]);

  const COLORS = ['#F44336', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#795548', '#E91E63', '#00BCD4'];

  const formatAmount = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatAmount(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics">
      <h2>Аналитика</h2>

      <div className="period-selector">
        <button
          className={`period-btn ${period === 'week' ? 'active' : ''}`}
          onClick={() => setPeriod('week')}
        >
          Неделя
        </button>
        <button
          className={`period-btn ${period === 'month' ? 'active' : ''}`}
          onClick={() => setPeriod('month')}
        >
          Месяц
        </button>
        <button
          className={`period-btn ${period === 'year' ? 'active' : ''}`}
          onClick={() => setPeriod('year')}
        >
          Год
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Доходы</span>
          <span className="summary-value income">{formatAmount(stats.income)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Расходы</span>
          <span className="summary-value expense">{formatAmount(stats.expense)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Сбережения</span>
          <span className={`summary-value ${stats.savings >= 0 ? 'positive' : 'negative'}`}>
            {formatAmount(stats.savings)}
          </span>
        </div>
      </div>

      {dailyData.length > 0 && (
        <div className="chart-container">
          <h3>Динамика</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" name="Доходы" fill="#4CAF50" />
              <Bar dataKey="expense" name="Расходы" fill="#F44336" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {expensesByCategory.length > 0 && (
        <div className="chart-container">
          <h3>Расходы по категориям</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.name} (${((entry.total / stats.expense) * 100).toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {incomeByCategory.length > 0 && (
        <div className="chart-container">
          <h3>Доходы по категориям</h3>
          <div className="categories-list">
            {incomeByCategory.map(cat => (
              <div key={cat.name} className="category-stat">
                <div className="category-info">
                  <span className="category-name">{cat.name}</span>
                  <span className="category-value income">{formatAmount(cat.total)}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${(cat.total / stats.income) * 100}%`,
                      backgroundColor: cat.color || '#4CAF50'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;