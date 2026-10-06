'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/database';
import { Shield, KeyRound, Mail, User as UserIcon, Phone, Calendar, LogIn, UserPlus, X, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signUp, resetPassword } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup' | 'reset'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      await login(email, password, name);
      setMessage({ type: 'success', text: 'Authenticated successfully! Opening your dashboard...' });
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Login failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      await signUp(name, email, phone, dob, role);
      setMessage({ type: 'success', text: 'Account registered & synchronized!' });
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Sign up failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const res = await resetPassword(email);
    setMessage({ type: 'success', text: res.message });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-climate-navy to-slate-900 text-white px-6 py-5 flex justify-between items-center relative border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight font-display text-white">India Climate Auth Portal</h3>
              <p className="text-xs text-slate-300">Unified User &amp; Admin Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => { setTab('login'); setMessage(null); }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-2 font-display ${
              tab === 'login' ? 'bg-white text-teal-700 border-b-2 border-teal-600 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setMessage(null); }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-2 font-display ${
              tab === 'signup' ? 'bg-white text-teal-700 border-b-2 border-teal-600 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Register
          </button>
          <button
            onClick={() => { setTab('reset'); setMessage(null); }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-2 font-display ${
              tab === 'reset' ? 'bg-white text-teal-700 border-b-2 border-teal-600 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Reset
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2 btn-press cursor-pointer disabled:opacity-60 font-display"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
                </button>
              </div>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">User Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Sarthak Deshmukh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="sarthak@climate-intel.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">Phone No</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="+91-98765-43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-2 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full pl-9 pr-2 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">Account Role</label>
                <div className="py-2.5 px-3 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-700 flex items-center justify-between">
                  <span className="font-semibold">Standard User (Climate Analyst / Citizen)</span>
                  <span className="text-[10px] text-slate-400 font-medium">Admin privileges require existing admin authorization</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2 btn-press cursor-pointer disabled:opacity-60 font-display"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account & Synchronize'}
                </button>
              </div>
            </form>
          )}

          {tab === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="your-registered-email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2 btn-press cursor-pointer disabled:opacity-60 font-display"
                >
                  {isSubmitting ? 'Sending Instructions...' : 'Send Password Reset Email'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
