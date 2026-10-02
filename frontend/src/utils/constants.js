export const CATEGORIES = [
  { id: 'Food', name: 'Food', color: '#F97316', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  { id: 'Groceries', name: 'Groceries', color: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  { id: 'Transport', name: 'Transport', color: '#0EA5E9', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
  { id: 'Shopping', name: 'Shopping', color: '#EC4899', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  { id: 'Entertainment', name: 'Entertainment', color: '#8B5CF6', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  { id: 'Bills', name: 'Bills', color: '#EF4444', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  { id: 'Healthcare', name: 'Healthcare', color: '#06B6D4', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  { id: 'Education', name: 'Education', color: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  { id: 'Travel', name: 'Travel', color: '#6366F1', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  { id: 'Subscriptions', name: 'Subscriptions', color: '#3B82F6', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  { id: 'Other', name: 'Other', color: '#64748B', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
];

export const PAYMENT_METHODS = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Bank Transfer',
  'Other'
];

export const SOURCE_BADGES = {
  manual: { label: 'Manual', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  natural_language: { label: 'AI Natural Language', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  receipt: { label: 'Receipt OCR', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
};

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£'
};
