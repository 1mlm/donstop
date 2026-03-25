"use client";
import {
  ArrowRight02Icon,
  Calendar01Icon,
  Clock01Icon,
  Forward02Icon,
  ListTreeIcon,
  SurpriseIcon,
  WavingHand01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { safeLocalStorage } from "@/lib/safe-local-storage";
import CuteVideoPlayer from "./CuteVideoPlayer";
import { Icon } from "./Icon";

const STORAGE_KEY = "welcomeTourSkipped";

const steps = [
  {
    title: "Welcome",
    body: `A powerful task manager made to be minimal and help you get things done. Let's take a quick tour!`,
    icon: WavingHand01Icon,
  },
  {
    title: "Tasks & Subtasks",
    body: `Create tasks (i.e Physics Group Project), and create sub-tasks nested inside of them (i.e Start the presentation draft)`,
    icon: ListTreeIcon,
  },
  {
    title: "Time tracking",
    body: `You want to see how much time you spent working on a specific task? You can Start & stop chronometers on tasks.`,
    icon: Clock01Icon,
  },
  {
    title: "Google Calendar",
    body: `You can optionally synchronize your Google Calendar account so you can see what time you spent on what directly into your calendar.`,
    icon: Calendar01Icon,
  },
] as const;

export default function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [animState, setAnimState] = useState<"idle" | "enter" | "exit">("idle");

  useEffect(() => {
    const skipped = safeLocalStorage.getItem(STORAGE_KEY);
    if (!skipped) setOpen(true);
  }, []);

  useEffect(() => {
    const handler = () => {
      // reopen tour and clear skip flag so it shows
      safeLocalStorage.removeItem(STORAGE_KEY);
      setOpen(true);
    };
    window.addEventListener("show-welcome-tour", handler as EventListener);
    return () =>
      window.removeEventListener("show-welcome-tour", handler as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    setAnimState("enter");
    const t = window.setTimeout(() => setAnimState("idle"), 300);
    return () => window.clearTimeout(t);
  }, [open]);

  const closeWithAnim = (skip = false) => {
    setAnimState("exit");
    setTimeout(() => {
      if (skip) safeLocalStorage.setItem(STORAGE_KEY, "1");
      setOpen(false);
      setAnimState("idle");
    }, 300);
  };

  const close = (skip = false) => closeWithAnim(skip);

  if (!open) return null;

  const hiddenClass = "opacity-0 translate-y-3 scale-95";
  const visibleClass = "opacity-100 translate-y-0 scale-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />

      <div
        className={`relative z-10 mx-auto w-full max-w-4xl rounded-2xl bg-popover p-4 shadow-lg md:flex md:gap-4 max-h-[90vh] overflow-hidden transform transition-all duration-300 ${
          animState === "idle" ? visibleClass : hiddenClass
        }`}
        style={{ overflow: "hidden" }}
      >
        <div className="md:w-1/3 w-full md:flex-shrink-0 flex items-center">
          <div className="w-full">
            <div className="hidden md:block">
              <CuteVideoPlayer src="/demo.mp4" />
            </div>
            <div className="block md:hidden mb-3">
              <CuteVideoPlayer src="/demo.mp4" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-2 overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/90 p-2 text-white">
              <Icon icon={steps[idx].icon} />
            </div>
            <h3 className="text-lg font-semibold">{steps[idx].title}</h3>
          </div>

          <div className="relative w-full overflow-hidden">
            <div
              className="flex transition-transform duration-300"
              style={{ transform: `translateX(-${idx * 100}%)` }}
            >
              {steps.map((s, i) => (
                <div key={i} className="w-full flex-shrink-0">
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === idx ? "w-10 bg-primary scale-105" : "w-6 bg-border/60"}`}
                  aria-label={`page-${i}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => close(true)}
                className="rounded-md bg-muted px-3 py-1 text-sm text-foreground flex items-center gap-2 transition-transform hover:scale-105"
              >
                <Icon icon={Forward02Icon} />
                <span>Skip All</span>
              </button>

              {idx < steps.length - 1 ? (
                <button
                  onClick={() => setIdx((s) => s + 1)}
                  className="rounded-md bg-primary px-3 py-1 text-sm text-white flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <span>Next</span>
                  <Icon icon={ArrowRight02Icon} />
                </button>
              ) : (
                <button
                  onClick={() => close(true)}
                  className="rounded-md bg-primary px-4 py-2 text-sm text-white flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <Icon icon={SurpriseIcon} />
                  <span>Start Discovering</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
