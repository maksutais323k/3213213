import { useCallback } from 'react';
import axios from 'axios';
import useTelegram from './useTelegram';

const useApi = () => {
  const { user } = useTelegram();

  const api = useCallback(() => {
    const instance = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-id': user?.id
      }
    });

    return {
      auth: async (userData) => {
        const response = await instance.post('/auth', userData);
        return response.data;
      },

      getTransactions: async () => {
        const response = await instance.get('/transactions');
        return response.data;
      },

      addTransaction: async (data) => {
        const response = await instance.post('/transactions', data);
        return response.data;
      },

      deleteTransaction: async (id) => {
        const response = await instance.delete(`/transactions/${id}`);
        return response.data;
      },

      getCategories: async () => {
        const response = await instance.get('/categories');
        return response.data;
      },

      addCategory: async (data) => {
        const response = await instance.post('/categories', data);
        return response.data;
      },

      getAnalytics: async (period = 'month') => {
        const response = await instance.get(`/analytics?period=${period}`);
        return response.data;
      }
    };
  }, [user]);

  return { api: api() };
};

export default useApi;