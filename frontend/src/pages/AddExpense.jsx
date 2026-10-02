import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Edit3, ScanLine, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { NaturalLanguageInput } from '../components/expenses/NaturalLanguageInput';
import { CATEGORIES, PAYMENT_METHODS } from '../utils/constants';
import { expenseService } from '../services/expenseService';

export const AddExpense = () => {
  const [activeTab, setActiveTab] = useState('natural_language'); // 'natural_language' | 'manual'
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Manual Form State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [subcategory, setSubcategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState(null);

  const currency = user?.currency || 'INR';

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !merchant.trim()) {
      toast({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please provide a valid amount and merchant name.',
      });
      return;
    }

    setLoading(true);
    try {
      await expenseService.createExpense({
        amount: Number(amount),
        merchant: merchant.trim(),
        description: description.trim() || `${category} Expense`,
        category,
        subcategory: subcategory.trim() || null,
        payment_method: paymentMethod,
        expense_date: expenseDate,
        source: 'manual',
        confidence_score: 1.0,
      });

      toast({
        type: 'success',
        title: 'Expense Recorded!',
        message: `Successfully saved ${currency} ${Number(amount).toLocaleString()} for ${merchant}.`,
      });

      navigate('/expenses');
    } catch (err) {
      toast({
        type: 'error',
        title: 'Failed to Save',
        message: err.response?.data?.detail || 'An error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Record Expense</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Choose your preferred entry method: AI natural language, manual entry, or receipt scanner.
          </p>
        </div>

        <Link
          to="/expenses/scan"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-xs self-start sm:self-auto"
        >
          <ScanLine className="w-4 h-4 text-emerald-600" />
          <span>Scan Paper Receipt</span>
        </Link>
      </div>

      {/* Tabs Switcher */}
      <div className="flex p-1.5 bg-slate-200/70 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('natural_language')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'natural_language'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>AI Natural Language</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'manual'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-4 h-4 text-slate-500" />
          <span>Manual Form</span>
        </button>
      </div>

      {/* Tab 1: Natural Language Entry */}
      {activeTab === 'natural_language' && (
        <NaturalLanguageInput
          currency={currency}
          onExpenseSaved={() => navigate('/expenses')}
        />
      )}

      {/* Tab 2: Manual Form Entry */}
      {activeTab === 'manual' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
          <form onSubmit={handleManualSubmit} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount ({currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Merchant / Payee <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy, Uber, DMart, Amazon"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subcategory (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dining Out, Electronics, Fuel"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Birthday dinner with family"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/expenses')}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Save Expense</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
