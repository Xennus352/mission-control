'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task, ContentItem, Memory, CalendarEvent, AgentState } from '@/lib/supabase';
import TaskBoard from '@/components/TaskBoard';
import ContentPipeline from '@/components/ContentPipeline';
import MemoryScreen from '@/components/MemoryScreen';
import CalendarView from '@/components/CalendarView';
import DigitalOffice from '@/components/DigitalOffice';

type Tab = 'tasks' | 'content' | 'calendar' | 'memories' | 'office';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('tasks');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'tasks', label: 'Task Board', icon: '📋' },
    { id: 'content', label: 'Content Pipeline', icon: '📝' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'memories', label: 'Memory Screen', icon: '🧠' },
    { id: 'office', label: 'Digital Office', icon: '🏢' },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="w-full max-w-[1600px] mx-auto px-2 md:px-4 py-3 md:py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🚀 Mission Control
          </h1>
          <p className="text-sm text-gray-400 mt-1">Real-time Supabase-powered dashboard</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-700 bg-gray-800/50">
        <div className="w-full max-w-[1600px] mx-auto px-2 md:px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400 bg-gray-700/50'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                }`}
              >
                <span className="mr-1 md:mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full max-w-[1600px] mx-auto px-2 md:px-4 py-4 md:py-6">
        {activeTab === 'tasks' && <TaskBoard />}
        {activeTab === 'content' && <ContentPipeline />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'memories' && <MemoryScreen />}
        {activeTab === 'office' && <DigitalOffice />}
      </main>
    </div>
  );
}
