import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { errorMessage } from '../../utils/helpers';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/billing', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
          <span className="text-4xl">🐾</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Paws & Care</h1>
        <p className="text-primary-200 text-sm mt-1">Pet Clinic & Shop Management</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Sign In</h2>
        <p className="text-slate-500 text-sm mb-6">Enter your credentials to continue</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              placeholder="you@petclinic.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center font-medium mb-3">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm({ email: 'admin@petclinic.com', password: 'admin123' })}
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 text-left transition-colors"
            >
              <p className="font-semibold text-slate-700">Admin</p>
              <p className="text-slate-400">admin@petclinic.com</p>
            </button>
            <button
              type="button"
              onClick={() => setForm({ email: 'billing@petclinic.com', password: 'billing123' })}
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 text-left transition-colors"
            >
              <p className="font-semibold text-slate-700">Billing Manager</p>
              <p className="text-slate-400">billing@petclinic.com</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
