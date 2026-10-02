import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { CATEGORIES } from '../../utils/constants';
import { budgetService } from '../../services';
import { useToast } from '../../context/ToastContext';

export const BudgetModal = ({
  isOpen,
  onClose,
  budgetToEdit = null,
  activeMonth,
  activeYear,
  onSaved,
  currency = 'INR',
}) => {
  const [category, setCategory] = useState('Food');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (budgetToEdit) {
      setCategory(budgetToEdit.category);
      setMonthlyLimit(budgetToEdit.monthly_limit || '');
    } else {
      setCategory('Food');
      setMonthlyLimit('');
    }
  }, [budgetToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monthlyLimit || Number(monthlyLimit) <= 0) {
      toast({
        type: 'warning',
        title: 'Invalid Limit',
        message: 'Please enter a valid monthly budget limit amount.',
      });
      return;
    }

    setLoading(true);
    try {
      if (budgetToEdit) {
        await budgetService.updateBudget(budgetToEdit.id, {
          monthly_limit: Number(monthlyLimit),
        });
        toast({
          type: 'success',
          title: 'Budget Updated',
          message: `Updated ${category} budget to ${currency} ${Number(monthlyLimit).toLocaleString()}.`,
        });
      } else {
        await budgetService.createBudget({
          category,
          monthly_limit: Number(monthlyLimit),
          month: activeMonth,
          year: activeYear,
        });
        toast({
          type: 'success',
          title: 'Budget Created',
          message: `Allocated ${currency} ${Number(monthlyLimit).toLocaleString()} for ${category}.`,
        });
      }

      onClose();
      if (onSaved) onSaved();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Budget Save Failed',
        message: err.response?.data?.detail || 'An error occurred while saving budget.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Edit Category Budget' : 'Set New Category Budget'}
      subtitle={`Configure monthly spending cap for ${activeMonth}/${activeYear}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Select Category</label>
          <select
            disabled={!!budgetToEdit}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Monthly Spending Limit ({currency}) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="500"
            min="100"
            required
            placeholder="e.g. 5000"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
            <span>{budgetToEdit ? 'Save Budget' : 'Create Budget'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
