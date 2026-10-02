import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      toast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'Successfully signed in to SpendIQ.',
      });
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to sign in. Please verify your credentials.';
      setError(msg);
      toast({
        type: 'error',
        title: 'Sign In Failed',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@spendiq.app');
    setPassword('Demo@123');
    setError('');
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Sign in to your account</h2>
        <p className="text-xs text-slate-400 mt-1">Access your personalized spending intelligence</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Demo Credentials Quick Fill Banner */}
      <div className="mb-5 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-indigo-300">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Try with pre-seeded demo data</span>
        </div>
        <button
          type="button"
          onClick={fillDemoAccount}
          className="text-xs font-bold text-indigo-300 hover:text-white bg-indigo-600/40 hover:bg-indigo-600/70 border border-indigo-500/40 px-2.5 py-1 rounded-lg transition"
        >
          Auto Fill Demo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-300">Password</label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition">
          Create account
        </Link>
      </div>
    </div>
  );
};
