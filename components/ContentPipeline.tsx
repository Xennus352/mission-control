'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, type ContentItem } from '@/lib/supabase';

const stageColors: Record<string, string> = {
  idea: 'bg-purple-600',
  draft: 'bg-blue-600',
  review: 'bg-yellow-600',
  final: 'bg-orange-600',
  published: 'bg-green-600',
};

const stageLabels: Record<string, string> = {
  idea: '💡 Idea',
  draft: '📝 Draft',
  review: '👀 Review',
  final: '✨ Final',
  published: '🚀 Published',
};

const stageDescriptions: Record<string, string> = {
  idea: 'Raw concepts and brainstorming',
  draft: 'Working scripts and outlines',
  review: 'Ready for feedback',
  final: 'Polished and approved',
  published: 'Live and distributed',
};

export default function ContentPipeline() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editScript, setEditScript] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newStage, setNewStage] = useState<ContentItem['stage']>('idea');
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel('content-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_items' },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) setItems(data as ContentItem[]);
    setLoading(false);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await supabase.from('content_items').insert({
      title: newTitle,
      stage: newStage,
    });

    setNewTitle('');
    setNewStage('idea');
  }

  async function updateStage(id: number, stage: string) {
    await supabase.from('content_items').update({ stage }).eq('id', id);
  }

  async function startEdit(item: ContentItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditScript(item.script || '');
    setEditImageUrl(item.image_url || '');
  }

  async function saveEdit(id: number) {
    await supabase
      .from('content_items')
      .update({ title: editTitle, script: editScript, image_url: editImageUrl || null })
      .eq('id', id);
    setEditingId(null);
  }

  async function handleImageUpload(id: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, convert to base64 and store in image_url field
    // Note: Better to use Supabase Storage with service role key
    setUploadingId(id);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      await supabase.from('content_items').update({ image_url: base64Data }).eq('id', id);
      setUploadingId(null);
    };
    reader.readAsDataURL(file);
  }

  async function deleteItem(id: number) {
    if (confirm('Delete this content item?')) {
      await supabase.from('content_items').delete().eq('id', id);
    }
  }

  function getItemsByStage(stage: ContentItem['stage']) {
    return items.filter((item) => item.stage === stage);
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading content pipeline...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Content Pipeline</h2>
          <p className="text-sm text-gray-400 mt-1">Manage ideas, scripts, and published content</p>
        </div>
      </div>

      {/* Add Content Form */}
      <form onSubmit={addItem} className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Content title or idea..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newStage}
            onChange={(e) => setNewStage(e.target.value as ContentItem['stage'])}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:outline-none"
          >
            {Object.entries(stageLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
          >
            + Add Content
          </button>
        </div>
      </form>

      {/* Pipeline Stages */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(stageLabels).map(([stageKey, stageLabel]) => {
          const stageItems = getItemsByStage(stageKey as ContentItem['stage']);
          return (
            <div key={stageKey} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${stageColors[stageKey]} text-white`}>
                    {stageLabel}
                  </span>
                  <span className="text-xs text-gray-500">({stageItems.length})</span>
                </div>
                <p className="text-xs text-gray-500">{stageDescriptions[stageKey]}</p>
              </div>

              <div className="space-y-3">
                {stageItems.map((item) => (
                  <div key={item.id} className="bg-gray-700/50 rounded p-3 border border-gray-600 hover:border-gray-500 transition-colors">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Title"
                        />
                        <textarea
                          value={editScript}
                          onChange={(e) => setEditScript(e.target.value)}
                          className="w-full px-2 py-2 bg-gray-600 border border-gray-500 rounded text-gray-100 text-xs min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          placeholder="Write your script or notes here..."
                        />
                        <input
                          type="text"
                          value={editImageUrl}
                          onChange={(e) => setEditImageUrl(e.target.value)}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Image URL (or upload below)"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(item.id, e)}
                            className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-600 file:text-gray-100 file:hover:bg-gray-500"
                          />
                          {uploadingId === item.id && <span className="text-xs text-gray-400">Uploading...</span>}
                        </div>
                        {editImageUrl && (
                          <img src={editImageUrl} alt="Preview" className="w-full rounded max-h-32 object-cover" />
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-100 flex-1">{item.title}</h4>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(item)}
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition-colors"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="px-2 py-1 bg-red-900/50 hover:bg-red-800 rounded text-xs transition-colors"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {item.script && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-300 whitespace-pre-wrap line-clamp-4 font-mono bg-gray-800/50 p-2 rounded">
                              {item.script}
                            </p>
                          </div>
                        )}

                        {item.image_url && (
                          <img src={item.image_url} alt="" className="w-full rounded mb-2 max-h-32 object-cover" />
                        )}

                        <div className="flex gap-1">
                          {stageKey !== 'published' && (
                            <button
                              onClick={() => updateStage(item.id, ['idea', 'draft', 'review', 'final', 'published'][['idea', 'draft', 'review', 'final', 'published'].indexOf(stageKey) + 1])}
                              className="flex-1 px-2 py-1 bg-blue-600/50 hover:bg-blue-600 rounded text-xs transition-colors"
                            >
                              → Next
                            </button>
                          )}
                          {stageKey !== 'idea' && (
                            <button
                              onClick={() => updateStage(item.id, ['idea', 'draft', 'review', 'final', 'published'][['idea', 'draft', 'review', 'final', 'published'].indexOf(stageKey) - 1])}
                              className="flex-1 px-2 py-1 bg-gray-600/50 hover:bg-gray-600 rounded text-xs transition-colors"
                            >
                              ← Back
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                          Updated: {new Date(item.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {stageItems.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-4">No items in this stage</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
