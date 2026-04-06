# 🚀 Mission Control

Real-time team workspace dashboard with task management, content pipeline, and digital office simulation.

## Features

- **📋 Task Board** - Kanban-style task tracking with real-time updates
- **📝 Content Pipeline** - Manage content from idea to publication
- **🧠 Memory Screen** - Searchable knowledge base with document-style layout
- **📅 Calendar** - Multi-view calendar with task integration
- **🏢 Digital Office** - Spatial game-style office with agent avatars and real-time status

## Tech Stack

- **Framework:** Next.js 16 with Turbopack
- **UI:** React 19, Tailwind CSS 4
- **Database:** Supabase (PostgreSQL + Realtime)
- **Language:** TypeScript 5

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Xennus352/mission-control.git
cd mission-control
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
Run the SQL in `schema.sql` in your Supabase SQL Editor.

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

Run `schema.sql` in your Supabase project to create the required tables:
- `tasks` - Task board data
- `content_items` - Content pipeline
- `memories` - Knowledge base
- `events` - Calendar events
- `agent_states` - Digital office agents

## Project Structure

```
mission-control/
├── app/              # Next.js app router
├── components/       # React components
│   ├── TaskBoard.tsx
│   ├── ContentPipeline.tsx
│   ├── MemoryScreen.tsx
│   ├── CalendarView.tsx
│   └── DigitalOffice.tsx
├── lib/
│   └── supabase.ts   # Supabase client
├── schema.sql        # Database schema
└── .env.example      # Environment template
```

## Agent Status Types

- **⚡ Working** - Agent at desk, actively working
- **☕ Idle** - Agent in rest lounge
- **👁 Reviewing** - Agent at review board
- **💤 Offline** - Agent hidden/inactive

## Security

⚠️ **Never commit `.env.local`** - It contains your Supabase credentials.

## License

MIT
