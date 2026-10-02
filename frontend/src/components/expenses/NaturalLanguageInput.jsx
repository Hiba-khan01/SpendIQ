import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Edit3, X, Loader2 } from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { CATEGORIES } from '../../utils/constants';

export const NaturalLanguageInput = ({ onExpenseSaved, currency = 'INR' }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const { toast } = useToast();

  const samplePrompts = [
    "Spent ₹650 on dinner at Swiggy yesterday using UPI.",
    "Paid ₹3,500 for groceries at DMart today with Credit Card.",
    "Uber ride to airport ₹420 paid with UPI on Friday.",
    "Movie tickets at PVR Cinemas ₹890 via Credit Card.",
    "Bought headphones on Amazon for ₹2499 with card."
  ];

  const handleParse = async (textToParse) => {
    const text = textToParse || inputText;
    if (!text || !text.trim()) return;

    setLoading(true);
    try {
      const result = await expenseService.parseNaturalLanguage(text.trim());
      setParsedData(result);
      setEditForm({
        amount: result.amount || '',
        merchant: result.merchant || '',
        description: result.description || '',
        category: result.category || 'Food',
        subcategory: result.subcategory || '',
        payment_method: result.payment_method || 'UPI',
        expense_date: result.expense_date || new Date().toISOString().split('T')[0],
      });
      setIsEditing(!result.is_complete);
    } catch (err) {
      toast({
        type: 'error',
        title: 'Parsing Failed',
        message: 'Could not process natural language input. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    const dataToSave = isEditing ? editForm : parsedData;
    
    if (!dataToSave.amount || Number(dataToSave.amount) <= 0) {
      toast({
        type: 'warning',
        title: 'Missing Amount',
        message: 'Please provide a valid expense amount.',
      });
      setIsEditing(true);
      return;
    }
    if (!dataToSave.merchant || !dataToSave.merchant.trim()) {
      toast({
        type: 'warning',
        title: 'Missing Merchant',
        message: 'Please provide a merchant name.',
      });
      setIsEditing(true);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        amount: Number(dataToSave.amount),
        merchant: dataToSave.merchant.trim(),
        description: dataToSave.description ? dataToSave.description.trim() : `${dataToSave.category} Expense`,
        category: dataToSave.category || 'Food',
        subcategory: dataToSave.subcategory || null,
        payment_method: dataToSave.payment_method || 'UPI',
        expense_date: dataToSave.expense_date || new Date().toISOString().split('T')[0],
        source: 'natural_language',
        confidence_score: parsedData?.confidence_score || 0.95,
      };

      await expenseService.createExpense(payload);
      toast({
        type: 'success',
        title: 'Expense Recorded!',
        message: `Successfully saved ${formatCurrency(payload.amount, currency)} at ${payload.merchant}.`,
      });

      // Reset state
      setInputText('');
      setParsedData(null);
      setIsEditing(false);
      if (onExpenseSaved) onExpenseSaved();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Failed to Save',
        message: err.response?.data?.detail || 'An error occurred while saving expense.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-card transition-colors">
      <div className="flex items-center gap-2.5 mb-2 text-indigo-600 dark:text-indigo-400">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Tell SpendIQ what you spent</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        Type in plain natural English or Hinglish. SpendIQ AI will instantly extract the merchant, amount, category, date, and payment method.
      </p>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleParse();
        }}
        className="space-y-4"
      >
        <div className="relative">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. Spent ₹650 on dinner at Swiggy yesterday using UPI..."
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Extract with AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Sample Prompt Pills */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Try examples:</p>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setInputText(p);
                  handleParse(p);
                }}
                className="text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition"
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* AI Extraction Confirmation Screen */}
      {parsedData && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Detected Transaction</h4>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                Confidence: {Math.round((parsedData.confidence_score || 0.95) * 100)}%
              </span>
            </div>

            {!parsedData.is_complete && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Some required details were missing from your text (e.g. {parsedData.missing_fields?.join(', ')}). Please fill them in below before saving.</span>
              </div>
            )}

            {!isEditing ? (
              /* Structured Confirmation View */
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Amount</span>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">{formatCurrency(parsedData.amount, currency)}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Merchant</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{parsedData.merchant || 'General'}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Category</span>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate">{parsedData.category}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Date</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(parsedData.expense_date)}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Payment Method</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{parsedData.payment_method}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Description</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{parsedData.description || 'N/A'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setParsedData(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Fields
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Confirm & Save</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Inline Edit Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Amount ({currency}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      placeholder="e.g. 650"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Merchant *</label>
                    <input
                      type="text"
                      required
                      value={editForm.merchant}
                      onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                      placeholder="e.g. Swiggy"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id} className="dark:bg-slate-800">{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Payment Method</label>
                    <select
                      value={editForm.payment_method}
                      onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    >
                      <option value="UPI" className="dark:bg-slate-800">UPI</option>
                      <option value="Credit Card" className="dark:bg-slate-800">Credit Card</option>
                      <option value="Debit Card" className="dark:bg-slate-800">Debit Card</option>
                      <option value="Cash" className="dark:bg-slate-800">Cash</option>
                      <option value="Bank Transfer" className="dark:bg-slate-800">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      value={editForm.expense_date}
                      onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Description</label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="e.g. Dinner"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Back to Summary
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 dark:shadow-none"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Save Edited Expense</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
