'use client';

import { useState, useEffect } from 'react';
import { supabase, type Task } from '@/lib/supabase';

const statusColors: Record<string, string> = {
  backlog: 'bg-gray-600',
  in_progress: 'bg-blue-600',
  review: 'bg-yellow-600',
  done: 'bg-green-600',
};

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchTasks();

    // Realtime subscription
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await supabase.from('tasks').insert({
      title: newTitle,
      description: newDesc || null,
      status: 'backlog',
    });

    setNewTitle('');
    setNewDesc('');
  }

  async function updateStatus(id: number, status: string) {
    await supabase.from('tasks').update({ status }).eq('id', id);
  }

  async function updateAssignee(id: number, assignee: string | null) {
    await supabase.from('tasks').update({ assignee }).eq('id', id);
  }

  async function deleteTask(id: number) {
    await supabase.from('tasks').delete().eq('id', id);
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading tasks...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Task Board</h2>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
        >
          + Add Task
        </button>
      </form>

      {/* Task Columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700">
            <h3 className={`text-sm font-semibold mb-3 px-2 py-1 rounded ${statusColors[status]} text-white inline-block`}>
              {label} ({tasks.filter((t) => t.status === status).length})
            </h3>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.status === status)
                .map((task) => (
                  <div key={task.id} className="bg-gray-700/50 rounded p-3 border border-gray-600">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-medium text-gray-100">{task.title}</p>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-500 hover:text-red-400 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                    )}
                    <div className="mt-2 flex gap-1 flex-wrap">
                      <select
                        value={task.assignee || ''}
                        onChange={(e) => updateAssignee(task.id, e.target.value || null)}
                        className="text-xs bg-gray-600 border border-gray-500 rounded px-2 py-1 text-gray-100 focus:outline-none"
                      >
                        <option value="">Unassigned</option>
                        <option value="Captain">Captain</option>
                        <option value="Zenith">Zenith</option>
                      </select>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
