-- Mission Control Database Schema

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
  assignee TEXT CHECK (assignee IN ('Captain', 'Zenith')),
  related_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content items table
CREATE TABLE IF NOT EXISTS content_items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'idea' CHECK (stage IN ('idea', 'draft', 'review', 'final', 'published')),
  script TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memories table
CREATE TABLE IF NOT EXISTS memories (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  related_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent states table
CREATE TABLE IF NOT EXISTS agent_states (
  id BIGSERIAL PRIMARY KEY,
  agent_name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'working', 'reviewing', 'offline')),
  current_task TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (open for anon key in this demo)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_states ENABLE ROW LEVEL SECURITY;

-- Policies for full access with anon key
CREATE POLICY "Enable all operations for all users" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON content_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON memories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON agent_states FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE content_items REPLICA IDENTITY FULL;
ALTER TABLE memories REPLICA IDENTITY FULL;
ALTER TABLE events REPLICA IDENTITY FULL;
ALTER TABLE agent_states REPLICA IDENTITY FULL;
