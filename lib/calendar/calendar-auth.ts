"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useCallback, useEffect, useRef, useState } from "react";
import { safeLocalStorage } from "@/lib/safe-local-storage";
import { malikDebug } from "../malik-debug";
import {
  createGoogleCalendar,
  fetchGoogleCalendars,
  fetchGoogleUserProfile,
  GOOGLE_CALENDAR_SCOPES,
  type GoogleCalendarListEntry,
  type GoogleUserProfile,
} from "./google-calendar";

const GOOGLE_TOKEN_KEY = "todo-app-google-access-token";
const TARGET_CALENDAR_KEY = "todo-app-google-calendar-id";
const TARGET_CALENDAR_NAME_KEY = "todo-app-google-calendar-name";
const DEFAULT_CALENDAR_NAME = "DonStop";
export const GOOGLE_CALENDAR_RESET_EVENT = "todo-app-google-reset";

export function clearStoredGoogleCalendarAuth() {
  if (typeof window === "undefined") {
    return;
  }

  safeLocalStorage.removeItem(GOOGLE_TOKEN_KEY);
  safeLocalStorage.removeItem(TARGET_CALENDAR_KEY);
  safeLocalStorage.removeItem(TARGET_CALENDAR_NAME_KEY);
}

export type GoogleCalendarAuthState = {
  accessToken: string;
  calendars: GoogleCalendarListEntry[];
  profile: GoogleUserProfile | null;
};

export type AuthStatus = "idle" | "loading" | "linked";

type LoginFeedbackKind = "popup_closed" | "popup_failed";

type LoginFeedback = {
  kind: LoginFeedbackKind;
  message: string;
};

function isInvalidCredentialsError(message: string) {
  return /invalid authentication credentials|unauthenticated|oauth 2 access token|401/i.test(
    message,
  );
}

export function useGoogleCalendarAuth() {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [auth, setAuth] = useState<GoogleCalendarAuthState | null>(null);
  const [targetCalendarID, setTargetCalendarID] = useState<string | null>(null);
  const [targetCalendarName, setTargetCalendarName] = useState<string | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingCalendar, setIsCreatingCalendar] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState<LoginFeedback | null>(
    null,
  );
  const loginFeedbackTimeoutRef = useRef<number | null>(null);

  const setTemporaryLoginFeedback = useCallback((feedback: LoginFeedback) => {
    setLoginFeedback(feedback);

    if (loginFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(loginFeedbackTimeoutRef.current);
    }

    loginFeedbackTimeoutRef.current = window.setTimeout(() => {
      setLoginFeedback(null);
      loginFeedbackTimeoutRef.current = null;
    }, 4500);
  }, []);

  const loadCalendars = useCallback(
    async (
      accessToken: string,
      preferredID?: string | null,
      preferredName?: string | null,
    ) => {
      setStatus("loading");
      setLoadError(null);
      malikDebug("⬜", "loading google calendars");

      try {
        const [calendars, profile] = await Promise.all([
          fetchGoogleCalendars(accessToken),
          fetchGoogleUserProfile(accessToken),
        ]);

        const desiredName = (preferredName || DEFAULT_CALENDAR_NAME).trim();
        const byPreferredName = calendars.find(
          (c) => c.summary.trim() === desiredName,
        );
        const selected =
          calendars.find((c) => c.id === preferredID) ||
          byPreferredName ||
          calendars.find((c) => c.primary) ||
          calendars[0] ||
          null;

        setAuth({ accessToken, calendars, profile });
        setTargetCalendarID(selected?.id || null);
        setTargetCalendarName(selected?.summary || null);
        setStatus("linked");
        malikDebug("✅", "google calendars loaded");
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Unable to load calendars";
        if (isInvalidCredentialsError(msg)) {
          clearStoredGoogleCalendarAuth();
          setAuth(null);
          setTargetCalendarID(null);
          setTargetCalendarName(null);
          setLoadError(
            "Google session expired. Reconnect Google Calendar to continue.",
          );
          setStatus("idle");
          malikDebug("⬜", "stale google token cleared");
          return;
        }

        setLoadError(msg);
        setStatus("idle");
        malikDebug("🟥", "calendar load failed", error);
      }
    },
    [],
  );

  const login = useGoogleLogin({
    scope: GOOGLE_CALENDAR_SCOPES,
    prompt: "consent",
    onSuccess: async (tokenResponse) => {
      setLoginFeedback(null);
      safeLocalStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
      malikDebug("✅", "google login ok");
      await loadCalendars(
        tokenResponse.access_token,
        targetCalendarID,
        targetCalendarName,
      );
    },
    onNonOAuthError: (error) => {
      setStatus("idle");

      if (error.type === "popup_closed") {
        setLoadError(null);
        setTemporaryLoginFeedback({
          kind: "popup_closed",
          message: "Login screen manually closed",
        });
        malikDebug("⬜", "google login popup closed manually");
        return;
      }

      setTemporaryLoginFeedback({
        kind: "popup_failed",
        message: "Google login popup failed",
      });
      setLoadError("Google login popup failed");
      malikDebug("🟥", "google login popup failed", error);
    },
    onError: () => {
      setLoadError("Google sign-in was cancelled");
      setStatus("idle");
      setTemporaryLoginFeedback({
        kind: "popup_closed",
        message: "Login screen manually closed",
      });
      malikDebug("🟥", "google login cancelled");
    },
  });

  useEffect(() => {
    return () => {
      if (loginFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(loginFeedbackTimeoutRef.current);
      }
    };
  }, []);

  // Restore token on mount
  useEffect(() => {
    const savedToken = safeLocalStorage.getItem(TOKEN_KEY);
    const savedCalendarID = safeLocalStorage.getItem(TARGET_CALENDAR_KEY);
    const savedCalendarName = safeLocalStorage.getItem(
      TARGET_CALENDAR_NAME_KEY,
    );

    setTargetCalendarID(savedCalendarID);
    setTargetCalendarName(savedCalendarName);

    if (!savedToken) {
      malikDebug("⬜", "google token missing");
      return;
    }

    malikDebug("⬜", "restoring google token");
    void loadCalendars(savedToken, savedCalendarID, savedCalendarName);
  }, [loadCalendars]);

  // Persist calendar selection
  useEffect(() => {
    if (!targetCalendarID) {
      safeLocalStorage.removeItem(TARGET_CALENDAR_KEY);
    } else {
      safeLocalStorage.setItem(TARGET_CALENDAR_KEY, targetCalendarID);
    }
  }, [targetCalendarID]);

  useEffect(() => {
    if (!targetCalendarName) {
      safeLocalStorage.removeItem(TARGET_CALENDAR_NAME_KEY);
      return;
    }

    safeLocalStorage.setItem(TARGET_CALENDAR_NAME_KEY, targetCalendarName);
  }, [targetCalendarName]);

  const createAndSelectCalendar = useCallback(
    async (rawName?: string) => {
      if (!auth) {
        return false;
      }

      const summary = rawName?.trim() || DEFAULT_CALENDAR_NAME;
      setCreateError(null);
      setIsCreatingCalendar(true);

      try {
        const created = await createGoogleCalendar(auth.accessToken, summary);
        await loadCalendars(auth.accessToken, created.id, created.summary);
        setCreateError(null);
        return true;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Unable to create calendar";
        setCreateError(msg);
        return false;
      } finally {
        setIsCreatingCalendar(false);
      }
    },
    [auth, loadCalendars],
  );

  const disconnect = useCallback(() => {
    setAuth(null);
    setTargetCalendarID(null);
    setTargetCalendarName(null);
    setStatus("idle");
    setLoadError(null);
    setLoginFeedback(null);
    clearStoredGoogleCalendarAuth();
    malikDebug("⬜", "google disconnected");
  }, []);

  useEffect(() => {
    const onReset = () => {
      disconnect();
    };

    window.addEventListener(GOOGLE_CALENDAR_RESET_EVENT, onReset);

    return () => {
      window.removeEventListener(GOOGLE_CALENDAR_RESET_EVENT, onReset);
    };
  }, [disconnect]);

  const selectCalendar = useCallback(
    (calendarID: string) => {
      setTargetCalendarID(calendarID);

      const selected = auth?.calendars.find(
        (calendar) => calendar.id === calendarID,
      );
      setTargetCalendarName(selected?.summary || null);
    },
    [auth],
  );

  return {
    status,
    auth,
    targetCalendarID,
    targetCalendarName,
    setTargetCalendarID: selectCalendar,
    loadError,
    createError,
    isCreatingCalendar,
    loginFeedback,
    createAndSelectCalendar,
    refreshCalendars: async () => {
      if (!auth) {
        return;
      }

      await loadCalendars(
        auth.accessToken,
        targetCalendarID,
        targetCalendarName,
      );
    },
    startLogin: () => {
      setStatus("loading");
      setLoadError(null);
      setLoginFeedback(null);
      login();
    },
    disconnect,
  };
}

const TOKEN_KEY = GOOGLE_TOKEN_KEY;
