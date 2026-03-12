# DonStop

<p align="center">
	<a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js"></a>
	<a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white"></a>
	<a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white"></a>
	<a href="https://tailwindcss.com/"><img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white"></a>
	<a href="https://zustand-demo.pmnd.rs/"><img alt="Zustand" src="https://img.shields.io/badge/Zustand-State_Store-5A3E2B?logo=thestorygraph&logoColor=white"></a>
	<a href="https://dndkit.com/"><img alt="dnd-kit" src="https://img.shields.io/badge/dnd--kit-Drag_%26_Drop-6E56CF?logo=hackthebox&logoColor=white"></a>
	<a href="https://biomejs.dev/"><img alt="Biome" src="https://img.shields.io/badge/Biome-Lint_%26_Format-60A5FA?logo=biome&logoColor=white"></a>
</p>

Compact nested task and time-tracking app focused on low-friction flow: write tasks fast, structure them deeply, track active work live, keep history readable, and optionally mirror completed sessions to Google Calendar.

## 🎥 Demo

Demo video: [Add your video link here](https://youtu.be/your-demo-link)

## ✨ Features

- Task system
	- Unlimited nested subtasks.
	- Drag-and-drop reordering between levels (before, after, inside).
	- Fast inline operations: create, rename, finish, restore, delete, favorite.
	- Active-task controls: start, stop, finish, cancel, reset, transfer time.
	- Live duration preview per task and cumulative tracked duration.
- DnD behavior
	- Clear insertion rails and inside-drop highlight.
	- Out-of-bounds cancellation behavior with end-of-list snap support.
	- Stable drag overlay and placeholder-driven source rendering.
	- Expanded-state restoration for tasks collapsed during self-drag.
- History and tracking
	- Session history with timestamps and duration.
	- Activity feed for key lifecycle events.
	- Copy tracking for task ID/name copy actions.
	- Calendar sync status visibility per tracked entry.
- Settings
	- Primary color selection (default: blue).
	- Cursor and interaction preferences.
	- Calendar sync toggle controls.
	- Clear all section to reset tasks/history safely.
- Google Calendar integration (optional)
	- Works only when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is provided.
	- Dedicated unavailable state when the env key is missing.
	- Account link/unlink flow, calendar selection, event sync, and event cleanup.
- Platform and quality
	- Local persistence for tasks, sessions, history, and activity.
	- Type-safe codebase with TypeScript and runtime-safe store flows.
	- Biome lint/format workflow for consistent code style.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3005

## ⚙️ Environment

No env variables are required to run the app locally.

Optional values:

```env
# Optional: enables Google Calendar integration UI and OAuth flow
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Recommended for production metadata links and calendar event descriptions
NEXT_PUBLIC_APP_URL=https://donstop.vercel.app

# Optional: debug logs (default: false)
NEXT_PUBLIC_MALIK_DEBUG=false

# Optional: minimum tracked task session duration in seconds (default: 300)
NEXT_PUBLIC_MIN_TASK_SECONDS=300
```

## 📅 Google Calendar Setup (Optional)

1. Create or select a project in Google Cloud Console.
2. Enable Google Calendar API.
3. Configure OAuth consent screen.
4. Create an OAuth Client ID (Web application).
5. Add authorized JavaScript origin: http://localhost:3005
6. Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to `.env.local`.
7. Restart the dev server.
8. In-app, open Google Calendar integration and choose the destination calendar.

Production additions:

9. Add authorized JavaScript origin: `https://donstop.vercel.app` (or your final domain).
10. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_APP_URL` in Vercel project env vars.

### Permissions

- https://www.googleapis.com/auth/calendar.calendarlist.readonly
- https://www.googleapis.com/auth/calendar.events
- https://www.googleapis.com/auth/calendar.calendars

## ❤️ Inspiration

I've had a lot of trouble keeping up and staying motivated to do my tasks outside my programming hobby (school work, learning cybersecurity, part-time SWE job), so this is a todo app I made that logs my tasks as Google Calendar events.

Seeing my work live is extremely motivating, and it pushes me to continue in this rhythm. It also makes me realize how much time I waste on TikTok or other social media platforms, and helps me stop procrastinating.

## 🧩 Scripts

- `npm run dev` - run local dev server on port 3005.
- `npm run build` - create production build.
- `npm run start` - start production server.
- `npm run check` - TypeScript type check.
- `npm run biome` - lint with Biome.
- `npm run biome:fix` - apply Biome fixes.
