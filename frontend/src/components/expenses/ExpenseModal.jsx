import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';
import { expenseService } from '../../services/expenseService';
import { useToast } from '../../context/ToastContext';

export const ExpenseModal = ({
  isOpen,
  onClose,
  expenseToEdit = null,
  onSaved,
  currency = 'INR',
}) => {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [subcategory, setSubcategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    if (expenseToEdit) {
      setAmount(expenseToEdit.amount || '');
      setMerchant(expenseToEdit.merchant || '');
      setDescription(expenseToEdit.description || '');
      setCategory(expenseToEdit.category || 'Food');
      setSubcategory(expenseToEdit.subcategory || '');
      setPaymentMethod(expenseToEdit.payment_method || 'UPI');
      setExpenseDate(expenseToEdit.expense_date || new Date().toISOString().split('T')[0]);
      setSuggestedCategory(null);
    } else {
      setAmount('');
      setMerchant('');
      setDescription('');
      setCategory('Food');
      setSubcategory('');
      setPaymentMethod('UPI');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setSuggestedCategory(null);
    }
  }, [expenseToEdit, isOpen]);

  // Real-time categorization helper while typing merchant or description
  useEffect(() => {
    if (expenseToEdit) return; // don't auto-override when editing existing
    const text = `${merchant} ${description}`.trim();
    if (text.length >= 3) {
      const timeout = setTimeout(async () => {
        try {
          const res = await expenseService.categorize(text);
          if (res.category && res.category !== 'Other' && res.confidence_score >= 0.70) {
            setSuggestedCategory(res.category);
            setCategory(res.category);
          }
        } catch (e) {
          // ignore background categorization errors
        }
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [merchant, description, expenseToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !merchant.trim()) {
      toast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please provide a valid amount and merchant name.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: Number(amount),
        merchant: merchant.trim(),
        description: description.trim() || `${category} Expense`,
        category,
        subcategory: subcategory.trim() || null,
        payment_method: paymentMethod,
        expense_date: expenseDate,
        source: expenseToEdit ? expenseToEdit.source : 'manual',
        confidence_score: 1.0,
      };

      if (expenseToEdit) {
        await expenseService.updateExpense(expenseToEdit.id, payload);
        toast({
          type: 'success',
          title: 'Expense Updated',
          message: 'Changes saved successfully.',
        });
      } else {
        await expenseService.createExpense(payload);
        toast({
          type: 'success',
          title: 'Expense Recorded',
          message: 'Successfully added new transaction.',
        });
      }

      onClose();
      if (onSaved) onSaved();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Operation Failed',
        message: err.response?.data?.detail || 'Could not save expense.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Transaction' : 'Record New Expense'}
      subtitle={expenseToEdit ? 'Modify transaction fields' : 'Enter transaction details manually'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
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
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Merchant / Store <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy, Uber, Amazon"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {suggestedCategory && (
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs text-indigo-700">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI auto-detected category: <strong className="font-bold">{suggestedCategory}</strong>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSuggestedCategory(null);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transaction Date</label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subcategory (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Food Delivery, Fuel"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
          <input
            type="text"
            placeholder="e.g. Lunch with team after project milestone"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{expenseToEdit ? 'Save Changes' : 'Record Expense'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
