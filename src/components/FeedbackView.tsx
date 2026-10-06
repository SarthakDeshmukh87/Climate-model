'use client';

import React, { useState } from 'react';
import { UserFeedback } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { ClimateDataService } from '@/lib/supabase/client';
import { MessageSquareHeart, Star, Send, CheckCircle2, UserCheck } from 'lucide-react';

interface FeedbackViewProps {
  feedbacks?: UserFeedback[];
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
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    }
    localStorage.setItem('ci_guest_uuid', guestId);
  }
  return guestId;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ onFeedbackSubmitted }) => {
  const { user } = useAuth();
  const [fType, setFType] = useState('Alert Accuracy');
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;
    setIsSubmitting(true);

    const activeUserId = user?.User_ID || getOrCreateGuestUuid();
    const userInfo = user
      ? { name: user.User_Name, email: user.Email }
      : {
          name: 'Guest Visitor',
          email: `guest_${activeUserId.replace(/-/g, '').slice(0, 8)}@climate-intel.local`,
        };

    try {
      await ClimateDataService.submitFeedback(
        activeUserId,
        fType,
        comments.trim(),
        rating,
        userInfo
      );

      setSuccessMsg(true);
      setComments('');
      onFeedbackSubmitted();
      setTimeout(() => setSuccessMsg(false), 5000);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      alert(`Failed to submit feedback: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card text-center sm:text-left">
        <h2 className="text-xl font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2 font-display">
          <MessageSquareHeart className="w-5 h-5 text-teal-600" /> User Feedback &amp; System Evaluation
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Share your ground-truth observations, alert verification feedback, and suggestions to calibrate our heatwave models.
        </p>
      </div>

      {/* Feedback Submit Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-card">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm font-display">Submit Feedback Entry</h3>
          <span className="text-xs text-slate-500 font-normal flex items-center gap-1.5">
            {user ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Posting as: <strong className="text-teal-700 font-display">{user.User_Name}</strong></span>
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Posting as: <strong className="text-slate-700 font-display">Guest Visitor</strong></span>
              </>
            )}
          </span>
        </div>

        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Thank you! Your feedback has been successfully recorded and sent to the climate team.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
              Feedback Category
            </label>
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
              Star Rating (1 to 5)
            </label>
            <div className="flex items-center gap-1.5">
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
              Comments &amp; Observations
            </label>
            <textarea
              required
              rows={5}
              placeholder="Share specific heatwave observation notes, location temperature feedback, or feature suggestions..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-3.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !comments.trim()}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 px-4 rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 btn-press cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting Feedback...' : 'Submit Feedback'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};