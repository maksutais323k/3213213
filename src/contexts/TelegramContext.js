import React, { createContext, useState } from 'react';

export const TelegramContext = createContext();

export const TelegramProvider = ({ children }) => {
  const [webApp, setWebApp] = useState(null);
  const [user, setUser] = useState(null);

  const initTelegram = () => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      tg.ready();
      tg.expand();
      
      setWebApp(tg);
      
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
    }
  };

  const showAlert = (message) => {
    if (webApp) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  };

  const showConfirm = (message) => {
    if (webApp) {
      return webApp.showConfirm(message);
    }
    return window.confirm(message);
  };

  return (
    <TelegramContext.Provider value={{
      webApp,
      user,
      initTelegram,
      showAlert,
      showConfirm
    }}>
      {children}
    </TelegramContext.Provider>
  );
};