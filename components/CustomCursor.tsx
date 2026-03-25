"use client";

import { useEffect } from "react";

export default function CustomCursor() {
  useEffect(() => {
    const cls = "custom-cursor-enabled";
    document.body.classList.add(cls);
    return () => document.body.classList.remove(cls);
  }, []);
  return null;
}
