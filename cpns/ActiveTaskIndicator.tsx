"use client";

import { useEffect } from "react";
import { useTODOStore } from "@/lib/store";

const SIZE = 32;
const RADIUS = 7;
const PAD = 3;

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

function makeFaviconUrl(img: HTMLImageElement, active: boolean): string {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Rounded square background
  ctx.beginPath();
  ctx.roundRect(0, 0, SIZE, SIZE, RADIUS);
  ctx.fillStyle = active ? "#ef4444" : "#ffffff";
  ctx.fill();

  // Icon centered with padding
  ctx.drawImage(img, PAD, PAD, SIZE - PAD * 2, SIZE - PAD * 2);

  // Active: tint icon white so it reads on the red bg
  if (active) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(PAD, PAD, SIZE - PAD * 2, SIZE - PAD * 2);
  }

  return canvas.toDataURL();
}

async function setFavicon(active: boolean) {
  let link = document.querySelector<HTMLLinkElement>("link#dynamic-favicon");
  if (!link) {
    link = document.createElement("link");
    link.id = "dynamic-favicon";
    link.rel = "icon";
    document.head.appendChild(link);
  }
  try {
    const img = await loadIconImg();
    link.href = makeFaviconUrl(img, active);
  } catch {
    const bg = active ? "#ef4444" : "#ffffff";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${bg}"/></svg>`;
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
