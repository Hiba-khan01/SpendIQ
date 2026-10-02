import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Loader2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORIES } from '../utils/constants';

export const ReceiptScanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [saving, setSaving] = useState(false);

  // Editable fields before confirmation
  const [formData, setFormData] = useState({
    amount: '',
    merchant: '',
    category: 'Food',
    subcategory: '',
    payment_method: 'Card',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const fileInputRef = useRef(null);
  const currency = user?.currency || 'INR';

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        type: 'error',
        title: 'Unsupported Format',
        message: 'Please upload a valid JPG, PNG, or WEBP receipt image.',
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        type: 'error',
        title: 'File Too Large',
        message: 'Receipt image size must be under 10MB.',
      });
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setScanResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setScanning(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const result = await expenseService.scanReceipt(data);
      setScanResult(result);

      // Populate form data
      setFormData({
        amount: result.amount || '',
        merchant: result.merchant || 'Retail Merchant',
        category: result.category || 'Food',
        subcategory: 'Receipt Purchase',
        payment_method: result.payment_method || 'Card',
        expense_date: result.expense_date || new Date().toISOString().split('T')[0],
        description: result.items?.length
          ? result.items.map((i) => i.name).slice(0, 3).join(', ')
          : 'Scanned receipt purchase',
      });

      if (!result.is_readable) {
        toast({
          type: 'warning',
          title: 'Low OCR Clarity',
          message: result.error_message || 'Could not detect all fields with high confidence. Please verify before saving.',
        });
      } else {
        toast({
          type: 'success',
          title: 'Receipt Scanned!',
          message: `Extracted ${formatCurrency(result.amount, currency)} from ${result.merchant}.`,
        });
      }
    } catch (err) {
      console.error('OCR Scan error:', err);
      toast({
        type: 'error',
        title: 'Scan Failed',
        message: err.response?.data?.detail || "We couldn't read this receipt clearly. Try a clearer image.",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!formData.amount || Number(formData.amount) <= 0 || !formData.merchant.trim()) {
      toast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please provide a valid amount and merchant name.',
      });
      return;
    }

    setSaving(true);
    try {
      await expenseService.createExpense({
        amount: Number(formData.amount),
        merchant: formData.merchant.trim(),
        description: formData.description.trim() || 'Scanned receipt transaction',
        category: formData.category,
        subcategory: formData.subcategory || null,
        payment_method: formData.payment_method,
        expense_date: formData.expense_date,
        source: 'receipt',
        confidence_score: scanResult?.confidence_score || 0.90,
        receipt_image_path: scanResult?.receipt_image_path || null,
      });

      toast({
        type: 'success',
        title: 'Transaction Saved!',
        message: 'Receipt expense successfully added to your dashboard.',
      });

      navigate('/expenses');
    } catch (err) {
      toast({
        type: 'error',
        title: 'Failed to Save',
        message: err.response?.data?.detail || 'Could not save receipt expense.',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setScanResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">AI Receipt Scanner</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Upload any paper or digital receipt. SpendIQ OCR & AI will extract merchant, items, date, category, and total amount.
        </p>
      </div>

      {!scanResult ? (
        /* Upload & Preview Step */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
          {!previewUrl ? (
            /* Drag and Drop Zone */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-3xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Click to upload or drag & drop receipt
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPG, JPEG, PNG, WEBP (Max 10 MB)
                </p>
              </div>
              <span className="mt-2 px-4 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-xl shadow-xs">
                Browse Files
              </span>
            </div>
          ) : (
            /* Image Preview & Scan Action */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-40 h-48 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-sm">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-slate-800 truncate">{file?.name}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Size: {(file?.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI OCR processing.
                  </p>
                  <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <button
                      onClick={resetAll}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
                    >
                      Choose Different Image
                    </button>
                    <button
                      onClick={handleScan}
                      disabled={scanning}
                      className="inline-flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 disabled:opacity-50"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing Receipt...</span>
                        </>
                      ) : (
                        <>
                          <ScanLine className="w-4 h-4" />
                          <span>Scan & Extract Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results & Confirmation Screen */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Receipt Details Extracted</h3>
                <p className="text-xs text-slate-400">Review and confirm extracted line items before saving</p>
              </div>
            </div>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Scan Another</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Extracted Line Items */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Detected Line Items</span>
              </div>

              {scanResult.items && scanResult.items.length > 0 ? (
                <div className="divide-y divide-slate-200/70 text-xs">
                  {scanResult.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <span className="text-slate-800 font-medium">{it.name}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(it.price, currency)}</span>
                    </div>
                  ))}
                  <div className="pt-3 flex items-center justify-between font-extrabold text-sm text-slate-900">
                    <span>Grand Total</span>
                    <span className="text-emerald-600">{formatCurrency(scanResult.amount, currency)}</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Total amount parsed directly from receipt header/footer.
                </div>
              )}
            </div>

            {/* Right: Confirmation Edit Form */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Merchant Name</label>
                  <input
                    type="text"
                    required
                    value={formData.merchant}
                    onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Card">Credit / Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Date</label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetAll}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Confirm & Save Transaction</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
