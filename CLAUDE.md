# DonStop — CLAUDE.md

## What this app is

Task timer for ADHD focus. Start/stop tasks, track time, finish when done. Google Calendar sync optional. The UX goal: **zero friction to start working**.

## Tech stack

- Next.js 16 (app router, port 3005) + React 19 + TypeScript
- Zustand 5 (persist → localStorage key `"todo-app-store"`)
- @dnd-kit for drag-and-drop
- shadcn/ui + Tailwind CSS 4
- Hugeicons (`@hugeicons/core-free-icons`)
- Framer Motion (`motion/react`)
- Biome for lint + format

## Key file map

| What | Where |
|------|-------|
| Task row UI + controls | `cpns/task/Task.tsx` |
| Task actions menu (More button portal) | `cpns/task/task.components.tsx` |
| Drag-and-drop root | `cpns/task/TaskBar.tsx` |
| All store actions (create/start/stop/finish/delete) | `lib/store/store-create.ts` |
| Task move/reorder logic | `lib/store/store-move.ts` |
| Store types | `lib/store/store-model.ts` |
| Active task favicon + tab title | `components/ActiveTaskIndicator.tsx` |
| History/activity log UI | `cpns/history/HistoryMenu.tsx` |
| Settings | `cpns/settings/` |
| Google Calendar | `cpns/calendar/` + `lib/calendar/` |

## Dev commands

```bash
npm run dev      # starts on port 3005
npx tsc --noEmit # type-check
npx biome check  # lint
npx biome format --write  # format
```

## UX decisions (don't revert without reason)

- **More button is click-only** — no hover-open. Was 500ms hover-delay, removed because it triggered accidentally.
- **Click-outside closes More menu** — document `pointerdown` capture listener + ESC key.
- **Quick Finish button** on task row (PartyIcon) — avoids More → Finish for the most common action.
- **Finished tasks** show inline Restore + Delete on hover (already existed, keep it).
- **Active task = red favicon + "⏱ TaskName · DonStop" tab title** — lightweight tray-icon alternative (web app can't do native tray).

## Task lifecycle

```
createTask → startTask → stopActiveTask (pause) → finishActiveTask (done)
                       → cancelActiveTask (discard time)
                       → finishTask (finish without stopping first — quick button path)
```

Sessions < 5 min are not saved to history.

## Drag & drop

3 drop zones per task: `before` / `after` / `inside`. IDs encoded as `task-{id}-{placement}`. Move logic in `store-move.ts`. Custom collision detection in `TaskBar.tsx:boundedCollisionDetection`.

## Store persistence

Zustand `persist()` → localStorage `"todo-app-store"`. Deleted tasks go to `deletedTasks[]`. History entries in `history[]`. Activity log in `activity[]`.

## UI testing / screenshots

**Playwright MCP** configured in `.mcp.json` → `mcp__playwright__*` tools available in Claude Code sessions (navigate, click, screenshot, console errors).

**Quick screenshot script** (no MCP needed):
```bash
node scripts/screenshot.mjs [url] [output]
# default: http://localhost:3005 → screenshot.png
```
Requires dev server running. Uses `playwright` npm package directly.

**Chromium install** (one-time): `npx playwright install chromium --with-deps`

Workflow for UI changes: start dev server → use MCP browser tools to navigate/interact → take screenshot → check console errors → report issues before marking task done.

## This is a web app

No Electron/Tauri. Native system tray icon is not possible. Use `ActiveTaskIndicator` for browser-level feedback instead.
