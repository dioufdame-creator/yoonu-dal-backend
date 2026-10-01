// src/contexts/CurrencyContext.js
//
// Rend la devise de l'utilisateur (profile.currency) disponible partout
// dans l'app, et fournit un helper `format(amount)` déjà lié à cette devise.

import React, { createContext, useContext, useMemo } from 'react';
import { formatCurrency, DEFAULT_CURRENCY } from '../utils/currency';

const CurrencyContext = createContext({
  currency: DEFAULT_CURRENCY,
  format: (amount) => formatCurrency(amount, DEFAULT_CURRENCY),
});

export const CurrencyProvider = ({ user, children }) => {
  const currency = user?.profile?.currency || DEFAULT_CURRENCY;

  const value = useMemo(() => ({
    currency,
    format: (amount, options) => formatCurrency(amount, currency, options),
  }), [currency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

export default CurrencyContext;
