import React, { useState, useEffect } from 'react';
import { User, Mail, DollarSign, Lock, ShieldCheck, CheckCircle2, Loader2, Award, Calendar, Receipt } from 'lucide-react';
import { profileService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Settings form
  const [name, setName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(75000);
  const [currency, setCurrency] = useState('INR');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setName(data.name || '');
      setMonthlyIncome(data.monthly_income || 75000);
      setCurrency(data.currency || 'INR');
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not fetch profile settings.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await profileService.updateProfile({
        name,
        currency,
        monthly_income: Number(monthlyIncome),
      });
      setProfile(updated);
      updateUser({ name: updated.name, currency: updated.currency, monthly_income: updated.monthly_income });
      toast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your profile and currency preferences have been updated.',
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Could not update settings.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        type: 'warning',
        title: 'Password Mismatch',
        message: 'New password and confirmation do not match.',
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        type: 'warning',
        title: 'Weak Password',
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      await profileService.updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been changed successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast({
        type: 'error',
        title: 'Password Change Failed',
        message: err.response?.data?.detail || 'Current password incorrect.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading account settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Profile & Preferences</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your personal information, monthly income benchmark, and security credentials.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Transactions</p>
            <h4 className="text-xl font-extrabold text-slate-900">{profile?.total_transactions || 0}</h4>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">All-Time Spend</p>
            <h4 className="text-xl font-extrabold text-slate-900">
              {formatCurrency(profile?.total_spent_all_time, profile?.currency)}
            </h4>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Member Since</p>
            <h4 className="text-sm font-bold text-slate-800">{formatDate(profile?.created_at)}</h4>
          </div>
        </div>
      </div>

      {/* Preferences Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Account Preferences</h3>
            <p className="text-xs text-slate-400">Configure your baseline financial metrics</p>
          </div>
        </div>

        <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Income Benchmark</label>
              <input
                type="number"
                step="1000"
                min="0"
                required
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to compute your exact savings rate and monthly budget health.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save Account Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Security & Credentials</h3>
            <p className="text-xs text-slate-400">Update your secret sign-in password</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full sm:w-1/2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50 border border-slate-200"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
