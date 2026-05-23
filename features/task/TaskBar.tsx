import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { useCallback, useMemo, useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useShallow } from "zustand/shallow";
import { useTODOStore } from "@/lib/store";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { Bar } from "../Bar";
import { Icon } from "../Icon";
import TaskList from "./TaskList";

export default function TaskBar() {
  const rootTaskIDs = useTODOStore(
    useShallow((state) => state.getRootTaskIDs()),
  );
  const createTask = useTODOStore((state) => state.createTask);
  const allTasks = useTODOStore((state) => state.tasks);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const canSubmitNewTask = newTaskLabel.trim().length > 0;
  const { trigger: triggerHaptic } = useWebHaptics();

  const groupedRootTaskIDs = useMemo(() => {
    const now = new Date();
    const nowMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const taskMap = new Map(allTasks.map((t) => [t.id, t]));
    const ORDER = [
      "Today",
      "Yesterday",
      "2 days ago",
      "3 days ago",
      "4 days ago",
      "5 days ago",
      "6 days ago",
      "Last week",
      "__never__",
    ];
    const groups = new Map<string, typeof rootTaskIDs>();

    function getGroupKey(lastActivatedAt: string | undefined): string {
      if (!lastActivatedAt) return "__never__";
      const d = new Date(lastActivatedAt);
      const dMidnight = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
      ).getTime();
      const diffDays = Math.round((nowMidnight - dMidnight) / 86400000);
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return "Last week";
    }

    for (const id of rootTaskIDs) {
      const key = getGroupKey(taskMap.get(id)?.lastActivatedAt);
      const bucket = groups.get(key) ?? [];
      bucket.push(id);
      groups.set(key, bucket);
    }

    return ORDER.filter((k) => groups.has(k)).map((k) => ({
      label: k === "__never__" ? "Never started" : k,
      ids: groups.get(k) ?? [],
    }));
  }, [rootTaskIDs, allTasks]);

  const submitNewTask = useCallback(() => {
    const label = newTaskLabel.trim();
    if (!label) return;
    createTask(label);
    triggerHaptic("Light");
    setNewTaskLabel("");
  }, [createTask, newTaskLabel, triggerHaptic]);

  return (
    <Bar className="p-3 overflow-y-auto gap-1">
      <div className="mb-1">
        <InputGroup className="h-9 rounded-2xl squircle squircle-2xl border-dashed border-border/75 bg-muted/18 transition-colors focus-within:border-primary/50 focus-within:bg-background/70">
          <InputGroupAddon
            align="inline-start"
            className="pl-1.5 pr-1 [&>button]:ml-0"
          >
            <InputGroupButton
              size="icon-sm"
              aria-label="Create task"
              onClick={submitNewTask}
              className="size-7 rounded-full text-muted-foreground hover:text-foreground"
            >
              <Icon icon={PlusSignIcon} className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>

          <InputGroupInput
            value={newTaskLabel}
            onChange={(event) => setNewTaskLabel(event.target.value)}
            onClick={() => { if (canSubmitNewTask) submitNewTask(); }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitNewTask();
              }
            }}
            placeholder="Create a task..."
            className="text-sm pl-1.5"
          />
        </InputGroup>
      </div>

      {groupedRootTaskIDs.length > 1 ? (
        groupedRootTaskIDs.map((group) => (
          <div key={group.label}>
            <p className="select-none px-2 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/45">
              {group.label}
            </p>
            <TaskList taskIDs={group.ids} />
          </div>
        ))
      ) : (
        <TaskList taskIDs={rootTaskIDs} />
      )}

      {rootTaskIDs.length === 0 ? (
        <p className="px-2 pt-2 text-xs text-muted-foreground/50 select-none">
          No tasks yet — type above and press Enter.
        </p>
      ) : null}
    </Bar>
  );
}
