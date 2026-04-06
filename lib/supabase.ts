import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  assignee: 'Captain' | 'Zenith' | null;
  related_id: number | null;
  created_at: string;
  updated_at: string;
};

export type ContentItem = {
  id: number;
  title: string;
  stage: 'idea' | 'draft' | 'review' | 'final' | 'published';
  script: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Memory = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: number;
  title: string;
  date: string;
  related_id: number | null;
  created_at: string;
  updated_at: string;
};

export type AgentState = {
  id: number;
  agent_name: string;
  role: string;
  status: 'idle' | 'working' | 'reviewing' | 'offline';
  current_task: string | null;
  created_at: string;
  updated_at: string;
};
