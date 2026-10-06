'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/database';
import { useRouter } from 'next/navigation';
import {
  Shield,
  KeyRound,
  Mail,
  User as UserIcon,
  Phone,
  Calendar,
  LogIn,
  UserPlus,
  CloudSun,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, signUp, resetPassword } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'reset'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [role, setRole] = useState<UserRole>('user');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      await login(email, password, name);
      setMessage({ type: 'success', text: 'Authenticated successfully! Redirecting...' });
      setTimeout(() => {
        router.push('/');
      }, 600);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      await signUp(name, email, phone, dob, role);
      setMessage({ type: 'success', text: 'Account registered and synchronized with database!' });
      setTimeout(() => {
        router.push('/');
      }, 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Registration failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const res = await resetPassword(email);
    setMessage({ type: 'success', text: res.message });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-climate-dark flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-climate-emerald/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-climate-teal/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-200/80 overflow-hidden relative z-10">
        <div className="bg-climate-navy text-white p-6 text-center border-b border-white/10 relative">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 text-climate-sand font-bold text-xs uppercase tracking-wider hover:text-white transition-colors">
            <CloudSun className="w-5 h-5 text-climate-emerald" /> INDIA CLIMATE INTELLIGENCE
          </Link>
          <h1 className="text-xl font-display font-bold tracking-tight text-white">Portal Sign In</h1>
          <p className="text-xs text-slate-300 mt-1">Single Common Access Panel for Users & Admins</p>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50/80 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('login'); setMessage(null); }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-climate-forest border-b-2 border-climate-forest font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>

          <button
            onClick={() => { setActiveTab('signup'); setMessage(null); }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signup'
                ? 'bg-white text-climate-forest border-b-2 border-climate-forest font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register
          </button>
        </div>

        <div className="p-6">
          {message && (
            <div className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>{message.text}</span>
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-climate-forest focus:ring-2 focus:ring-climate-forest/20 text-slate-900 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-climate-forest focus:ring-2 focus:ring-climate-forest/20 text-slate-900 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('reset')}
                  className="text-climate-forest hover:text-climate-navy hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-climate-forest hover:bg-climate-forest/90 text-white font-bold py-3 px-4 rounded-xl shadow-subtle hover:shadow-card transition-all text-xs flex items-center justify-center gap-2 btn-press"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Sarthak Deshmukh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-climate-forest focus:ring-2 focus:ring-climate-forest/20 text-slate-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="sarthak@climate-intel.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-climate-forest focus:ring-2 focus:ring-climate-forest/20 text-slate-900 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="+91-98765-43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-climate-forest focus:ring-2 focus:ring-climate-forest/20 text-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-climate-forest focus:ring-2 focus:ring-climate-forest/20 text-slate-900 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-climate-forest focus:ring-2 focus:ring-climate-forest/20 bg-white text-slate-900 font-medium transition-all"
                >
                  <option value="user">Standard User (Personalized Indian station analytics)</option>
                  <option value="admin">System Administrator (Full access & admin analytics dashboard)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-climate-forest hover:bg-climate-forest/90 text-white font-bold py-2.5 px-4 rounded-xl shadow-subtle hover:shadow-card transition-all text-xs btn-press"
              >
                {isSubmitting ? 'Registering Account...' : 'Register User Profile'}
              </button>
            </form>
          )}

          {activeTab === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter your account email address. We will send password reset instructions to your inbox.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="user@climate-intel.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-climate-forest focus:ring-2 focus:ring-climate-forest/20 text-slate-900 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-climate-teal hover:bg-climate-teal/90 text-white font-bold py-2.5 px-4 rounded-xl shadow-subtle hover:shadow-card transition-all text-xs btn-press"
              >
                {isSubmitting ? 'Sending Instructions...' : 'Send Password Reset Email'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
