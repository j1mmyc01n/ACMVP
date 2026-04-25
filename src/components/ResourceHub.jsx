import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { Button } from './UI';

const { FiSearch, FiPlay, FiFileText, FiHeadphones } = FiIcons;

const ResourceHub = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = ['All', 'Articles', 'Videos', 'Exercises', 'Podcasts', 'Guided Meditations'];

  const resources = [
    {
      id: 1,
      title: '5-Minute Breathing for Anxiety',
      type: 'video',
      duration: '5:30',
      rating: 4.9,
      views: '2.3k',
      thumbnail: '🧘',
      category: 'Interactive Article',
    },
    {
      id: 2,
      title: 'Understanding Post-Acute Depression',
      type: 'article',
      duration: '8 min',
      rating: 4.8,
      views: '1.8k',
      thumbnail: '📄',
      category: 'PDF',
      badge: 'PDF',
    },
    {
      id: 3,
      title: 'Daily Mood Journal Template',
      type: 'exercise',
      duration: '',
      rating: 4.7,
      views: '3.1k',
      thumbnail: '📊',
      category: 'Template',
      badge: 'Template',
    },
    {
      id: 4,
      title: 'Building Resilience After Hospitalization',
      type: 'podcast',
      duration: '25 min',
      rating: 4.9,
      views: '1.5k',
      thumbnail: '🎙️',
      category: 'Podcast',
    },
  ];

  const filteredResources = resources.filter((r) => {
    if (activeFilter !== 'All' && !r.category.includes(activeFilter.slice(0, -1))) {
      return false;
    }
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ 
      background: '#F8F9FA', 
      borderRadius: 20, 
      padding: 24,
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <SafeIcon icon={FiFileText} size={20} style={{ color: '#4F46E5' }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Acute Connect Resources & Learning Hub
            </h2>
          </div>
          <h3 style={{ 
            fontSize: 20, 
            fontWeight: 700, 
            margin: 0,
            marginTop: 8 
          }}>
            Curated Mental Health Resources for Your Patients
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <SafeIcon icon={FiIcons.FiMenu} size={18} />
          </button>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <SafeIcon icon={FiIcons.FiBell} size={18} />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ 
          position: 'relative',
          marginBottom: 16
        }}>
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
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: 'white',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: activeFilter === filter ? '#507C7B' : '#E2E8F0',
                color: activeFilter === filter ? 'white' : '#64748B',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
            Interactive Article
          </h4>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
            Patient Favorites
          </span>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: 16 
        }}>
          {filteredResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              className="ac-resource-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="ac-resource-thumbnail" style={{
                background: resource.id === 1 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : resource.id === 2 
                  ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
                  : resource.id === 3
                  ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
                  : 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                position: 'relative',
              }}>
                {resource.id === 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <SafeIcon icon={FiPlay} size={24} style={{ color: 'white' }} />
                  </div>
                )}
                {resource.badge && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: '#EF4444',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                  }}>
                    {resource.badge}
                  </div>
                )}
                {resource.id === 3 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}>
                    <SafeIcon icon={FiIcons.FiMessageSquare} size={48} style={{ color: 'white' }} />
                  </div>
                )}
                {resource.id === 4 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}>
                    <SafeIcon icon={FiHeadphones} size={48} style={{ color: 'white', marginBottom: 8 }} />
                    <div style={{
                      width: 60,
                      height: 30,
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                    }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: 3,
                              height: Math.random() * 20 + 10,
                              background: 'white',
                              borderRadius: 2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="ac-resource-content">
                <div className="ac-resource-title">{resource.title}</div>
                <div className="ac-resource-meta">{resource.duration}</div>
                {resource.rating && (
                  <div className="ac-resource-rating">
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ color: i < Math.floor(resource.rating) ? '#F59E0B' : '#E2E8F0' }}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span style={{ fontWeight: 600 }}>{resource.rating}</span>
                    <span style={{ color: '#64748B' }}>· {resource.views} Views</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  style={{
                    width: '100%',
                    fontSize: 12,
                    padding: '8px 12px',
                    background: '#507C7B',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  Assign to Patient
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourceHub;
