"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { PropsWithChildren } from "react";

export const GOOGLE_CALENDAR_CLIENT_ID_ENV_KEY = "NEXT_PUBLIC_GOOGLE_CLIENT_ID";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function isGoogleCalendarConfigured() {
  return Boolean(GOOGLE_CLIENT_ID);
}

export function GoogleCalendarProvider({ children }: PropsWithChildren) {
  if (!GOOGLE_CLIENT_ID) {
    return children;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
