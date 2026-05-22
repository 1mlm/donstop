"use client";

import { useEffect } from "react";
import { useTODOStore } from "@/lib/store";

export function ActiveTaskIndicator() {
  const activeTaskLabel = useTODOStore((state) => {
    const id = state.activeSession?.taskId;
    if (!id) return null;
    return state.getTaskFromID(id)?.label ?? null;
  });

  useEffect(() => {
    const isActive = activeTaskLabel !== null;
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;
    document.title = isActive
      ? `⏱ ${activeTaskLabel}${isPWA ? "" : " · DonStop"}`
      : "DonStop";
    if ("setAppBadge" in navigator) {
      if (isActive) {
        navigator.setAppBadge(1).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  }, [activeTaskLabel]);

  return null;
}
