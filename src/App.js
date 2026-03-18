import React, { useState, useEffect } from 'react';
import { TelegramProvider } from './contexts/TelegramContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import AddTransaction from './components/AddTransaction';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import useTelegram from './hooks/useTelegram';
import useApi from './hooks/useApi';
import './App.css';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const { user, webApp, initTelegram } = useTelegram();
  const { api } = useApi();

  useEffect(() => {
    initTelegram();
  }, []);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        api.getTransactions(),
        api.getCategories()
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      webApp?.showAlert('Ошибка загрузки данных');
    }
  };

  const addTransaction = async (transactionData) => {
    try {
      const newTransaction = await api.addTransaction(transactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      webApp?.showAlert('Транзакция добавлена');
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error adding transaction:', error);
      webApp?.showAlert('Ошибка при добавлении транзакции');
    }
  };

  const deleteTransaction = async (id) => {
    if (!webApp?.showConfirm('Удалить транзакцию?')) return;

    try {
      await api.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      webApp?.showAlert('Ошибка при удалении');
    }
  };

  const addCategory = async (categoryData) => {
    try {
      const newCategory = await api.addCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
    } catch (error) {
      console.error('Error adding category:', error);
      webApp?.showAlert('Ошибка при добавлении категории');
    }
  };

  if (!user) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="app">
      <div className="content">
        {currentView === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            categories={categories}
            onDelete={deleteTransaction}
          />
        )}
        {currentView === 'transactions' && (
          <Transactions
            transactions={transactions}
            categories={categories}
            onDelete={deleteTransaction}
          />
        )}
        {currentView === 'add' && (
          <AddTransaction
            categories={categories}
            onAdd={addTransaction}
          />
        )}
        {currentView === 'analytics' && (
          <Analytics
            transactions={transactions}
            categories={categories}
          />
        )}
        {currentView === 'settings' && (
          <Settings
            user={user}
            categories={categories}
            onAddCategory={addCategory}
          />
        )}
      </div>
      
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

function App() {
  return (
    <TelegramProvider>
      <AppContent />
    </TelegramProvider>
  );
}

export default App;