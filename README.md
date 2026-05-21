# DonStop

<p align="center">
  <img src="public/banner.png" alt="DonStop" />
</p>

Task timer built for ADHD focus. Write a task, start the clock, stop when done. Tags keep things organized. Google Calendar sync is optional. Zero friction to start working.

## Why

Keeping up with school, a part-time SWE job, and learning cybersecurity on the side is hard with ADHD. I wanted something that logs work as calendar events so I can see where my time actually goes. Seeing hours stack up in Google Calendar is motivating. Seeing the gaps where you were scrolling TikTok is even more motivating.

## Features

**Tasks**
- Flat task list with tags (name + icon), filter by tag
- Date-grouped headers: Today, Yesterday, N days ago, Never started
- Drag and drop to reorder
- Start, stop, finish, cancel, reset, transfer time between tasks
- Time edit popover (hh:mm:ss, mm:ss, or just seconds)
- Favorite tasks, inline rename, inline delete

**Timer**
- Live running clock per task
- Red favicon and tab title update when a task is active
- Ctrl+Enter to finish the active task from anywhere

**History**
- Full session log with timestamps and durations
- Activity feed: finishes, transfers, repositions, calendar events, settings changes
- Filter activity by type

**Settings**
- Primary color, light/dark/system theme, timezone, custom cursor
- Clear everything button

**Google Calendar (optional)**
- Link account, pick destination calendar, auto-sync on finish
- Requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

**PWA**
- Install from Chrome address bar
- Badge API shows a dot on the taskbar icon when a task is running
- Local-first, persists to localStorage

## Dev toolbar (dev only)

Bottom-right corner. Populate fake data, add quick tasks, show tour, copy store JSON, reset everything. Zero prod bundle impact.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3005
```

## Environment

No env vars needed to run locally. Optional:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_APP_URL=https://donstop.vercel.app
NEXT_PUBLIC_MALIK_DEBUG=false
```

## Google Calendar setup

1. Create a project in Google Cloud Console
2. Enable Google Calendar API
3. Configure OAuth consent screen
4. Create an OAuth Client ID (Web application)
5. Add `http://localhost:3005` to authorized origins
6. Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to `.env.local`
7. Restart dev server and open Calendar integration in the app

Scopes needed:
- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/calendar.calendars`

## Scripts

```bash
npm run dev        # dev server on port 3005
npm run build      # production build
npm run check      # TypeScript type check
npm run biome      # lint
npm run biome:fix  # lint + auto-fix
npm test           # unit tests
```

## AI

Built by me with strong opinions on architecture, file naming, UI, and what "too big" means for a file. Claude (claude-sonnet-4-6) pairs on this for bug fixes, UI polish, unit tests, drag-and-drop edge cases, Calendar integration, and store logic.
