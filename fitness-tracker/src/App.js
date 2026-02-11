import React, { useState, useEffect } from 'react';

const CTA_COLORS = {
  blue: '#00a1de',
  red: '#c60c30',
  purple: '#522398',
  green: '#009b3a',
  orange: '#f9461c',
  brown: '#62361b',
  yellow: '#f9e300',
  pink: '#ee97c9'
};

const DEFAULT_COLORS = {
  cardio: CTA_COLORS.blue,
  strength: CTA_COLORS.red,
  flexibility: CTA_COLORS.purple,
  nutrition: CTA_COLORS.green,
  recovery: CTA_COLORS.orange,
  endurance: CTA_COLORS.brown
};

export default function FitnessTracker() {
  const [activities, setActivities] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [categoryColors, setCategoryColors] = useState(DEFAULT_COLORS);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load data from storage on mount
  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-update activity statuses
  useEffect(() => {
    const interval = setInterval(() => {
      updateActivityStatuses();
    }, 30000);
    return () => clearInterval(interval);
  }, [activities]);

  // Save to storage whenever data changes
  useEffect(() => {
    if (activities.length > 0) {
      window.storage.set('fitness-activities', JSON.stringify(activities));
    }
  }, [activities]);

  useEffect(() => {
    if (milestones.length > 0) {
      window.storage.set('fitness-milestones', JSON.stringify(milestones));
    }
  }, [milestones]);

  useEffect(() => {
    window.storage.set('fitness-colors', JSON.stringify(categoryColors));
  }, [categoryColors]);

  async function loadData() {
    try {
      const activitiesData = await window.storage.get('fitness-activities');
      if (activitiesData) setActivities(JSON.parse(activitiesData.value));

      const milestonesData = await window.storage.get('fitness-milestones');
      if (milestonesData) setMilestones(JSON.parse(milestonesData.value));

      const colorsData = await window.storage.get('fitness-colors');
      if (colorsData) setCategoryColors(JSON.parse(colorsData.value));
    } catch (error) {
      console.log('Starting fresh - no saved data');
    }
  }

  function updateActivityStatuses() {
    const now = new Date();
    setActivities(prev => prev.map(activity => {
      if (activity.status === 'scheduled') {
        const scheduledTime = new Date(activity.scheduledTime);
        const endTime = new Date(scheduledTime.getTime() + activity.duration * 60000);
        if (now >= scheduledTime && now < endTime) {
          return { ...activity, status: 'active' };
        }
      }
      return activity;
    }));
  }

  function addActivity(formData) {
    const newActivity = {
      id: Date.now().toString(),
      type: formData.type,
      name: formData.name,
      description: formData.description,
      scheduledTime: formData.scheduledTime,
      duration: formData.duration,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    setActivities(prev => [...prev, newActivity]);
  }

  function markComplete(id) {
    setActivities(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'completed' } : a
    ));
  }

  function deleteActivity(id) {
    if (confirm('Delete this activity?')) {
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  }

  function addMilestone(name, value) {
    if (!name.trim()) {
      alert('Please enter a milestone name');
      return;
    }
    const newMilestone = {
      id: Date.now().toString(),
      name: name.trim(),
      value: value.trim(),
      completed: false,
      order: milestones.length
    };
    setMilestones(prev => [...prev, newMilestone]);
  }

  function toggleMilestone(id) {
    setMilestones(prev => prev.map(m => 
      m.id === id ? { ...m, completed: !m.completed } : m
    ));
  }

  function deleteMilestone(id) {
    if (confirm('Delete this milestone?')) {
      setMilestones(prev => prev.filter(m => m.id !== id));
    }
  }

  async function clearAllData() {
    if (confirm('Delete ALL data? This cannot be undone.')) {
      try {
        await window.storage.delete('fitness-activities');
        await window.storage.delete('fitness-milestones');
        await window.storage.delete('fitness-colors');
        setActivities([]);
        setMilestones([]);
        setCategoryColors(DEFAULT_COLORS);
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    }
  }

  function isToday(date) {
    const today = new Date();
    const compareDate = new Date(date);
    return compareDate.toDateString() === today.toDateString();
  }

  function isThisWeek(date) {
    const now = new Date();
    const compareDate = new Date(date);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return compareDate >= weekStart && compareDate < weekEnd;
  }

  function calculateTimeRemaining(scheduledTime) {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diff = scheduled - now;
    
    if (diff < 0) return 'Due';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours} hr ${minutes} min`;
    return `${minutes} min`;
  }

  const todayActivities = activities.filter(a => isToday(a.scheduledTime));
  const weekActivities = activities.filter(a => isThisWeek(a.scheduledTime));
  
  const stats = {
    completed: todayActivities.filter(a => a.status === 'completed').length,
    active: todayActivities.filter(a => a.status === 'active').length,
    scheduled: todayActivities.filter(a => a.status === 'scheduled').length
  };

  const weeklyGoals = {};
  ['cardio', 'strength', 'flexibility', 'nutrition', 'recovery', 'endurance'].forEach(type => {
    const typeActivities = weekActivities.filter(a => a.type === type);
    const completed = typeActivities.filter(a => a.status === 'completed').length;
    const total = typeActivities.length;
    if (total > 0) {
      weeklyGoals[type] = { completed, total, percentage: Math.round((completed / total) * 100) };
    }
  });

  const completedMilestones = milestones.filter(m => m.completed).length;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ width: 50, height: 50, background: '#00a1de', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🚊</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 300, color: '#333' }}>Fitness Progress Tracker</h1>
        <div style={{ marginLeft: 'auto', fontSize: '1.2rem', color: '#666' }}>
          {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Instructions */}
        <CollapsibleSection
          title="📋 How to Use This Fitness Tracker"
          isOpen={showInstructions}
          onToggle={() => setShowInstructions(!showInstructions)}
          headerColor="#00a1de"
        >
          <ul style={{ marginLeft: '1.5rem', lineHeight: 1.8 }}>
            <li><strong>Add Activities:</strong> Click the blue + button to add fitness activities</li>
            <li><strong>Activity Types:</strong> Choose from 6 types with customizable CTA colors</li>
            <li><strong>Customize Colors:</strong> Assign CTA line colors to activity types</li>
            <li><strong>Create Milestones:</strong> Add milestones to track your journey</li>
            <li><strong>Track Progress:</strong> View today's activities with live countdown timers</li>
            <li><strong>Complete Activities:</strong> Mark activities complete with the ✓ button</li>
            <li><strong>Weekly Goals:</strong> Track weekly progress by activity type</li>
            <li><strong>Persistent Storage:</strong> All data saves automatically</li>
          </ul>
          <button onClick={clearAllData} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#c60c30', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Clear All Data
          </button>
        </CollapsibleSection>

        {/* Customize Section */}
        <CollapsibleSection
          title="🎨 Customize Categories & Milestones"
          isOpen={showCustomize}
          onToggle={() => setShowCustomize(!showCustomize)}
          headerColor="#522398"
        >
          <CustomizeSection 
            categoryColors={categoryColors}
            setCategoryColors={setCategoryColors}
            milestones={milestones}
            addMilestone={addMilestone}
            toggleMilestone={toggleMilestone}
            deleteMilestone={deleteMilestone}
          />
        </CollapsibleSection>

        {/* Progress Map */}
        <ProgressMap 
          milestones={milestones}
          toggleMilestone={toggleMilestone}
          lineColor={categoryColors.cardio}
        />

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 400 }}>Your Fitness Goal</h2>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            Updated: {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}
          </div>
        </div>

        <div style={{ background: '#4a4a4a', color: 'white', padding: '1.5rem', borderRadius: 4, marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 300 }}>Get Started</div>
        </div>

        <div style={{ background: '#3a3a3a', padding: '1rem 1.5rem', borderRadius: 4, marginBottom: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <StatItem icon="✓" label="Completed" value={stats.completed} />
          <StatItem icon="⚡" label="Active" value={stats.active} />
          <StatItem icon="📅" label="Scheduled" value={stats.scheduled} />
        </div>

        {/* Today's Schedule */}
        <ActivitySection
          title="Today's Schedule"
          activities={todayActivities}
          categoryColors={categoryColors}
          calculateTimeRemaining={calculateTimeRemaining}
          markComplete={markComplete}
          deleteActivity={deleteActivity}
          emptyIcon="🏃"
          emptyText="No activities scheduled for today. Click the + button to add your first activity!"
        />

        {/* Weekly Goals */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ background: '#2a2a2a', color: 'white', padding: '1rem 1.5rem', fontSize: '1.1rem', borderRadius: '4px 4px 0 0' }}>
            This Week's Goals
          </div>
          {Object.keys(weeklyGoals).length === 0 ? (
            <div style={{ background: 'white', padding: '3rem', borderRadius: '0 0 4px 4px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
              <div>Start adding activities to track your weekly progress!</div>
            </div>
          ) : (
            <div>
              {Object.entries(weeklyGoals).map(([type, data]) => (
                <div key={type} style={{ background: categoryColors[type], padding: '1.5rem', marginBottom: 2, color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.3rem' }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>
                        {data.completed} of {data.total} completed
                      </div>
                      <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: '0.8rem', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'white', borderRadius: 4, width: `${data.percentage}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 300 }}>{data.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: 60, height: 60, background: '#00a1de', color: 'white', border: 'none', borderRadius: '50%', fontSize: '2rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 100 }}
      >
        +
      </button>

      {/* Add Activity Modal */}
      {showAddModal && (
        <AddActivityModal
          onClose={() => setShowAddModal(false)}
          onAdd={(formData) => {
            addActivity(formData);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function CollapsibleSection({ title, isOpen, onToggle, headerColor, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 8, marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div 
        onClick={onToggle}
        style={{ background: headerColor, color: 'white', padding: '1rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
      </div>
      <div style={{ maxHeight: isOpen ? 1000 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        <div style={{ padding: '2rem' }}>{children}</div>
      </div>
    </div>
  );
}

function CustomizeSection({ categoryColors, setCategoryColors, milestones, addMilestone, toggleMilestone, deleteMilestone }) {
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneValue, setMilestoneValue] = useState('');

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>CTA Line Colors</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {Object.entries(CTA_COLORS).map(([name, color]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 4, background: color, color: name === 'yellow' ? '#333' : 'white', fontSize: '0.85rem' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: color }} />
            {name.charAt(0).toUpperCase() + name.slice(1)} Line
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Assign Colors to Activity Types</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {Object.keys(categoryColors).map(type => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontWeight: 500, minWidth: 100 }}>{type.charAt(0).toUpperCase() + type.slice(1)}:</label>
            <select 
              value={categoryColors[type]}
              onChange={(e) => setCategoryColors(prev => ({ ...prev, [type]: e.target.value }))}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem', flex: 1 }}
            >
              {Object.entries(CTA_COLORS).map(([name, color]) => (
                <option key={name} value={color}>{name.charAt(0).toUpperCase() + name.slice(1)} Line</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: 4, marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Create Your Progress Map</h3>
        <p style={{ marginBottom: '1rem', color: '#666' }}>Add milestones to visualize your fitness journey like a train route!</p>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input 
            type="text" 
            value={milestoneName}
            onChange={(e) => setMilestoneName(e.target.value)}
            placeholder="Milestone name (e.g., 'First 5K')"
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
          />
          <input 
            type="text"
            value={milestoneValue}
            onChange={(e) => setMilestoneValue(e.target.value)}
            placeholder="Goal (e.g., '5 lbs')"
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
          />
          <button 
            onClick={() => {
              addMilestone(milestoneName, milestoneValue);
              setMilestoneName('');
              setMilestoneValue('');
            }}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#00a1de', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Add
          </button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          {milestones.length === 0 ? (
            <p style={{ color: '#999' }}>No milestones added yet</p>
          ) : (
            milestones.map(m => (
              <div key={m.id} style={{ background: 'white', padding: '1rem', borderRadius: 4, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <strong>{m.name}</strong>
                  {m.value && <span style={{ color: '#666' }}> - {m.value}</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => toggleMilestone(m.id)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: m.completed ? '#e0e0e0' : '#00a1de', color: m.completed ? '#333' : 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    {m.completed ? '✓ Done' : 'Mark Complete'}
                  </button>
                  <button 
                    onClick={() => deleteMilestone(m.id)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#c60c30', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressMap({ milestones, toggleMilestone, lineColor }) {
  const completedCount = milestones.filter(m => m.completed).length;

  return (
    <div style={{ background: 'white', padding: '2rem', borderRadius: 8, marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 400, marginBottom: '2rem', color: '#333', textAlign: 'center' }}>
        Your Fitness Journey
      </div>
      <div style={{ overflowX: 'auto', padding: '1rem 0' }}>
        {milestones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚂</div>
            <div>Add milestones above to see your progress map!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 'min-content', padding: '1rem' }}>
            {milestones.map((m, index) => {
              const isCompleted = m.completed;
              const isCurrent = !m.completed && index === completedCount;
              const segmentCompleted = index < completedCount;

              return (
                <React.Fragment key={m.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div 
                      onClick={() => toggleMilestone(m.id)}
                      style={{
                        width: isCurrent ? 24 : 20,
                        height: isCurrent ? 24 : 20,
                        borderRadius: '50%',
                        background: isCompleted || isCurrent ? lineColor : '#ddd',
                        border: '3px solid white',
                        boxShadow: `0 0 0 2px ${isCompleted || isCurrent ? lineColor : '#ddd'}`,
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        animation: isCurrent ? 'pulse 2s infinite' : 'none',
                        zIndex: 2,
                        position: 'relative'
                      }}
                    />
                    <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: isCompleted ? lineColor : '#666', fontWeight: isCompleted ? 600 : 400, whiteSpace: 'nowrap', maxWidth: 120, lineHeight: 1.4 }}>
                      {m.name}
                      {m.value && <><br />{m.value}</>}
                    </div>
                  </div>
                  {index < milestones.length - 1 && (
                    <div style={{ height: 4, background: segmentCompleted ? lineColor : '#ddd', flex: 1, minWidth: 80, margin: '0 -2px', position: 'relative', zIndex: 1 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
      <div style={{ width: 30, height: 30, background: '#555', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.9rem' }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{value}</div>
      </div>
    </div>
  );
}

function ActivitySection({ title, activities, categoryColors, calculateTimeRemaining, markComplete, deleteActivity, emptyIcon, emptyText }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ background: '#2a2a2a', color: 'white', padding: '1rem 1.5rem', fontSize: '1.1rem', borderRadius: '4px 4px 0 0' }}>
        {title}
      </div>
      {activities.length === 0 ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '0 0 4px 4px', textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{emptyIcon}</div>
          <div>{emptyText}</div>
        </div>
      ) : (
        <div>
          {activities.map(activity => {
            const timeDisplay = activity.status === 'completed' ? '✓' : calculateTimeRemaining(activity.scheduledTime);
            
            return (
              <div key={activity.id} style={{ background: categoryColors[activity.type], padding: '1.5rem', marginBottom: 2, color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.3rem' }}>
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {activity.name}
                      {activity.status === 'active' && (
                        <span style={{ width: 8, height: 8, background: 'white', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 300 }}>{timeDisplay}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', width: '100%' }}>
                    {activity.status !== 'completed' && (
                      <button 
                        onClick={() => markComplete(activity.id)}
                        style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 4, background: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        ✓ Complete
                      </button>
                    )}
                    <button 
                      onClick={() => deleteActivity(activity.id)}
                      style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 4, background: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddActivityModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    type: 'cardio',
    name: '',
    description: '',
    scheduledTime: '',
    duration: 30
  });

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setFormData(prev => ({ ...prev, scheduledTime: now.toISOString().slice(0, 16) }));
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    onAdd(formData);
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: 8, width: '90%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 400, marginBottom: '1.5rem', color: '#333' }}>Add New Activity</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 500 }}>Activity Type</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '1rem' }}
              required
            >
              <option value="cardio">Cardio</option>
              <option value="strength">Strength Training</option>
              <option value="flexibility">Flexibility</option>
              <option value="nutrition">Nutrition</option>
              <option value="recovery">Recovery</option>
              <option value="endurance">Endurance</option>
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 500 }}>Activity Name</label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Morning Run, Yoga Session"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '1rem' }}
              required
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 500 }}>Description (Optional)</label>
            <input 
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., 5K run in the park"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '1rem' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 500 }}>Scheduled Time</label>
            <input 
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '1rem' }}
              required
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 500 }}>Duration (minutes)</label>
            <input 
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              min="1"
              max="480"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '1rem' }}
            />
          </div>
          <div>
            <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#00a1de', color: 'white', border: 'none', borderRadius: 4, fontSize: '1rem', cursor: 'pointer', marginRight: '0.5rem' }}>
              Add Activity
            </button>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: 4, fontSize: '1rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}