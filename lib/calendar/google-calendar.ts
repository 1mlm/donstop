import { malikDebug } from "../malik-debug";
import type { TaskHistoryEntry } from "../types";

export const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendars",
].join(" ");

export type GoogleUserProfile = {
  name: string;
  email: string;
  picture?: string;
};

export async function fetchGoogleUserProfile(
  accessToken: string,
): Promise<GoogleUserProfile | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      name?: string;
      email?: string;
      picture?: string;
    };

    if (!data.name || !data.email) {
      return null;
    }

    return { name: data.name, email: data.email, picture: data.picture };
  } catch {
    return null;
  }
}

export type GoogleCalendarListEntry = {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
};

type GoogleCalendarEventResponse = {
  id: string;
};

export type GoogleCalendarEventItem = {
  id: string;
  summary?: string;
  status?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
};

type GoogleCalendarEventsResponse = {
  items?: GoogleCalendarEventItem[];
  nextPageToken?: string;
};

type GoogleCalendarListResponse = {
  items?: GoogleCalendarListEntry[];
};

type GoogleCalendarCreateResponse = {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
};

const WEBSITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";

async function parseGoogleError(response: Response) {
  const fallbackMessage = `Google request failed with ${response.status}`;

  try {
    const json = (await response.json()) as {
      error?: { message?: string };
    };

    const message = json.error?.message || fallbackMessage;

    if (/insufficient|scope/i.test(message)) {
      return `${message} Disconnect and reconnect to grant the new calendar permission.`;
    }

    return message;
  } catch {
    return fallbackMessage;
  }
}

export async function fetchGoogleCalendars(accessToken: string) {
  malikDebug("⬜", "api google calendars request");

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    malikDebug("🟥", "api google calendars error", { status: response.status });
    throw new Error(await parseGoogleError(response));
  }

  const data = (await response.json()) as GoogleCalendarListResponse;

  const calendars = (data.items || []).sort((left, right) => {
    if (left.primary) return -1;
    if (right.primary) return 1;
    return left.summary.localeCompare(right.summary);
  });

  if (calendars.length === 0) {
    malikDebug("⬜", "api google calendars empty");
  } else {
    malikDebug("✅", "api google calendars found", { count: calendars.length });
  }

  return calendars;
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  session: TaskHistoryEntry,
) {
  malikDebug("⬜", "api google event create", {
    task: session.taskLabel,
    calendarId,
  });

  const encodedCalendarID = encodeURIComponent(calendarId);
  const postedAt = new Date().toISOString();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarID}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `${session.taskLabel} (DonStop)`,
        description: [
          `Event ID: ${session.id}`,
          `Website: ${WEBSITE_URL}`,
          `Posted at: ${postedAt}`,
          `Tracked duration: ${session.durationSeconds} seconds`,
        ].join("\n"),
        start: {
          dateTime: session.startedAt,
        },
        end: {
          dateTime: session.endedAt,
        },
      }),
    },
  );

  if (!response.ok) {
    malikDebug("🟥", "api google event error", { status: response.status });
    throw new Error(await parseGoogleError(response));
  }

  const event = (await response.json()) as GoogleCalendarEventResponse;
  malikDebug("✅", "api google event created", { eventId: event.id });

  return event;
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
) {
  const encodedCalendarID = encodeURIComponent(calendarId);
  const allEvents: GoogleCalendarEventItem[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      maxResults: "2500",
      showDeleted: "false",
      singleEvents: "true",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarID}/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(await parseGoogleError(response));
    }

    const data = (await response.json()) as GoogleCalendarEventsResponse;
    allEvents.push(...(data.items || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allEvents;
}

export async function createGoogleCalendar(
  accessToken: string,
  summary: string,
) {
  const cleanName = summary.trim() || "DonStop";
  malikDebug("⬜", "api calendar create", { summary: cleanName });

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: cleanName,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    },
  );

  if (!response.ok) {
    malikDebug("🟥", "api calendar create error", { status: response.status });
    throw new Error(await parseGoogleError(response));
  }

  const created = (await response.json()) as GoogleCalendarCreateResponse;
  malikDebug("✅", "api calendar created", { id: created.id });

  return created;
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
) {
  const encodedCalendarID = encodeURIComponent(calendarId);
  const encodedEventID = encodeURIComponent(eventId);

  malikDebug("⬜", "api calendar event delete", {
    calendarId,
    eventId,
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarID}/events/${encodedEventID}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    malikDebug("🟥", "api calendar event delete error", {
      status: response.status,
    });
    throw new Error(await parseGoogleError(response));
  }

  malikDebug("✅", "api calendar event deleted", { eventId });
}
