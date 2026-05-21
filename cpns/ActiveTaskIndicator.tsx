"use client";

import { useEffect } from "react";
import { useTODOStore } from "@/lib/store";

let cachedIconImg: HTMLImageElement | null = null;

function loadIconImg(): Promise<HTMLImageElement> {
  if (cachedIconImg) return Promise.resolve(cachedIconImg);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      cachedIconImg = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = "/icon.png";
  });
}

function makeRedFaviconUrl(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, 32, 32);
  // Tint all opaque pixels red, preserving transparency
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(0, 0, 32, 32);
  return canvas.toDataURL();
}

async function setFavicon(active: boolean) {
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
  try {
    const img = await loadIconImg();
    link.href = makeRedFaviconUrl(img);
  } catch {
    // fallback green square if icon.png fails
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#ef4444"/></svg>`;
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
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
