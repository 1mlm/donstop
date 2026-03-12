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

https://github.com/user-attachments/assets/457b6fdf-ead1-41c3-9669-9ed8faa23ce8


## ❤️ Inspiration

I've had a lot of trouble keeping up and staying motivated to do my tasks outside my programming hobby (school work, learning cybersecurity, part-time SWE job), so this is a todo app I made that logs my tasks as Google Calendar events.

Seeing my work live is extremely motivating, and it pushes me to continue in this rhythm. It also makes me realize how much time I waste on TikTok or other social media platforms, and helps me stop procrastinating.

## 🤖 AI

This project was built by me, driven by my own opinions on architecture, DRY principles, file naming conventions, dev stack, UI icons, big decisions, layout, and compactness. And with the help of my custom `Github Copilot Pro (GPT-5.3)` to learn how to use AI on projects.

Copilot contributed to UI optimizations, bug fixes, unit tests, drag-and-drop logic, advanced features like Google Calendar integration, shadcn UI glitches, individual settings, low-level store and local storage management, legacy-to-new local storage task schema migration, and this README.

"Custom" means Copilot uses my previous projects as inspiration for what counts as "too many" files in a folder, lines in a file, and when refactoring is needed. This lets me keep up with every file and their relationships, so I can make high and medium-level changes myself without the need of Copilot.

## ✨ Features

- **Task System**
	- Unlimited nested subtasks with fast inline create, rename, finish, restore, delete, favorite.
	- Drag-and-drop reordering (before, after, inside) with stable overlays and placeholder rendering.
	- Live duration preview per task and cumulative tracked duration.
	- Active-task controls: start, stop, finish, cancel, reset, transfer time between tasks.
	- Minimal, mobile-friendly UI with hover-only menus and grouped submenus (Name/Time).
	- Time edit popover: shadcn popover with auto-sizing input, keyboard-friendly, supports hh:mm:ss, mm:ss, ss.

- **Drag & Drop**
	- Clear insertion rails, inside-drop highlight, and out-of-bounds cancellation with end-of-list snap.
	- No setState-in-render errors: all DnD state updates are deferred for React 19 safety.
	- Expanded/collapsed state restoration for tasks during drag.

- **History & Activity**
	- Full session history with timestamps, durations, and activity feed for all key events.
	- Rich activity kinds: task finish, transfer, reposition, Google Calendar connect/disconnect/enable/disable/target change, settings changes, copy actions.
	- Dedicated icons and labels for each activity type.
	- Runtime logging for calendar and settings actions.

- **Settings**
	- Primary color selection (default: blue).
	- Cursor and interaction preferences.
	- Calendar sync toggle controls.
	- Clear all: safely reset tasks/history.

- **Google Calendar Integration (optional)**
	- Only enabled with `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
	- Dedicated unavailable state if env key missing.
	- Account link/unlink, calendar selection, event sync, and event cleanup.
	- Event manager: select, multi-select, and delete events with dynamic button text ("No event selected" when none).
	- Dedupe: prevents duplicate event creation on finish.

- **Platform & Quality**
	- Local persistence for tasks, sessions, history, and activity.
	- Type-safe codebase (TypeScript) and runtime-safe store flows.
	- Biome lint/format workflow for consistent code style.
	- Node.js test suite (node:test) for calendar sync, session transfer/reset, move planning, and lifecycle utilities (30+ tests).
	- All code is mobile-first and responsive.

- **Other**
	- All destructive actions (delete, reset, event delete) use hourglass loading and confirmation dialogs.
	- Copy/edit actions are hover-only for consistency.
	- All menus use element-first grouping and are accessible by keyboard.
	- All error and edge cases (drag out of bounds, slot composition, etc.) are handled and tested.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3005

## ⚙️ Environment

**No env variables are required** to run the app locally, but optionally, you can add: 

```env
# Optional: enables Google Calendar integration UI and OAuth flow
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Recommended for production metadata links and calendar event descriptions
NEXT_PUBLIC_APP_URL=https://donstop.vercel.app

# Optional: debug logs (default: false)
NEXT_PUBLIC_MALIK_DEBUG=false
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

## 🧩 Scripts

- `npm run dev` - run local dev server on port 3005.
- `npm run build` - create production build.
- `npm run start` - start production server.
- `npm run check` - TypeScript type check.
- `npm run biome` - lint with Biome.
- `npm run biome:fix` - apply Biome fixes.
