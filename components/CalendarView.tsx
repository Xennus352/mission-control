'use client';

import { useState, useEffect } from 'react';
import { supabase, type CalendarEvent, type Task } from '@/lib/supabase';

type ViewMode = 'month' | 'week' | 'list';

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchTasks();

    const eventsChannel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => fetchEvents()
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('tasks-changes-calendar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (!error && data) setEvents(data as CalendarEvent[]);
  }

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    await supabase.from('events').insert({
      title: newTitle,
      date: newDate,
    });

    setNewTitle('');
    setNewDate('');
  }

  async function deleteEvent(id: number) {
    if (confirm('Delete this event?')) {
      await supabase.from('events').delete().eq('id', id);
    }
  }

  function getTasksCreatedOnDate(dateStr: string) {
    return tasks.filter((t) => {
      const taskDate = new Date(t.created_at).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  }

  function getTasksUpdatedOnDate(dateStr: string) {
    return tasks.filter((t) => {
      const taskDate = new Date(t.updated_at).toISOString().split('T')[0];
      return taskDate === dateStr && t.status !== 'backlog';
    });
  }

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function getEventsForDay(dayNum: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return events.filter((e) => e.date === dateStr);
  }

  function navigatePrev() {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(day - 7);
      setCurrentDate(newDate);
    }
  }

  function navigateNext() {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(day + 7);
      setCurrentDate(newDate);
    }
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function getWeekDays() {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(day - dayOfWeek);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  }

  function formatDateShort(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading calendar...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Calendar</h2>
          <p className="text-sm text-gray-400 mt-1">Track events, deadlines, and task activity</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Add Event Form */}
      <form onSubmit={addEvent} className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Event title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
          >
            + Add Event
          </button>
        </div>
      </form>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <button onClick={navigatePrev} className="px-3 py-1.5 hover:bg-gray-700 rounded text-gray-300 transition-colors">
              ← Prev
            </button>
            <h3 className="font-medium text-gray-100 text-lg">{monthName}</h3>
            <div className="flex gap-2">
              <button onClick={goToToday} className="px-3 py-1.5 hover:bg-gray-700 rounded text-gray-300 transition-colors text-sm">
                Today
              </button>
              <button onClick={navigateNext} className="px-3 py-1.5 hover:bg-gray-700 rounded text-gray-300 transition-colors">
                Next →
              </button>
            </div>
          </div>

          {/* Week Headers */}
          <div className="grid grid-cols-7 border-b border-gray-700 bg-gray-800/30">
            {weekDays.map((dayName) => (
              <div key={dayName} className="px-2 py-2 text-center text-xs font-medium text-gray-400">
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((dayNum, idx) => {
              const dayEvents = dayNum ? getEventsForDay(dayNum) : [];
              const dateStr = dayNum ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : null;
              const dayTasks = dateStr ? [...getTasksCreatedOnDate(dateStr), ...getTasksUpdatedOnDate(dateStr)] : [];
              const isToday =
                dayNum &&
                dayNum === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border-b border-r border-gray-700 p-1 ${
                    dayNum ? 'bg-gray-800/30 hover:bg-gray-800/50' : 'bg-gray-900/30'
                  } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                >
                  {dayNum && (
                    <>
                      <span
                        className={`text-xs font-medium ${
                          isToday ? 'text-blue-400 font-bold' : 'text-gray-400'
                        }`}
                      >
                        {dayNum}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="text-[10px] bg-blue-900/50 text-blue-200 rounded px-1.5 py-0.5 truncate flex justify-between items-center group"
                          >
                            <span className="truncate">📅 {evt.title}</span>
                            <button
                              onClick={() => deleteEvent(evt.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={`task-${task.id}`}
                            className={`text-[10px] rounded px-1.5 py-0.5 truncate ${
                              task.status === 'done' ? 'bg-green-900/50 text-green-200' :
                              task.status === 'in_progress' ? 'bg-purple-900/50 text-purple-200' :
                              'bg-gray-700/50 text-gray-300'
                            }`}
                          >
                            {task.assignee === 'Zenith' ? '🤖' : '👤'} {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-[10px] text-gray-500">+{dayTasks.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <button onClick={navigatePrev} className="px-3 py-1.5 hover:bg-gray-700 rounded text-gray-300 transition-colors">
              ← Prev Week
            </button>
            <h3 className="font-medium text-gray-100">
              {formatDateShort(getWeekDays()[0])} - {formatDateShort(getWeekDays()[6])}
            </h3>
            <div className="flex gap-2">
              <button onClick={goToToday} className="px-3 py-1.5 hover:bg-gray-700 rounded text-gray-300 transition-colors text-sm">
                Today
              </button>
              <button onClick={navigateNext} className="px-3 py-1.5 hover:bg-gray-700 rounded text-gray-300 transition-colors">
                Next Week →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7">
            {getWeekDays().map((weekDay, idx) => {
              const dayNum = weekDay.getDate();
              const monthNum = weekDay.getMonth();
              const yearNum = weekDay.getFullYear();
              const dateStr = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.date === dateStr);
              const dayTasks = [...getTasksCreatedOnDate(dateStr), ...getTasksUpdatedOnDate(dateStr)];
              const isToday = weekDay.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  className={`min-h-[400px] border-r border-gray-700 p-2 ${
                    isToday ? 'bg-blue-900/20' : 'bg-gray-800/30'
                  }`}
                >
                  <div className={`text-center mb-2 pb-2 border-b border-gray-700 ${
                    isToday ? 'text-blue-400 font-bold' : 'text-gray-400'
                  }`}>
                    <div className="text-xs">{weekDays[weekDay.getDay()]}</div>
                    <div className="text-lg">{dayNum}</div>
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="text-xs bg-blue-900/50 text-blue-200 rounded px-2 py-1"
                      >
                        📅 {evt.title}
                      </div>
                    ))}
                    {dayTasks.map((task) => (
                      <div
                        key={`task-${task.id}`}
                        className={`text-xs rounded px-2 py-1 ${
                          task.status === 'done' ? 'bg-green-900/50 text-green-200' :
                          task.status === 'in_progress' ? 'bg-purple-900/50 text-purple-200' :
                          'bg-gray-700/50 text-gray-300'
                        }`}
                      >
                        {task.assignee === 'Zenith' ? '🤖' : '👤'} {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">📅 Scheduled Events</h3>
            <div className="space-y-2">
              {events
                .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((evt) => (
                  <div
                    key={evt.id}
                    className="flex justify-between items-center bg-gray-700/50 rounded px-3 py-2 border border-gray-600"
                  >
                    <div>
                      <span className="text-sm text-gray-100 font-medium">{evt.title}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(evt.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteEvent(evt.id)}
                      className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              {events.length === 0 && (
                <p className="text-center py-4 text-gray-500 text-sm">No upcoming events.</p>
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">📋 Recent Task Activity</h3>
            <div className="space-y-2">
              {tasks.slice(0, 15).map((task) => (
                <div
                  key={task.id}
                  className="flex justify-between items-center bg-gray-700/50 rounded px-3 py-2 border border-gray-600"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{task.assignee === 'Zenith' ? '🤖' : '👤'}</span>
                      <span className="text-sm text-gray-100">{task.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.status === 'done' ? 'bg-green-900/50 text-green-200' :
                        task.status === 'in_progress' ? 'bg-purple-900/50 text-purple-200' :
                        task.status === 'review' ? 'bg-yellow-900/50 text-yellow-200' :
                        'bg-gray-600/50 text-gray-300'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatDateShort(new Date(task.updated_at))}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-center py-4 text-gray-500 text-sm">No tasks yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
