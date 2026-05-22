import { Delete01Icon, Undo03Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { Icon } from "@/features/Icon";
import { useTODOStore } from "@/lib/store";
import { formatRelativeTime } from "@/lib/util";
import { Button } from "@/shadcn/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shadcn/ui/popover";

export default function TrashButton() {
  const deletedTasks = useTODOStore((s) => s.deletedTasks);
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [open]);
  const restoreDeletedTask = useTODOStore((s) => s.restoreDeletedTask);
  const clearTrash = useTODOStore((s) => s.clearTrash);
  const hasDeleted = deletedTasks.length > 0;

  if (!hasDeleted) {
    return (
      <span className="inline-flex cursor-not-allowed-custom">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full squircle squircle-full px-3 opacity-50 hover:bg-transparent"
          aria-label="Trash"
          disabled
        >
          <Icon icon={Delete01Icon} />
          Trash
        </Button>
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="inline-flex cursor-pointer-custom">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full squircle squircle-full px-3"
            aria-label="Trash"
          >
            <Icon icon={Delete01Icon} />
            Trash ({deletedTasks.length})
          </Button>
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-w-md">
        <PopoverHeader>
          <PopoverTitle>Deleted Tasks</PopoverTitle>
        </PopoverHeader>
        <Button
          size="sm"
          variant="destructive"
          className="mb-2 w-full"
          onClick={clearTrash}
        >
          <Icon icon={Delete01Icon} />
          Empty Trash
        </Button>
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {deletedTasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-2 border-b pb-2 last:border-b-0"
            >
              <div className="flex min-w-0 flex-col">
                <span className="max-w-xs truncate">{task.label}</span>
                {task.deletedAt && (
                  <span className="text-xs text-muted-foreground">
                    Deleted {formatRelativeTime(task.deletedAt)}
                  </span>
                )}
              </div>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => restoreDeletedTask(task.id)}
              >
                <Icon icon={Undo03Icon} />
                Restore
              </Button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
