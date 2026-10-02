import { CURRENCY_SYMBOLS } from './constants';

export function formatCurrency(amount, currency = 'INR') {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  
  const sym = CURRENCY_SYMBOLS[currency] || (currency === 'INR' ? '₹' : `${currency} `);
  const num = Math.round(Number(amount));
  
  // Format with Indian numbering system for INR, or standard for others
  if (currency === 'INR') {
    return `${sym}${num.toLocaleString('en-IN')}`;
  }
  return `${sym}${num.toLocaleString('en-US')}`;
}

export function formatDate(dateString, format = 'short') {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else if (format === 'full') {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  } else if (format === 'monthYear') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return date.toLocaleDateString();
}

export function formatPercentage(value) {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(1)}%`;
}
