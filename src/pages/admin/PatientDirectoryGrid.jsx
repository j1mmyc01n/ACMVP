import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import SimplePatientCard from '../../components/SimplePatientCard';

const { FiSearch, FiFilter, FiGrid, FiList, FiUserPlus } = FiIcons;

export default function PatientDirectoryGrid({ onPatientClick }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients_1777020684735')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Enhance data with mock fields for demonstration
        const enhancedData = data.map((patient, index) => ({
          ...patient,
          age: Math.floor(Math.random() * 40) + 30,
          current_mood: Math.floor(Math.random() * 10) + 1,
          last_check_in: `Today - Mood ${Math.floor(Math.random() * 3) + 7}/10`,
          priority: index % 4 === 0 ? 'High Priority' : null,
          condition: patient.support_category === 'mental_health' 
            ? 'Postpartum Depression' 
            : patient.support_category === 'crisis'
            ? 'Anxiety Disorder'
            : 'General Support',
        }));
        setPatients(enhancedData);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
    setLoading(false);
  };

  const filteredPatients = useMemo(() => {
    let filtered = patients;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.crn?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter((p) => p.status === filterStatus.toLowerCase());
    }

    // Priority filter
    if (filterPriority === 'High Priority') {
      filtered = filtered.filter((p) => p.priority === 'High Priority');
    }

    return filtered;
  }, [patients, searchQuery, filterStatus, filterPriority]);

  const totalPatients = patients.length;

  return (
    <div style={{ background: '#F8F9FA', minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        borderRadius: 20, 
        padding: 24,
        marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 20
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SafeIcon icon={FiIcons.FiHome} size={20} style={{ color: '#4F46E5' }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#64748B' }}>
                Dashboard
              </h2>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0 0 0' }}>
              All Patients ({totalPatients.toLocaleString()})
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#4F46E5',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
              }}
            >
              <SafeIcon icon={FiUserPlus} size={14} />
              Add New Patient
            </button>
            <button
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: 'white',
                color: '#1C1C1E',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <SafeIcon icon={FiIcons.FiMessageSquare} size={14} />
              Add New Patient
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          paddingBottom: 16,
          borderBottom: '1px solid #E2E8F0'
        }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ position: 'relative' }}>
              <SafeIcon 
                icon={FiSearch} 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#64748B'
                }} 
              />
              <input
                type="text"
                placeholder="Search patients by name, ID or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: 'white',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['All', 'Active', 'New', 'High Risk'].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  if (filter === 'High Risk') {
                    setFilterPriority(filter === filterPriority ? 'All' : 'High Priority');
                  } else {
                    setFilterStatus(filter);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: 'none',
                  background: 
                    (filterStatus === filter || (filter === 'High Risk' && filterPriority === 'High Priority'))
                      ? '#507C7B' 
                      : '#E2E8F0',
                  color: 
                    (filterStatus === filter || (filter === 'High Risk' && filterPriority === 'High Priority'))
                      ? 'white' 
                      : '#64748B',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {filter}
              </button>
            ))}
            {filter === 'High Risk' && (
              <div style={{
                background: '#FEE2E2',
                color: '#991B1B',
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <SafeIcon icon={FiIcons.FiFlag} size={10} />
                <span>High Risk</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                background: viewMode === 'grid' ? '#4F46E5' : 'white',
                color: viewMode === 'grid' ? 'white' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <SafeIcon icon={FiGrid} size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                background: viewMode === 'list' ? '#4F46E5' : 'white',
                color: viewMode === 'list' ? 'white' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <SafeIcon icon={FiList} size={16} />
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        <div style={{ 
          display: 'flex', 
          gap: 16,
          marginTop: 16,
          fontSize: 12,
          color: '#64748B'
        }}>
          <span>Filters pillory</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                background: 'white',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View Profile
            </button>
            <button
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                background: 'white',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Schedule Session
            </button>
            <button
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                background: 'white',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              0 Message
            </button>
          </div>
        </div>
      </div>

      {/* Patient Grid */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 60,
          color: '#64748B'
        }}>
          Loading patients...
        </div>
      ) : filteredPatients.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 60,
          background: 'white',
          borderRadius: 20,
          color: '#64748B'
        }}>
          No patients found matching your filters
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: viewMode === 'grid' 
            ? 'repeat(auto-fill, minmax(280px, 1fr))' 
            : '1fr',
          gap: 16 
        }}>
          {filteredPatients.map((patient, index) => (
            <SimplePatientCard
              key={patient.id}
              patient={patient}
              index={index}
              onClick={() => onPatientClick && onPatientClick(patient)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredPatients.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginTop: 24,
          padding: 20,
          background: 'white',
          borderRadius: 16,
        }}>
          <button
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <SafeIcon icon={FiIcons.FiChevronLeft} size={16} />
          </button>
          {[1, 2, 3, '...', 11].map((page, i) => (
            <button
              key={i}
              style={{
                minWidth: 32,
                height: 32,
                padding: '0 8px',
                borderRadius: 8,
                border: page === 1 ? 'none' : '1px solid #E2E8F0',
                background: page === 1 ? '#4F46E5' : 'white',
                color: page === 1 ? 'white' : '#64748B',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {page}
            </button>
          ))}
          <button
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <SafeIcon icon={FiIcons.FiChevronRight} size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
