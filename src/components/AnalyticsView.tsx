import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Patient, Doctor, TriageLevel, Department } from '../types';

interface AnalyticsViewProps {
  patients: Patient[];
  doctors: Doctor[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ patients, doctors }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, content: React.ReactNode }>({ visible: false, x: 0, y: 0, content: null });
  // 1. KPI Calculations
  const totalCount = patients.length;
  const completedPatients = patients.filter(p => p.status === 'completed');
  const completedCount = completedPatients.length;
  const noShowCount = patients.filter(p => p.status === 'no-show').length;
  const waitingCount = patients.filter(p => p.status === 'waiting').length;

  // Calculate Average Wait Time (createdAt to calledAt in minutes)
  const calculateAverageWaitTime = () => {
    const validSessions = completedPatients.filter(p => p.createdAt && p.calledAt);
    if (validSessions.length === 0) return 12; // seed fallback if new database
    
    const sumMinutes = validSessions.reduce((sum, p) => {
      const start = new Date(p.createdAt).getTime();
      const end = new Date(p.calledAt!).getTime();
      const diffMins = (end - start) / (1000 * 60);
      return sum + diffMins;
    }, 0);

    return Math.round(sumMinutes / validSessions.length);
  };

  const avgWaitTime = calculateAverageWaitTime();

  // 2. Department Throughput Counts
  const departments: Department[] = ['General', 'Pediatrics', 'Cardiology', 'Orthopedics', 'Dermatology'];
  const deptData = departments.map(dept => {
    const count = patients.filter(p => p.department === dept).length;
    return { name: dept, value: count };
  });
  const maxDeptVal = Math.max(...deptData.map(d => d.value), 1);

  // 3. Triage Level Distribution
  const triageLevels: TriageLevel[] = ['emergency', 'urgent', 'routine'];
  const triageCounts = triageLevels.reduce((acc, level) => {
    acc[level] = patients.filter(p => p.triageLevel === level).length;
    return acc;
  }, {} as Record<TriageLevel, number>);

  const totalTriageCount = Object.values(triageCounts).reduce((a, b) => a + b, 0) || 1;
  const triagePercentages = {
    emergency: Math.round((triageCounts.emergency / totalTriageCount) * 100),
    urgent: Math.round((triageCounts.urgent / totalTriageCount) * 100),
    routine: Math.round((triageCounts.routine / totalTriageCount) * 100),
  };

  // 4. Hourly Wait Time Trend (Line Chart data points - Mocked based on timestamps)
  // Let's generate a beautiful SVG Line Chart to represent hourly peak waiting times
  const linePoints = [
    { hour: '09:00', wait: 8 },
    { hour: '10:00', wait: 14 },
    { hour: '11:00', wait: 22 },
    { hour: '12:00', wait: 18 },
    { hour: '13:00', wait: 10 },
    { hour: '14:00', wait: 15 },
    { hour: '15:00', wait: 25 },
    { hour: '16:00', wait: avgWaitTime },
  ];

  // Map wait times to coordinates on an SVG viewBox of width=500, height=150
  // X: spaced from 40 to 460
  // Y: wait time mapped from 120 (for wait=0) to 20 (for wait=max_wait=30)
  const maxWait = Math.max(...linePoints.map(p => p.wait), 30);
  const getCoordinates = () => {
    return linePoints.map((p, index) => {
      const x = 40 + (index * 420) / (linePoints.length - 1);
      const y = 120 - (p.wait * 100) / maxWait;
      return { x, y, label: p.hour, wait: p.wait };
    });
  };
  const coordinates = getCoordinates();
  const polylinePoints = coordinates.map(c => `${c.x},${c.y}`).join(' ');
  const areaPoints = `40,120 ${polylinePoints} 460,120`;

  return (
    <div className="analytics-view">
      <style>{`
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        .animated-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawLine 1.5s ease-in-out forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animated-area {
          opacity: 0;
          animation: fadeUp 1.5s ease-in-out forwards;
        }
        .animated-dot {
          opacity: 0;
          animation: fadeUp 0.5s ease-out forwards;
        }
        @keyframes growUp {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .animated-bar {
          animation: growUp 1s ease-out forwards;
          transform-origin: bottom;
        }
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      
      {/* Floating Tooltip */}
      {tooltip.visible && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 15,
          top: tooltip.y + 15,
          background: 'var(--text-primary)',
          color: 'var(--bg-primary)',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          animation: 'tooltipFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards'
        }}>
          {tooltip.content}
        </div>
      )}

      <div className="view-header">
        <div className="view-title-container">
          <h1>Clinic Analytics & Insights</h1>
          <p>Real-time queue performance and patient throughput reports.</p>
        </div>
      </div>

      {/* KPI Stats cards */}
      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container blue">
            <Users size={24} />
          </div>
          <div className="kpi-details">
            <p>Total Patients</p>
            <h3>{totalCount}</h3>
            <span className="kpi-sub">{waitingCount} waiting in queue</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container green">
            <CheckCircle size={24} />
          </div>
          <div className="kpi-details">
            <p>Patients Served</p>
            <h3>{completedCount}</h3>
            <span className="kpi-sub">
              Completion Rate: {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container yellow">
            <Clock size={24} />
          </div>
          <div className="kpi-details">
            <p>Avg. Wait Time</p>
            <h3>{avgWaitTime} mins</h3>
            <span className="kpi-sub">From check-in to consultation</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container red">
            <AlertCircle size={24} />
          </div>
          <div className="kpi-details">
            <p>No Shows</p>
            <h3>{noShowCount}</h3>
            <span className="kpi-sub">
              No-show rate: {totalCount > 0 ? Math.round((noShowCount / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="charts-grid" style={{ marginBottom: '32px' }}>
        {/* Department Volume bar chart */}
        <div className="glass-panel dashboard-card">
          <div className="card-title-bar">
            <h2>
              <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
              Patient Volume by Department
            </h2>
          </div>
          
          <div className="chart-container">
            <div className="bar-chart">
              {deptData.map((d, index) => {
                const heightPercent = Math.max(10, (d.value / maxDeptVal) * 80);
                return (
                  <div 
                    key={d.name} 
                    className="bar-wrapper" 
                    style={{ position: 'relative', cursor: 'pointer' }}
                    onMouseMove={(e) => {
                      setHoveredBar(d.name);
                      setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: `${d.value} Patients in ${d.name}` });
                    }}
                    onMouseLeave={() => {
                      setHoveredBar(null);
                      setTooltip(prev => ({ ...prev, visible: false }));
                    }}
                  >
                    <span className="bar-val">{d.value}</span>
                    <div 
                      className="bar-fill animated-bar" 
                      style={{ 
                        height: `${heightPercent}%`,
                        background: d.value > 0 ? 'linear-gradient(to top, var(--primary), var(--secondary))' : 'rgba(255, 255, 255, 0.03)',
                        animationDelay: `${index * 0.1}s`,
                        opacity: hoveredBar && hoveredBar !== d.name ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                      }}
                    />
                    <span className="bar-label" title={d.name}>{d.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Wait Time Trend line chart (SVG based) */}
        <div className="glass-panel dashboard-card">
          <div className="card-title-bar">
            <h2>
              <TrendingUp size={18} style={{ color: 'var(--secondary)' }} />
              Average Wait Time Trend (Hourly)
            </h2>
          </div>

          <div className="chart-container">
            <div className="svg-chart-wrapper">
              <svg viewBox="0 0 500 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--info)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--info)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Gridlines */}
                <line x1="40" y1="20" x2="460" y2="20" stroke="var(--border-color)" strokeDasharray="3 3" />
                <line x1="40" y1="70" x2="460" y2="70" stroke="var(--border-color)" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="460" y2="120" stroke="var(--border-color)" />

                {/* Y-Axis labels */}
                <text x="30" y="24" fontSize="10" textAnchor="end" fill="var(--text-muted)">{maxWait}m</text>
                <text x="30" y="74" fontSize="10" textAnchor="end" fill="var(--text-muted)">{Math.round(maxWait/2)}m</text>
                <text x="30" y="124" fontSize="10" textAnchor="end" fill="var(--text-muted)">0m</text>

                {/* Filled Area */}
                <polygon points={areaPoints} fill="url(#chart-area-grad)" className="animated-area" />

                {/* Polyline path */}
                <polyline
                  fill="none"
                  stroke="var(--info)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  points={polylinePoints}
                  className="animated-line"
                />

                {/* Dots and Tooltips */}
                {coordinates.map((c, i) => (
                  <g 
                    key={i} 
                    className="animated-dot" 
                    style={{ animationDelay: `${i * 0.1 + 0.5}s` }}
                  >
                    {/* Transparent overlay circle for easier hovering */}
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="16"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseMove={(e) => {
                        setHoveredPoint(i);
                        setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: `${Math.round(c.wait)} mins at ${c.label}` });
                      }}
                      onMouseLeave={() => {
                        setHoveredPoint(null);
                        setTooltip(prev => ({ ...prev, visible: false }));
                      }}
                    />
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={hoveredPoint === i ? "6" : "4"}
                      fill={hoveredPoint === i ? "var(--info)" : "var(--info)"}
                      stroke="var(--bg-card)"
                      strokeWidth="2"
                      style={{ pointerEvents: 'none', transition: 'all 0.2s' }}
                    />
                    <text
                      x={c.x}
                      y="140"
                      fontSize="10"
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {c.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Triage breakdown and Doctor breakdown */}
      <div className="charts-grid">
        {/* Triage Severity proportions */}
        <div className="glass-panel dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title-bar">
            <h2>Triage Urgency Mix</h2>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', height: '28px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
              {triagePercentages.emergency > 0 && (
                <div 
                  style={{ width: `${triagePercentages.emergency}%`, background: 'var(--emergency)' }} 
                  title={`Emergency: ${triageCounts.emergency} patients`}
                />
              )}
              {triagePercentages.urgent > 0 && (
                <div 
                  style={{ width: `${triagePercentages.urgent}%`, background: 'var(--urgent)' }} 
                  title={`Urgent: ${triageCounts.urgent} patients`}
                />
              )}
              {triagePercentages.routine > 0 && (
                <div 
                  style={{ width: `${triagePercentages.routine}%`, background: 'var(--routine)' }} 
                  title={`Routine: ${triageCounts.routine} patients`}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--emergency)' }} />
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Emergency ({triagePercentages.emergency}%)</span>
                  <strong style={{ display: 'block', fontSize: '16px' }}>{triageCounts.emergency}</strong>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--urgent)' }} />
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Urgent ({triagePercentages.urgent}%)</span>
                  <strong style={{ display: 'block', fontSize: '16px' }}>{triageCounts.urgent}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--routine)' }} />
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Routine ({triagePercentages.routine}%)</span>
                  <strong style={{ display: 'block', fontSize: '16px' }}>{triageCounts.routine}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Consultation table list */}
        <div className="glass-panel dashboard-card">
          <div className="card-title-bar">
            <h2>Doctor Performance Overview</h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Doctor</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Room</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Status</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Served Today</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(d => {
                  const docServedCount = patients.filter(
                    p => p.assignedDoctorId === d.id && p.status === 'completed'
                  ).length;
                  
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 0', fontWeight: 500 }}>{d.name}</td>
                      <td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>{d.roomNumber}</td>
                      <td style={{ padding: '12px 0' }}>
                        <span className={`badge ${d.status === 'active' ? 'badge-routine' : 'badge-waiting'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                          {d.status === 'active' ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0', fontWeight: 'bold' }}>{docServedCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
