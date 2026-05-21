"use client";

import { useEffect } from "react";
import { useTODOStore } from "@/lib/store";

function makeActiveFaviconDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#22c55e"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function setFavicon(active: boolean) {
  let link = document.querySelector<HTMLLinkElement>("link#dynamic-favicon");
  if (!active) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.id = "dynamic-favicon";
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = makeActiveFaviconDataUrl();
}

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
    setFavicon(isActive);
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
