# DonStop

Compact task timer with nested tasks, local persistence, history, and optional Google Calendar sync.

## Quick Setup

```bash
npm install
npm run dev
```

App URL: http://localhost:3005

## Google Calendar Quick Setup

1. In Google Cloud Console, create/select a project.
2. Enable Google Calendar API.
3. Configure OAuth consent screen.
4. Create OAuth Client ID (Web application).
5. Add Authorized JavaScript origin: http://localhost:3005
6. Put the client ID in env:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_MALIK_DEBUG=false
NEXT_PUBLIC_MIN_TASK_SECONDS=300
```

7. Restart dev server.
8. In app, click Integrate Google Calendar and pick or create the target calendar.

## Calendar Permissions Used

- https://www.googleapis.com/auth/calendar.calendarlist.readonly
- https://www.googleapis.com/auth/calendar.events
- https://www.googleapis.com/auth/calendar.calendars

Google does not provide write-only event scope. The app behavior is write-focused: it creates events only in the selected calendar.
