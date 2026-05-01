import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { Button, Field, Input, Select, Textarea } from './UI';

const {
  FiSearch, FiPlay, FiFileText, FiHeadphones, FiPlus, FiX, FiTrash2,
  FiEdit2, FiSave, FiBookOpen, FiVideo, FiMic, FiCheckSquare, FiLink,
} = FiIcons;

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
  'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)',
];

const TYPE_ICONS = {
  video:    FiVideo,
  article:  FiFileText,
  exercise: FiCheckSquare,
  podcast:  FiMic,
  link:     FiLink,
  other:    FiBookOpen,
};

const TYPE_OPTIONS = [
  { value: 'video',    label: '🎬 Video' },
  { value: 'article',  label: '📄 Article / PDF' },
  { value: 'exercise', label: '✅ Exercise / Template' },
  { value: 'podcast',  label: '🎙️ Podcast' },
  { value: 'link',     label: '🔗 External Link' },
  { value: 'other',    label: '📚 Other' },
];

const CATEGORY_OPTIONS = [
  'Articles', 'Videos', 'Exercises', 'Podcasts', 'Guided Meditations', 'Other',
];

const DEFAULT_RESOURCES = [
  { id: 1, title: '5-Minute Breathing for Anxiety', type: 'video', duration: '5:30', rating: 4.9, views: '2.3k', category: 'Videos', url: '', description: 'A guided breathing exercise to reduce anxiety.', gradientIdx: 0 },
  { id: 2, title: 'Understanding Post-Acute Depression', type: 'article', duration: '8 min', rating: 4.8, views: '1.8k', category: 'Articles', url: '', description: 'In-depth look at post-acute depression.', gradientIdx: 1 },
  { id: 3, title: 'Daily Mood Journal Template', type: 'exercise', duration: '', rating: 4.7, views: '3.1k', category: 'Exercises', url: '', description: 'Track daily mood patterns with this journal.', gradientIdx: 2 },
  { id: 4, title: 'Building Resilience After Hospitalization', type: 'podcast', duration: '25 min', rating: 4.9, views: '1.5k', category: 'Podcasts', url: '', description: 'Expert advice on recovery resilience.', gradientIdx: 3 },
];

const STORAGE_KEY = 'ac_resource_hub_items';

const BLANK_FORM = {
  title: '', type: 'article', category: 'Articles', duration: '', description: '', url: '', gradientIdx: 0,
};

// ── Assign Modal ──────────────────────────────────────────────────────
const AssignModal = ({ resource, onClose }) => {
  const [crn, setCrn] = useState('');
  const [done, setDone] = useState(false);
  const send = () => { if (!crn.trim()) return; setDone(true); };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 700, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: 'var(--ac-shadow-xl)' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Resource assigned!</div>
            <div style={{ color: 'var(--ac-muted)', fontSize: 13, marginBottom: 20 }}>"{resource.title}" has been shared with CRN {crn.toUpperCase()}.</div>
            <Button onClick={onClose} style={{ width: '100%' }}>Done</Button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>Assign to Patient</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: 14, background: 'var(--ac-bg)', borderRadius: 12, marginBottom: 20, fontSize: 13, color: 'var(--ac-text)' }}>
              <strong>"{resource.title}"</strong><br />
              <span style={{ color: 'var(--ac-muted)' }}>{resource.description}</span>
            </div>
            <Field label="Patient CRN">
              <Input value={crn} onChange={e => setCrn(e.target.value)} placeholder="e.g. CRN12345" />
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
              <Button onClick={send} disabled={!crn.trim()} style={{ flex: 1 }}>Assign Resource</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Add / Edit Modal ──────────────────────────────────────────────────
const EditModal = ({ item, onSave, onClose }) => {
  const [form, setForm] = useState(item ? { ...item } : { ...BLANK_FORM });
  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 700, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, boxShadow: 'var(--ac-shadow-xl)', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{item ? 'Edit Resource' : 'Add Resource'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', fontSize: 18 }}>✕</button>
        </div>
        <div className="ac-stack">
          <Field label="Title *">
            <Input value={form.title} onChange={f('title')} placeholder="Resource title…" />
          </Field>
          <div className="ac-grid-2">
            <Field label="Type">
              <Select value={form.type} onChange={f('type')} options={TYPE_OPTIONS} />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={f('category')} options={CATEGORY_OPTIONS} />
            </Field>
          </div>
          <div className="ac-grid-2">
            <Field label="Duration / Length">
              <Input value={form.duration} onChange={f('duration')} placeholder="e.g. 10 min, 5:30" />
            </Field>
            <Field label="Cover Colour">
              <Select value={String(form.gradientIdx)} onChange={e => setForm(p => ({ ...p, gradientIdx: parseInt(e.target.value) }))}
                options={GRADIENTS.map((_, i) => ({ value: String(i), label: `Palette ${i + 1}` }))} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description} onChange={f('description')} placeholder="Brief description visible to patients…" style={{ minHeight: 72 }} />
          </Field>
          <Field label="URL / Link (optional)">
            <Input value={form.url} onChange={f('url')} placeholder="https://…" />
          </Field>
          <div className="ac-grid-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button icon={FiSave} onClick={() => { if (!form.title.trim()) return; onSave(form); }} disabled={!form.title.trim()}>Save Resource</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Resource Card ─────────────────────────────────────────────────────
const ResourceCard = ({ resource, onAssign, onEdit, onDelete }) => {
  const TypeIcon = TYPE_ICONS[resource.type] || FiBookOpen;
  return (
    <div style={{
      background: 'var(--ac-surface)',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid var(--ac-border)',
      boxShadow: 'var(--ac-shadow)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--ac-shadow-lg)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--ac-shadow)'; }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 120,
        background: GRADIENTS[resource.gradientIdx ?? 0],
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <SafeIcon icon={TypeIcon} size={40} style={{ color: 'rgba(255,255,255,0.85)' }} />
        {resource.duration && (
          <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6 }}>
            {resource.duration}
          </div>
        )}
        <div style={{ position: 'absolute', top: 8, left: 10, background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6 }}>
          {resource.category}
        </div>
        {(onEdit || onDelete) && (
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
            {onEdit && (
              <button onClick={() => onEdit(resource)} style={{ background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: 6, padding: 5, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SafeIcon icon={FiEdit2} size={12} />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(resource.id)} style={{ background: 'rgba(220,38,38,0.7)', border: 'none', borderRadius: 6, padding: 5, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SafeIcon icon={FiTrash2} size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, color: 'var(--ac-text)' }}>{resource.title}</div>
        {resource.description && (
          <div style={{ fontSize: 12, color: 'var(--ac-muted)', lineHeight: 1.5 }}>{resource.description}</div>
        )}
        {resource.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <span style={{ color: '#F59E0B' }}>★</span>
            <span style={{ fontWeight: 600, color: 'var(--ac-text)' }}>{resource.rating}</span>
            {resource.views && <span style={{ color: 'var(--ac-muted)' }}>· {resource.views} views</span>}
          </div>
        )}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
          {resource.url && (
            <a href={resource.url} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
              <button style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Open
              </button>
            </a>
          )}
          <button onClick={() => onAssign(resource)} style={{
            flex: 1, padding: '8px 10px', borderRadius: 10, border: 'none',
            background: 'var(--ac-primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            Assign to Patient
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────
const ResourceHub = ({ isAdmin = true }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_RESOURCES;
    } catch { return DEFAULT_RESOURCES; }
  });
  const [assignTarget, setAssignTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // null = closed, {} = new, {...} = existing
  const [showAddModal, setShowAddModal] = useState(false);

  const filters = ['All', ...CATEGORY_OPTIONS];

  const filteredResources = resources.filter((r) => {
    if (activeFilter !== 'All' && r.category !== activeFilter) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const persist = (updated) => {
    setResources(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSave = (form) => {
    if (editTarget && editTarget.id) {
      persist(resources.map(r => r.id === editTarget.id ? { ...form, id: editTarget.id } : r));
    } else {
      persist([...resources, { ...form, id: Date.now(), rating: null, views: '0' }]);
    }
    setEditTarget(null);
    setShowAddModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Remove this resource?')) return;
    persist(resources.filter(r => r.id !== id));
  };

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <SafeIcon icon={FiBookOpen} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>
              Resource Hub
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'var(--ac-muted)', margin: 0 }}>
            Curated mental health resources — assign directly to patients
          </p>
        </div>
        {isAdmin && (
          <Button icon={FiPlus} onClick={() => { setEditTarget({}); setShowAddModal(true); }}>
            Add Resource
          </Button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <SafeIcon icon={FiSearch} size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Search resources…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px 10px 38px', borderRadius: 12,
            border: '1px solid var(--ac-border)', background: 'var(--ac-surface)',
            color: 'var(--ac-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: activeFilter === f ? 'var(--ac-primary)' : 'var(--ac-bg)',
            color: activeFilter === f ? '#fff' : 'var(--ac-muted)',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Resources', value: resources.length, color: 'var(--ac-primary)' },
          { label: 'Visible', value: filteredResources.length, color: 'var(--ac-success)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--ac-muted)', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {filteredResources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No resources found</div>
          <div style={{ fontSize: 13 }}>Try a different filter or search term.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
          {filteredResources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onAssign={r => setAssignTarget(r)}
              onEdit={isAdmin ? r => { setEditTarget(r); setShowAddModal(true); } : null}
              onDelete={isAdmin ? handleDelete : null}
            />
          ))}
        </div>
      )}

      {/* Assign Modal */}
      {assignTarget && <AssignModal resource={assignTarget} onClose={() => setAssignTarget(null)} />}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <EditModal
          item={editTarget && editTarget.id ? editTarget : null}
          onSave={handleSave}
          onClose={() => { setEditTarget(null); setShowAddModal(false); }}
        />
      )}
    </div>
  );
};

export default ResourceHub;
