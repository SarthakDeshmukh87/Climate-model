'use client';

import React, { useState } from 'react';
import { UserFeedback } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { ClimateDataService } from '@/lib/supabase/client';
import { MessageSquareHeart, Star, Send, CheckCircle2, History } from 'lucide-react';

interface FeedbackViewProps {
  feedbacks: UserFeedback[];
  onFeedbackSubmitted: () => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ feedbacks, onFeedbackSubmitted }) => {
  const { user } = useAuth();
  const [fType, setFType] = useState('Alert Accuracy');
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Show user's feedback if logged in, otherwise show all guest/public logs
  const userFeedbacks = feedbacks.filter((f) =>
    user ? (f.User_ID === user?.User_ID || f.User?.Email === user?.Email) : true
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Use active user ID if logged in, otherwise fall back to guest ID
    const activeUserId = user?.User_ID || 'guest_visitor';

    try {
      await ClimateDataService.submitFeedback(activeUserId, fType, comments, rating);
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
            <span className="text-xs text-slate-500 font-normal">
              Active User: <strong className="text-teal-700 font-display">{user?.User_Name || 'Guest Visitor'}</strong>
            </span>
          </h3>

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Feedback successfully submitted and logged into database! Thank you.</span>
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
                <option value="Alert Accuracy">Alert Accuracy & Timeliness</option>
                <option value="Data Verification">Station Data Verification</option>
                <option value="UI & Dashboard Usability">UI & Dashboard Usability</option>
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-display">Comments & Observations</label>
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-climate-teal" /> Your Feedback Log
          </h3>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px]">
            {userFeedbacks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">You have not submitted any feedback entries yet.</p>
            ) : (
              userFeedbacks.map((f) => (
                <div key={f.F_ID} className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{f.F_Type}</span>
                    <div className="flex text-amber-400">
                      {[...Array(f.Rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 line-clamp-3">{f.Comments}</p>
                  <p className="text-[10px] text-slate-400 pt-1">{new Date(f.Submitted_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};