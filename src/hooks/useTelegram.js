import { useContext } from 'react';
import { TelegramContext } from '../contexts/TelegramContext';

const useTelegram = () => {
  const context = useContext(TelegramContext);
  
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  
  return context;
};

export default useTelegram;