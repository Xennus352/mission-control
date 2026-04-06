'use client';

import { useState, useEffect } from 'react';
import { supabase, type AgentState } from '@/lib/supabase';

// Office zone definitions (percentage-based 0-100)
const ZONES = {
  WORK: { x: 5, y: 5, width: 50, height: 45, label: 'WORK AREA' },
  MEETING: { x: 62, y: 5, width: 32, height: 30, label: 'MEETING ROOM' },
  REST: { x: 62, y: 42, width: 32, height: 30, label: 'REST LOUNGE' },
  REVIEW: { x: 5, y: 58, width: 50, height: 22, label: 'REVIEW STATION' },
};

// Desk positions within work area (percentage)
const DESK_POSITIONS = [
  { x: 10, y: 15 },
  { x: 28, y: 15 },
  { x: 44, y: 15 },
  { x: 10, y: 35 },
  { x: 28, y: 35 },
  { x: 44, y: 35 },
];

// Meeting table positions
const MEETING_POSITIONS = [
  { x: 68, y: 15 },
  { x: 82, y: 15 },
  { x: 68, y: 25 },
  { x: 82, y: 25 },
  { x: 75, y: 20 },
];

// Rest lounge positions
const REST_POSITIONS = [
  { x: 67, y: 50 },
  { x: 80, y: 50 },
  { x: 73, y: 60 },
  { x: 86, y: 60 },
  { x: 73, y: 68 },
];

// Review board position
const REVIEW_POSITION = { x: 28, y: 68 };

function getRoleIcon(role: string): string {
  const lower = role.toLowerCase();
  if (lower.includes('ceo') || lower.includes('captain') || lower.includes('lead') || lower.includes('manager')) return '👑';
  if (lower.includes('cto') || lower.includes('tech') || lower.includes('architect')) return '⚙️';
  if (lower.includes('dev') || lower.includes('engineer') || lower.includes('coder') || lower.includes('assistant') || lower.includes('ai')) return '💻';
  if (lower.includes('product') || lower.includes('pm')) return '📊';
  if (lower.includes('ops') || lower.includes('operation') || lower.includes('devops')) return '🔧';
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) return '🎨';
  if (lower.includes('historian') || lower.includes('research') || lower.includes('data')) return '📚';
  if (lower.includes('writer') || lower.includes('content') || lower.includes('copy')) return '✍️';
  if (lower.includes('test') || lower.includes('qa')) return '🧪';
  return '👤';
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'working':
      return {
        color: '#22c55e',
        label: 'WORKING',
        icon: '⚡',
        glow: '0 0 12px rgba(34, 197, 94, 0.8)',
      };
    case 'idle':
      return {
        color: '#3b82f6',
        label: 'IDLE',
        icon: '☕',
        glow: '0 0 10px rgba(59, 130, 246, 0.5)',
      };
    case 'reviewing':
      return {
        color: '#eab308',
        label: 'REVIEWING',
        icon: '👁',
        glow: '0 0 12px rgba(234, 179, 8, 0.8)',
      };
    case 'offline':
    default:
      return {
        color: '#4b5563',
        label: 'OFFLINE',
        icon: '💤',
        glow: 'none',
      };
  }
}

function getAgentPosition(agent: AgentState, agentIndex: number) {
  const status = agent.status;
  
  if (status === 'offline') {
    return { x: -10, y: -10, visible: false };
  }
  
  if (status === 'working') {
    const deskPos = DESK_POSITIONS[agentIndex % DESK_POSITIONS.length];
    return { x: deskPos.x, y: deskPos.y, visible: true, zone: 'work' };
  }
  
  if (status === 'idle') {
    const restPos = REST_POSITIONS[agentIndex % REST_POSITIONS.length];
    return { x: restPos.x, y: restPos.y, visible: true, zone: 'rest' };
  }
  
  if (status === 'reviewing') {
    const offset = (agentIndex % 3) - 1;
    return { 
      x: REVIEW_POSITION.x + offset * 10, 
      y: REVIEW_POSITION.y, 
      visible: true, 
      zone: 'review' 
    };
  }
  
  return { x: 10, y: 15, visible: true, zone: 'work' };
}

export default function DigitalOffice() {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);
  const [agentPositions, setAgentPositions] = useState<Record<number, { x: number; y: number; visible: boolean; zone?: string }>>({});

  useEffect(() => {
    fetchAgents();

    const channel = supabase
      .channel('office-zones-v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_states' },
        () => {
          fetchAgents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const positions: Record<number, { x: number; y: number; visible: boolean; zone?: string }> = {};
    agents.forEach((agent, index) => {
      positions[agent.id] = getAgentPosition(agent, index);
    });
    setAgentPositions(positions);
  }, [agents]);

  async function fetchAgents() {
    try {
      const { data, error } = await supabase
        .from('agent_states')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching agents:', error);
        return;
      }

      if (data) {
        setAgents(data as AgentState[]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setLoading(false);
    }
  }

  async function updateAgentStatus(agentId: number, status: string) {
    await supabase
      .from('agent_states')
      .update({ status })
      .eq('id', agentId);
  }

  function getAgentsByZone(zone: string) {
    return agents.filter((agent) => {
      const pos = agentPositions[agent.id];
      return pos?.zone === zone;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-slate-950">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🏢</div>
          <p className="text-gray-400 font-mono text-sm">INITIALIZING OFFICE ZONES...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 w-full h-full min-h-screen p-2 md:p-4">
      {/* Header */}
      <div className="mb-3 md:mb-4 flex flex-wrap justify-between items-center gap-2">
        <div>
          <h2 className="text-base md:text-xl font-bold text-gray-100 font-mono">DIGITAL OFFICE</h2>
          <p className="text-[9px] md:text-xs text-gray-400 mt-0.5 md:mt-1 font-mono">
            {agents.length} AGENTS • MULTI-ZONE WORKSPACE
          </p>
        </div>
        {/* Zone Stats */}
        <div className="flex gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-mono">
          <div className="px-1.5 md:px-2 py-0.5 md:py-1 bg-green-900/30 border border-green-700/50 rounded text-green-400">
            WORK: {getAgentsByZone('work').length}
          </div>
          <div className="px-1.5 md:px-2 py-0.5 md:py-1 bg-blue-900/30 border border-blue-700/50 rounded text-blue-400">
            REST: {getAgentsByZone('rest').length}
          </div>
          <div className="px-1.5 md:px-2 py-0.5 md:py-1 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-400">
            REVIEW: {getAgentsByZone('review').length}
          </div>
        </div>
      </div>

      {/* Office Floor - Responsive Multi-Zone Layout */}
      <div className="relative w-full bg-slate-900 border-2 md:border-4 border-slate-700 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '400px' }}>
        {/* Checkerboard Floor */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                #1e293b 0px,
                #1e293b 19px,
                #0f172a 19px,
                #0f172a 20px
              ),
              repeating-linear-gradient(
                90deg,
                #1e293b 0px,
                #1e293b 19px,
                #0f172a 19px,
                #0f172a 20px
              )
            `,
            backgroundSize: '5% 5%',
            opacity: 0.3,
          }}
        />

        {/* Zone Boundaries */}
        {/* Work Area */}
        <div 
          className="absolute border border-dashed rounded-md md:rounded-lg"
          style={{
            left: `${ZONES.WORK.x}%`,
            top: `${ZONES.WORK.y}%`,
            width: `${ZONES.WORK.width}%`,
            height: `${ZONES.WORK.height}%`,
            borderColor: 'rgba(34, 197, 94, 0.3)',
            backgroundColor: 'rgba(34, 197, 94, 0.05)',
          }}
        >
          <div className="absolute -top-1.5 md:-top-2 left-2 md:left-4 px-1 md:px-2 py-0.5 bg-slate-900 text-[7px] md:text-[9px] font-mono text-green-400 border border-green-700/50 rounded">
            💼 {ZONES.WORK.label}
          </div>
        </div>

        {/* Meeting Room */}
        <div 
          className="absolute border border-dashed rounded-md md:rounded-lg"
          style={{
            left: `${ZONES.MEETING.x}%`,
            top: `${ZONES.MEETING.y}%`,
            width: `${ZONES.MEETING.width}%`,
            height: `${ZONES.MEETING.height}%`,
            borderColor: 'rgba(168, 85, 247, 0.3)',
            backgroundColor: 'rgba(168, 85, 247, 0.05)',
          }}
        >
          <div className="absolute -top-1.5 md:-top-2 left-2 md:left-4 px-1 md:px-2 py-0.5 bg-slate-900 text-[7px] md:text-[9px] font-mono text-purple-400 border border-purple-700/50 rounded">
            🎯 {ZONES.MEETING.label}
          </div>
        </div>

        {/* Rest Lounge */}
        <div 
          className="absolute border border-dashed rounded-md md:rounded-lg"
          style={{
            left: `${ZONES.REST.x}%`,
            top: `${ZONES.REST.y}%`,
            width: `${ZONES.REST.width}%`,
            height: `${ZONES.REST.height}%`,
            borderColor: 'rgba(59, 130, 246, 0.3)',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
          }}
        >
          <div className="absolute -top-1.5 md:-top-2 left-2 md:left-4 px-1 md:px-2 py-0.5 bg-slate-900 text-[7px] md:text-[9px] font-mono text-blue-400 border border-blue-700/50 rounded">
            ☕ {ZONES.REST.label}
          </div>
        </div>

        {/* Review Station */}
        <div 
          className="absolute border border-dashed rounded-md md:rounded-lg"
          style={{
            left: `${ZONES.REVIEW.x}%`,
            top: `${ZONES.REVIEW.y}%`,
            width: `${ZONES.REVIEW.width}%`,
            height: `${ZONES.REVIEW.height}%`,
            borderColor: 'rgba(234, 179, 8, 0.3)',
            backgroundColor: 'rgba(234, 179, 8, 0.05)',
          }}
        >
          <div className="absolute -top-1.5 md:-top-2 left-2 md:left-4 px-1 md:px-2 py-0.5 bg-slate-900 text-[7px] md:text-[9px] font-mono text-yellow-400 border border-yellow-700/50 rounded">
            👁 {ZONES.REVIEW.label}
          </div>
        </div>

        {/* Meeting Table */}
        <div 
          className="absolute rounded-md border border-purple-700/50"
          style={{
            left: '72%',
            top: '14%',
            width: '12%',
            height: '10%',
            backgroundColor: 'rgba(147, 51, 234, 0.2)',
          }}
        >
          <div className="text-center text-[6px] md:text-[8px] text-purple-300 font-mono mt-1 md:mt-2">MEETING</div>
        </div>

        {/* Review Board */}
        <div 
          className="absolute rounded-md border border-yellow-700/50"
          style={{
            left: '18%',
            top: '62%',
            width: '25%',
            height: '15%',
            backgroundColor: 'rgba(234, 179, 8, 0.15)',
          }}
        >
          <div className="text-center text-[7px] md:text-[9px] text-yellow-300 font-mono mt-1 md:mt-2">
            📊 REVIEW
          </div>
        </div>

        {/* Rest Area Sofas */}
        <div 
          className="absolute rounded-md border border-blue-700/30"
          style={{
            left: '66%',
            top: '48%',
            width: '10%',
            height: '6%',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
          }}
        >
          <div className="text-center text-[5px] md:text-[7px] text-blue-300 font-mono mt-0.5 md:mt-1">SOFA</div>
        </div>
        <div 
          className="absolute rounded-md border border-blue-700/30"
          style={{
            left: '78%',
            top: '48%',
            width: '10%',
            height: '6%',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
          }}
        >
          <div className="text-center text-[5px] md:text-[7px] text-blue-300 font-mono mt-0.5 md:mt-1">SOFA</div>
        </div>

        {/* Desks in Work Area */}
        {DESK_POSITIONS.map((desk, idx) => {
          return (
            <div
              key={idx}
              className="absolute"
              style={{ 
                left: `${desk.x}%`, 
                top: `${desk.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Desk */}
              <div 
                className="w-12 md:w-20 lg:w-24 h-8 md:h-12 lg:h-14 bg-amber-800/80 rounded-sm md:rounded border border-amber-900 relative"
                style={{ 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {/* Monitor */}
                <div className="absolute -top-6 md:-top-8 lg:-top-10 left-1/2 -translate-x-1/2">
                  <div className="bg-slate-800 rounded-sm border border-slate-600 p-0.5" style={{ width: '28px', height: '20px' }}>
                    <div className="w-full h-full rounded-sm bg-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Agents - Positioned by percentage */}
        {agents.map((agent, index) => {
          const pos = agentPositions[agent.id] || { x: 10, y: 15, visible: true, zone: 'work' };
          const config = getStatusConfig(agent.status);
          const roleIcon = getRoleIcon(agent.role);
          const isHovered = hoveredAgent === agent.id;
          const isSelected = selectedAgent?.id === agent.id;

          if (!pos.visible) return null;

          return (
            <div
              key={agent.id}
              className="absolute transition-all duration-700 ease-in-out cursor-pointer"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%) ${isHovered || isSelected ? 'scale(1.2)' : 'scale(1)'}`,
                zIndex: isHovered || isSelected ? 100 : 10,
              }}
              onClick={() => setSelectedAgent(isSelected ? null : agent)}
              onMouseEnter={() => setHoveredAgent(agent.id)}
              onMouseLeave={() => setHoveredAgent(null)}
            >
              {/* Avatar */}
              <div className="relative">
                {/* Status indicator */}
                <div 
                  className="absolute -top-4 md:-top-6 left-1/2 -translate-x-1/2 text-xs md:text-sm animate-bounce"
                  style={{ filter: `drop-shadow(${config.glow})` }}
                >
                  {config.icon}
                </div>

                {/* Avatar Circle */}
                <div
                  className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-base md:text-xl bg-slate-700 border-2 transition-all duration-300"
                  style={{
                    borderColor: config.color,
                    boxShadow: config.glow,
                  }}
                >
                  {roleIcon}
                  
                  {/* Working ping */}
                  {agent.status === 'working' && (
                    <div 
                      className="absolute -top-0.5 md:-top-1 -right-0.5 md:-right-1 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full animate-ping"
                      style={{ backgroundColor: config.color }}
                    />
                  )}
                </div>

                {/* Name Label */}
                <div className="absolute -bottom-4 md:-bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div 
                    className="text-[6px] md:text-[7px] lg:text-[8px] font-mono px-1 md:px-1.5 py-0.5 rounded bg-slate-800/95 border"
                    style={{ 
                      borderColor: config.color,
                      color: config.color,
                      maxWidth: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {agent.agent_name.split(' ')[0].substring(0, 8)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Door */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 md:w-20 h-3 md:h-5 bg-amber-900 rounded-t border border-amber-950" />
      </div>

      {/* Legend */}
      <div className="mt-2 md:mt-3 flex flex-wrap gap-2 md:gap-3 text-[8px] md:text-[10px] font-mono text-gray-400">
        <div className="flex items-center gap-1 md:gap-1.5">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500" />
          <span>WORK</span>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-500" />
          <span>IDLE</span>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-purple-500" />
          <span>MEETING</span>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-yellow-500" />
          <span>REVIEW</span>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-600" />
          <span>OFFLINE</span>
        </div>
      </div>

      {/* Selected Agent Detail Panel */}
      {selectedAgent && (() => {
        const config = getStatusConfig(selectedAgent.status);
        return (
          <div className="fixed bottom-2 md:bottom-4 right-2 md:right-4 z-50 max-w-[280px] md:max-w-xs w-full">
            <div className="bg-slate-900 border-2 border-slate-600 rounded-lg shadow-2xl p-3 md:p-4">
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg md:text-xl bg-slate-700 border-2"
                    style={{ borderColor: config.color }}
                  >
                    {getRoleIcon(selectedAgent.role)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-100 font-mono text-[9px] md:text-xs">
                      {selectedAgent.agent_name}
                    </h3>
                    <p className="text-[7px] md:text-[9px] text-gray-400 font-mono">{selectedAgent.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-gray-200 text-[9px] md:text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <div>
                  <div className="text-[6px] md:text-[8px] text-gray-500 font-mono mb-0.5 md:mb-1">STATUS</div>
                  <div
                    className="inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded text-[7px] md:text-[9px] font-mono text-white"
                    style={{ backgroundColor: config.color }}
                  >
                    {config.icon} {config.label}
                  </div>
                </div>

                {selectedAgent.current_task && (
                  <div>
                    <div className="text-[6px] md:text-[8px] text-gray-500 font-mono mb-0.5 md:mb-1">TASK</div>
                    <div className="text-[8px] md:text-[10px] text-gray-200 bg-slate-800 rounded p-1.5 md:p-2 font-mono leading-tight">
                      {selectedAgent.current_task}
                    </div>
                  </div>
                )}

                <div className="pt-1.5 md:pt-2 border-t border-slate-700">
                  <select
                    value={selectedAgent.status}
                    onChange={(e) => {
                      updateAgentStatus(selectedAgent.id, e.target.value);
                    }}
                    className="w-full px-1.5 md:px-2 py-0.5 md:py-1 bg-slate-800 border border-slate-600 rounded text-[7px] md:text-[9px] text-gray-100 font-mono"
                  >
                    <option value="working">⚡ WORK</option>
                    <option value="idle">☕ IDLE</option>
                    <option value="reviewing">👁 REVIEW</option>
                    <option value="offline">💤 OFFLINE</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
