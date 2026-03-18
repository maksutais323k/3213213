import React, { useState } from 'react';
import './AddTransaction.css';

const AddTransaction = ({ categories, onAdd }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!amount || !category) {
      alert('Заполните обязательные поля');
      return;
    }

    onAdd({
      type,
      amount: parseFloat(amount),
      category: parseInt(category),
      description
    });

    // Очистка формы
    setAmount('');
    setCategory('');
    setDescription('');
  };

  return (
    <div className="add-transaction">
      <h2>Новая операция</h2>

      <form onSubmit={handleSubmit} className="add-form">
        <div className="type-selector">
          <button
            type="button"
            className={`type-btn ${type === 'expense' ? 'active' : ''}`}
            onClick={() => setType('expense')}
          >
            Расход
          </button>
          <button
            type="button"
            className={`type-btn ${type === 'income' ? 'active' : ''}`}
            onClick={() => setType('income')}
          >
            Доход
          </button>
        </div>

        <div className="form-group">
          <label>Сумма</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0 ₽"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label>Категория</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Выберите категорию</option>
            {filteredCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Описание (необязательно)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Комментарий"
          />
        </div>

        <button type="submit" className="submit-btn">
          Добавить
        </button>
      </form>
    </div>
  );
};

export default AddTransaction;