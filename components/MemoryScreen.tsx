'use client';

import { useState, useEffect } from 'react';
import { supabase, type Memory } from '@/lib/supabase';

export default function MemoryScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filtered, setFiltered] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [viewingMemory, setViewingMemory] = useState<Memory | null>(null);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });

  useEffect(() => {
    fetchMemories();

    const channel = supabase
      .channel('memories-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories' },
        () => fetchMemories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(memories);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        memories.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.content.toLowerCase().includes(q)
        )
      );
    }
  }, [search, memories]);

  useEffect(() => {
    // Calculate stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    setStats({
      total: memories.length,
      thisWeek: memories.filter((m) => new Date(m.created_at) >= weekAgo).length,
      thisMonth: memories.filter((m) => new Date(m.created_at) >= monthAgo).length,
    });
  }, [memories]);

  async function fetchMemories() {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setMemories(data as Memory[]);
    setLoading(false);
  }

  async function addMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    await supabase.from('memories').insert({
      title: newTitle,
      content: newContent,
    });

    setNewTitle('');
    setNewContent('');
  }

  async function deleteMemory(id: number) {
    if (confirm('Delete this memory?')) {
      await supabase.from('memories').delete().eq('id', id);
      if (viewingMemory?.id === id) setViewingMemory(null);
    }
  }

  function highlightText(text: string, query: string) {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading memories...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Memory Screen</h2>
        <p className="text-sm text-gray-400 mt-1">Our shared knowledge base and experiences</p>
        
        {/* Stats */}
        <div className="flex gap-4 mt-3 text-xs">
          <div className="px-3 py-1.5 bg-gray-800/50 rounded border border-gray-700">
            <span className="text-gray-500">Total:</span>{' '}
            <span className="text-blue-400 font-medium">{stats.total}</span>
          </div>
          <div className="px-3 py-1.5 bg-gray-800/50 rounded border border-gray-700">
            <span className="text-gray-500">This week:</span>{' '}
            <span className="text-green-400 font-medium">{stats.thisWeek}</span>
          </div>
          <div className="px-3 py-1.5 bg-gray-800/50 rounded border border-gray-700">
            <span className="text-gray-500">This month:</span>{' '}
            <span className="text-purple-400 font-medium">{stats.thisMonth}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="🔍 Search through all memories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Add Memory Form */}
      <form onSubmit={addMemory} className="mb-6 p-4 bg-gradient-to-br from-gray-800/50 to-gray-800/30 rounded-lg border border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">💭 Add New Memory</h3>
        <input
          type="text"
          placeholder="Memory title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        />
        <textarea
          placeholder="What should we remember?"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] mb-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
        >
          💾 Save Memory
        </button>
      </form>

      {/* Viewing Single Memory */}
      {viewingMemory && (
        <div className="mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-600 p-6 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => setViewingMemory(null)}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              ← Back to all memories
            </button>
            <button
              onClick={() => deleteMemory(viewingMemory.id)}
              className="px-3 py-1 bg-red-900/50 hover:bg-red-800 rounded text-xs text-red-300 transition-colors"
            >
              🗑️ Delete
            </button>
          </div>
          <h3 className="text-2xl font-bold text-gray-100 mb-3">{viewingMemory.title}</h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{viewingMemory.content}</p>
          </div>
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-700">
            📅 Created: {new Date(viewingMemory.created_at).toLocaleString()}
          </p>
        </div>
      )}

      {/* Memories Grid */}
      {!viewingMemory && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((memory) => (
            <div
              key={memory.id}
              onClick={() => setViewingMemory(memory)}
              className="group bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-lg p-4 border border-gray-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-medium text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {highlightText(memory.title, search)}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMemory(memory.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-900/50 hover:bg-red-800 rounded text-xs text-red-300 transition-all"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-400 whitespace-pre-wrap line-clamp-4 mb-3">
                {highlightText(memory.content, search)}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  📅 {formatDate(memory.created_at)}
                </span>
                <span className="opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity">
                  Click to read →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">{search ? '🔍' : '💭'}</div>
          <p className="text-gray-500">
            {search ? 'No memories match your search.' : 'No memories yet. Let\'s start building our knowledge base!'}
          </p>
        </div>
      )}
    </div>
  );
}
