'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserFeedback } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { ClimateDataService } from '@/lib/supabase/client';
import { MessageSquareHeart, Star, Send, CheckCircle2, History, UserCheck, ShieldCheck } from 'lucide-react';

interface FeedbackViewProps {
  feedbacks: UserFeedback[];
  onFeedbackSubmitted: () => void;
}

function getOrCreateGuestUuid(): string {
  if (typeof window === 'undefined') return '00000000-0000-4000-8000-000000000000';
  let guestId = localStorage.getItem('ci_guest_uuid');
  if (!guestId || !guestId.includes('-') || guestId.length < 32) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      guestId = crypto.randomUUID();
    } else {
      guestId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    localStorage.setItem('ci_guest_uuid', guestId);
  }
  return guestId;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ feedbacks, onFeedbackSubmitted }) => {
  const { user } = useAuth();
  const [fType, setFType] = useState('Alert Accuracy');
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [deviceFeedbackIds, setDeviceFeedbackIds] = useState<number[]>([]);

  // Load submissions created on this device / browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('ci_my_feedback_ids') || '[]');
        if (Array.isArray(stored)) {
          setDeviceFeedbackIds(stored);
        }
      } catch {}
    }
  }, []);

  // Filter ONLY feedbacks belonging to the current user or this device
  const userFeedbacks = useMemo(() => {
    const guestUuid = typeof window !== 'undefined' ? localStorage.getItem('ci_guest_uuid') : null;

    return feedbacks.filter((f) => {
      // 1. If user is logged in
      if (user) {
        const isMatchUserId = Boolean(user.User_ID && f.User_ID === user.User_ID);
        const isMatchUserEmail = Boolean(
          user.Email && f.User?.Email && f.User.Email.toLowerCase() === user.Email.toLowerCase()
        );
        const isMatchDeviceSubmission = deviceFeedbackIds.includes(f.F_ID);
        return isMatchUserId || isMatchUserEmail || isMatchDeviceSubmission;
      }

      // 2. If visitor is a guest (not logged in): strictly show only submissions from THIS device
      const isMatchGuestId = Boolean(guestUuid && f.User_ID === guestUuid);
      const isMatchDeviceSubmission = deviceFeedbackIds.includes(f.F_ID);
      return isMatchGuestId || isMatchDeviceSubmission;
    });
  }, [feedbacks, user, deviceFeedbackIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const activeUserId = user?.User_ID || getOrCreateGuestUuid();
    const userInfo = user
      ? { name: user.User_Name, email: user.Email }
      : {
          name: 'Guest Visitor',
          email: `guest_${activeUserId.replace(/-/g, '').slice(0, 8)}@climate-intel.local`,
        };

    try {
      const created = await ClimateDataService.submitFeedback(
        activeUserId,
        fType,
        comments,
        rating,
        userInfo
      );

      // Track this submission locally for the user
      if (created && created.F_ID) {
        const updated = [created.F_ID, ...deviceFeedbackIds];
        setDeviceFeedbackIds(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ci_my_feedback_ids', JSON.stringify(updated));
        }
      }

      setSuccessMsg(true);
      setComments('');
      onFeedbackSubmitted();
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      alert(`Failed to submit feedback: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
          <MessageSquareHeart className="w-5 h-5 text-teal-600" /> User Feedback &amp; System Evaluation
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Submit empirical observations, alert verification feedback, and feature input (Table: <code className="text-teal-700 font-mono font-semibold">User_Feedback</code>)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feedback Submit Form (2 Cols) */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card">
          <h3 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-100 flex items-center justify-between font-display">
            <span>Submit Feedback Entry</span>
            <span className="text-xs text-slate-500 font-normal flex items-center gap-1.5">
              {user ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Logged in as: <strong className="text-teal-700 font-display">{user.User_Name}</strong></span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>Active User: <strong className="text-slate-700 font-display">Guest Visitor (This Device)</strong></span>
                </>
              )}
            </span>
          </h3>

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Feedback successfully submitted and saved to your personal log! Thank you.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">Feedback Category</label>
              <select
                value={fType}
                onChange={(e) => setFType(e.target.value)}
                className="w-full py-2.5 px-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-800 transition-all"
              >
                <option value="Alert Accuracy">Alert Accuracy &amp; Timeliness</option>
                <option value="Data Verification">Station Data Verification</option>
                <option value="UI & Dashboard Usability">UI &amp; Dashboard Usability</option>
                <option value="Feature Request">Feature / Model Request</option>
                <option value="General Support">General Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">Star Rating (1 to 5)</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-bold text-slate-700 font-display">({rating} / 5 Stars)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">Comments &amp; Observations</label>
              <textarea
                required
                rows={4}
                placeholder="Share specific heatwave observation notes, location observations, or system usability feedback..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !comments.trim()}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 btn-press cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Logging Feedback...' : 'Submit Feedback'}</span>
            </button>
          </form>
        </div>

        {/* User Submission History (1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card flex flex-col">
          <div className="border-b border-slate-100 pb-2 mb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between font-display">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-teal-600" /> Your Feedback Log
              </span>
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {user ? user.User_Name : 'This Device'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {user ? 'Showing only entries submitted by your account' : 'Showing only entries submitted from this browser'}
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px]">
            {userFeedbacks.length === 0 ? (
              <div className="text-center py-10 px-3 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <History className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No feedback submitted yet</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {user
                    ? 'Entries you submit will appear here specifically in your personal log.'
                    : 'Submissions made from this device will appear here specifically for you.'}
                </p>
              </div>
            ) : (
              userFeedbacks.map((f) => (
                <div key={f.F_ID} className="p-3 bg-slate-50/80 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{f.F_Type}</span>
                    <div className="flex text-amber-400">
                      {[...Array(f.Rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed break-words">{f.Comments}</p>
                  <p className="text-[10px] text-slate-400 pt-0.5">
                    {new Date(f.Submitted_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};