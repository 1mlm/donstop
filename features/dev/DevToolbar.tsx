"use client";

import {
  Bug01Icon,
  Cancel01Icon,
  CleanIcon,
  Copy01Icon,
  DatabaseIcon,
  FlipHorizontalIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Icon } from "@/features/Icon";
import { useTODOStore } from "@/lib/store";
import { Button } from "@/shadcn/ui/button";

function DevStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}

export default function DevToolbar() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const tasks = useTODOStore((s) => s.tasks);
  const history = useTODOStore((s) => s.history);
  const activity = useTODOStore((s) => s.activity);
  const activeSession = useTODOStore((s) => s.activeSession);
  const populateFakeData = useTODOStore((s) => s.populateFakeData);
  const resetAllData = useTODOStore((s) => s.resetAllData);
  const createTask = useTODOStore((s) => s.createTask);

  const canPopulate = tasks.length === 0 && history.length === 0;

  function handleCopyStore() {
    const snapshot = { tasks, history, activeSession, activity };
    navigator.clipboard
      .writeText(JSON.stringify(snapshot, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
  }

  function handleAddQuickTasks() {
    const labels = ["Quick task A", "Quick task B", "Quick task C"];
    for (const label of labels) {
      createTask(label);
    }
  }

  function handleResetAll() {
    if (
      window.confirm(
        "Reset ALL data? This clears tasks, history, and activity.",
      )
    ) {
      resetAllData();
    }
  }

  return (
    <div className="fixed bottom-6 right-0 z-[9999] flex items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.15 }}
            className="mr-1 mb-1 w-56 rounded-xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur-sm"
          >
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Dev Tools
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close dev tools"
              >
                <Icon icon={Cancel01Icon} className="size-3.5" />
              </button>
            </div>

            <div className="mb-3 space-y-1 rounded-lg bg-muted/40 px-2.5 py-2">
              <DevStat label="Tasks" value={tasks.length} />
              <DevStat label="History" value={history.length} />
              <DevStat label="Active" value={activeSession ? "yes" : "no"} />
            </div>

            <div className="space-y-1.5">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                disabled={!canPopulate}
                onClick={() => populateFakeData()}
              >
                <Icon icon={DatabaseIcon} className="size-3.5" />
                Populate fake data
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                onClick={handleAddQuickTasks}
              >
                <Icon icon={Task01Icon} className="size-3.5" />
                Add 3 quick tasks
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                onClick={() =>
                  window.dispatchEvent(new Event("show-welcome-tour"))
                }
              >
                <Icon icon={FlipHorizontalIcon} className="size-3.5" />
                Show tour
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                onClick={handleCopyStore}
              >
                <Icon icon={Copy01Icon} className="size-3.5" />
                {copied ? "Copied!" : "Copy store JSON"}
              </Button>

              <Button
                size="sm"
                variant="destructive"
                className="w-full justify-start gap-2 text-xs"
                onClick={handleResetAll}
              >
                <Icon icon={CleanIcon} className="size-3.5" />
                Reset all data
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Dev tools"
        className={`flex h-8 items-center gap-1.5 rounded-l-lg border border-r-0 px-2.5 text-xs font-medium transition-colors ${
          open
            ? "border-primary/50 bg-primary text-primary-foreground"
            : "border-border/60 bg-card/90 text-muted-foreground hover:text-foreground"
        } shadow-md backdrop-blur-sm`}
      >
        <Icon icon={Bug01Icon} className="size-3.5" />
        <span>Dev</span>
      </button>
    </div>
  );
}
