// settings/components/FeedbackModal — extracted from App.jsx FeedbackModal.
// Handles feedback submission for staff/admin users.

import React, { useState } from 'react';
import { submitFeedback } from '../services/settings.service';

interface FeedbackModalProps {
  onClose: () => void;
  submittedBy?: string;
}

export function FeedbackModal({ onClose, submittedBy }: FeedbackModalProps) {
  const [form, setForm] = useState({
    subject: '',
    category: 'feedback',
    priority: 'medium',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!form.subject || !form.message) return;
    setLoading(true);
    try {
      await submitFeedback({ ...form, submittedBy });
      setDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div>
        <div>✅ Submitted! Thank you.</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  return (
    <div data-testid="feedback-modal">
      <h3>Feedback &amp; Ideas</h3>
      <button onClick={onClose} aria-label="Close">✕</button>
      <div>
        <label>
          Category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="feedback">💬 Feedback</option>
            <option value="bug">🐛 Bug Report</option>
            <option value="feature">🚀 Feature Request</option>
            <option value="urgent">🚨 Urgent Issue</option>
          </select>
        </label>
        <label>
          Priority
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
      <label>
        Subject *
        <input
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="Brief summary..."
        />
      </label>
      <label>
        Message *
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Describe your feedback or idea..."
        />
      </label>
      <button onClick={onClose}>Cancel</button>
      <button onClick={handleSubmit} disabled={loading || !form.subject || !form.message}>
        {loading ? 'Sending...' : 'Submit'}
      </button>
    </div>
  );
}
