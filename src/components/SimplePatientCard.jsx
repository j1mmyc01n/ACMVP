import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { Badge } from './UI';

const { FiUser, FiCalendar } = FiIcons;

const SimplePatientCard = ({ patient, onClick, index }) => {
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

  const currentMood = patient.current_mood || patient.mood || Math.floor(Math.random() * 10) + 1;
  const moodColor = currentMood >= 8 ? '#10B981' : currentMood >= 5 ? '#F59E0B' : '#EF4444';
  const moodLabel = currentMood >= 8 ? 'Good' : currentMood >= 5 ? 'Fair' : 'Poor';

  const lastCheckIn = patient.last_check_in || 'Today - Mood 8/10';
  const age = patient.age || Math.floor(Math.random() * 40) + 30;
  const condition = patient.support_category || patient.condition || 'Postpartum Depression';

  // Priority badge
  const priority = patient.priority || (Math.random() > 0.7 ? 'High Priority' : null);
  const isPriority = priority === 'High Priority';

  return (
    <motion.div
      onClick={onClick}
      style={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ 
        y: -4, 
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        borderColor: '#4F46E5'
      }}
    >
      {/* Header with Avatar and Name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: avatarColor(patient.name),
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials(patient.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 700, 
            marginBottom: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {patient.name}, {age}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: '#64748B',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {condition}
          </div>
        </div>
        {isPriority && (
          <div style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.3,
          }}>
            High Priority
          </div>
        )}
      </div>

      {/* Check-in Status */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderTop: '1px solid #F1F5F9',
        borderBottom: '1px solid #F1F5F9',
        marginBottom: 12,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>Last Check-In</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#1C1C1E' }}>
            {lastCheckIn.split(' - ')[0]}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>Mood Score</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#1C1C1E' }}>
            {lastCheckIn.split(' - ')[1] || 'Mood 8/10'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle view profile
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: 'white',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F8F9FA';
            e.currentTarget.style.borderColor = '#4F46E5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#E2E8F0';
          }}
        >
          View Profile
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle schedule session
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: '#507C7B',
            color: 'white',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#3E6261';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#507C7B';
          }}
        >
          Schedule Session
        </button>
      </div>

      {/* Mood Progress Indicator at bottom */}
      <div style={{
        marginTop: 12,
        padding: '8px 0',
        borderTop: '1px solid #F1F5F9',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Mood Progress</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: moodColor }}>{moodLabel}</span>
        </div>
        <div style={{
          width: '100%',
          height: 6,
          background: '#F1F5F9',
          borderRadius: 99,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(currentMood / 10) * 100}%`,
            height: '100%',
            background: moodColor,
            borderRadius: 99,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </motion.div>
  );
};

export default SimplePatientCard;
