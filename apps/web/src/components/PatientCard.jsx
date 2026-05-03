import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { Badge } from './UI';

const { FiActivity, FiCalendar, FiTrendingUp, FiMessageSquare, FiVideo } = FiIcons;

const PatientCard = ({ patient, onClick, style }) => {
  const initials = (name = '') =>
    (name || '')
      .trim()
      .split(/\s+/)
      .filter((w) => w)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';

  const avatarColors = [
    '#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#D97706',
    '#059669', '#0284C7', '#0891B2', '#BE185D', '#4338CA',
  ];
  
  const avatarColor = (name = '') =>
    avatarColors[
      Math.abs(((name || '').charCodeAt(0) || 0) + (name || '').length) %
        avatarColors.length
    ];

  const currentMood = patient.current_mood || patient.mood || 7;
  const journeyTimeline = patient.journey_timeline || 6;
  const sessionsAttended = patient.sessions_attended || 14;
  const phqScore = patient.phq_score || 6;
  const phqStatus = phqScore <= 4 ? 'Mild' : phqScore <= 9 ? 'Moderate' : 'Severe';
  const phqColor = phqScore <= 4 ? '#10B981' : phqScore <= 9 ? '#F59E0B' : '#EF4444';

  const condition = patient.support_category || patient.condition || 'General Anxiety Disorder & Depression';
  const program = patient.program || 'Improving - Week 8 of program';
  const insightsScore = patient.insights_score || 94;

  const moodColor = currentMood >= 8 ? '#10B981' : currentMood >= 5 ? '#F59E0B' : '#EF4444';

  return (
    <motion.div
      className="ac-patient-card"
      onClick={onClick}
      style={{
        ...style,
        background: 'linear-gradient(to bottom, #D5E8E4 0%, #F8F9FA 40%)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.12)' }}
    >
      {/* Header with Avatar and Info */}
      <div className="ac-patient-card-header" style={{ marginBottom: 16 }}>
        <div
          className="ac-patient-avatar"
          style={{
            background: `${avatarColor(patient.name)}`,
            width: 56,
            height: 56,
            fontSize: 18,
            color: 'white',
          }}
        >
          {initials(patient.name)}
        </div>
        <div className="ac-patient-info" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <h3 className="ac-patient-name" style={{ fontSize: 16 }}>
              {patient.name}, {patient.age || 52}
            </h3>
          </div>
          <div className="ac-patient-meta" style={{ fontSize: 13, lineHeight: 1.4, marginBottom: 6 }}>
            {condition}
          </div>
          <div className="ac-patient-meta" style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
            ↗ {program}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: 'white',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Handle schedule telehealth
            }}
          >
            <SafeIcon icon={FiVideo} size={12} />
            Schedule
          </button>
          <button
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: 'white',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Handle send message
            }}
          >
            <SafeIcon icon={FiMessageSquare} size={12} />
            Message
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        borderBottom: '2px solid #E2E8F0',
        marginBottom: 16
      }}>
        <button
          style={{
            padding: '8px 0',
            border: 'none',
            background: 'transparent',
            fontSize: 13,
            fontWeight: 700,
            color: '#1C1C1E',
            cursor: 'pointer',
            borderBottom: '2px solid #4F46E5',
            marginBottom: -2,
          }}
        >
          Overview
        </button>
        <button
          style={{
            padding: '8px 0',
            border: 'none',
            background: 'transparent',
            fontSize: 13,
            fontWeight: 600,
            color: '#64748B',
            cursor: 'pointer',
          }}
        >
          Journey Timeline
        </button>
        <button
          style={{
            padding: '8px 0',
            border: 'none',
            background: 'transparent',
            fontSize: 13,
            fontWeight: 600,
            color: '#64748B',
            cursor: 'pointer',
          }}
        >
          Insights
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {/* Current Mood */}
        <div style={{ 
          background: '#507C7B', 
          borderRadius: 12, 
          padding: 16,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ 
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: 4,
          }}>
            <SafeIcon icon={FiActivity} size={16} style={{ color: 'white' }} />
          </div>
          <div style={{ color: 'white', fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Current Mood</div>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            {currentMood.toFixed(1)}<span style={{ fontSize: 18 }}>/10</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            color: '#D1FAE5',
            fontSize: 11,
            fontWeight: 600
          }}>
            <SafeIcon icon={FiTrendingUp} size={12} />
            <span>↑ Last Week</span>
          </div>
          <div style={{
            marginTop: 12,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 10,
            fontWeight: 700,
            color: 'white'
          }}>
            PHQ-9 Score
          </div>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4 
          }}>
            <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>{phqScore}</div>
            <div style={{ 
              background: phqColor,
              color: 'white',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700
            }}>
              {phqStatus}
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 }}>
            (At 4 of 16) {/* Current week in 16-week program */}
          </div>
        </div>

        {/* Journey Timeline */}
        <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Journey Timeline</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1C1C1E', marginBottom: 8 }}>{journeyTimeline}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5' }} />
              <span>Initial Assessment - 2 weeks ago</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span>First Therapy Session - 10 days ago</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
              <span>Mood Milestone: 7+ for 7 days - 5 days ago</span>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#64748B', fontStyle: 'italic' }}>
            Medication adjustment + consultation
          </div>
          <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
            Medication adjustment<br />
            Engage 3Element
          </div>
        </div>

        {/* Sessions Attended & Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Sessions Attended</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1C1C1E' }}>{sessionsAttended}</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Insights</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1C1C1E', marginBottom: 4 }}>{insightsScore}%</div>
            <div style={{ 
              background: '#EEF2FF',
              color: '#4F46E5',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 700,
              display: 'inline-block'
            }}>
              AI
            </div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 6, lineHeight: 1.4 }}>
              Elena shows consistent improvement in sleep and social engagement.
            </div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: 600 }}>
              Recommended: Introduce mindfulness module next week.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PatientCard;
