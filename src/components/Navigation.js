import React from 'react';
import './Navigation.css';

const Navigation = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Главная' },
    { id: 'transactions', icon: '📝', label: 'Операции' },
    { id: 'add', icon: '➕', label: 'Добавить' },
    { id: 'analytics', icon: '📈', label: 'Аналитика' },
    { id: 'settings', icon: '⚙️', label: 'Настройки' }
  ];

  return (
    <nav className="navigation">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-button ${currentView === item.id ? 'active' : ''}`}
          onClick={() => onViewChange(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;