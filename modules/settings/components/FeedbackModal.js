import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// settings/components/FeedbackModal — extracted from App.jsx FeedbackModal.
// Handles feedback submission for staff/admin users.
import { useState } from 'react';
import { submitFeedback } from '../services/settings.service';
export function FeedbackModal({ onClose, submittedBy }) {
    const [form, setForm] = useState({
        subject: '',
        category: 'feedback',
        priority: 'medium',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const handleSubmit = async () => {
        if (!form.subject || !form.message)
            return;
        setLoading(true);
        try {
            await submitFeedback({ ...form, submittedBy });
            setDone(true);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    };
    if (done) {
        return (_jsxs("div", { children: [_jsx("div", { children: "\u2705 Submitted! Thank you." }), _jsx("button", { onClick: onClose, children: "Close" })] }));
    }
    return (_jsxs("div", { "data-testid": "feedback-modal", children: [_jsx("h3", { children: "Feedback & Ideas" }), _jsx("button", { onClick: onClose, "aria-label": "Close", children: "\u2715" }), _jsxs("div", { children: [_jsxs("label", { children: ["Category", _jsxs("select", { value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), children: [_jsx("option", { value: "feedback", children: "\uD83D\uDCAC Feedback" }), _jsx("option", { value: "bug", children: "\uD83D\uDC1B Bug Report" }), _jsx("option", { value: "feature", children: "\uD83D\uDE80 Feature Request" }), _jsx("option", { value: "urgent", children: "\uD83D\uDEA8 Urgent Issue" })] })] }), _jsxs("label", { children: ["Priority", _jsxs("select", { value: form.priority, onChange: (e) => setForm({ ...form, priority: e.target.value }), children: [_jsx("option", { value: "low", children: "Low" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "high", children: "High" })] })] })] }), _jsxs("label", { children: ["Subject *", _jsx("input", { value: form.subject, onChange: (e) => setForm({ ...form, subject: e.target.value }), placeholder: "Brief summary..." })] }), _jsxs("label", { children: ["Message *", _jsx("textarea", { value: form.message, onChange: (e) => setForm({ ...form, message: e.target.value }), placeholder: "Describe your feedback or idea..." })] }), _jsx("button", { onClick: onClose, children: "Cancel" }), _jsx("button", { onClick: handleSubmit, disabled: loading || !form.subject || !form.message, children: loading ? 'Sending...' : 'Submit' })] }));
}
//# sourceMappingURL=FeedbackModal.js.map