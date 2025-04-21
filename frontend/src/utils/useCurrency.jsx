import { useContext } from 'react';
import { UserContext } from '../utils/UserContext';
import currencies from '../data/currencies';

export const useCurrency = () => {
  const { user } = useContext(UserContext);
  
  // Get full currency info fallback to 'GBP' then first available currency
  const getCurrencyInfo = () => {
    return currencies.find(c => c.code === (user?.currency || 'GBP')) || currencies[0];
  };

  const currency = getCurrencyInfo();

  // Format amount with proper symbol and decimal places
  const formatAmount = (amount) => {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    return `${currency.symbol}${amount.toFixed(2)}`;
  };

  return { 
    formatAmount,
    currency, 
    currencySymbol: currency.symbol 
  };
};