import { Delete01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/cpns/Icon";
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
  const restoreDeletedTask = useTODOStore((s) => s.restoreDeletedTask);
  const clearTrash = useTODOStore((s) => s.clearTrash);
  const hasDeleted = deletedTasks.length > 0;
  const cleanTrash = clearTrash;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full squircle squircle-full px-3"
          aria-label="Trash"
          disabled={!hasDeleted}
        >
          <Icon icon={Delete01Icon} />
          {hasDeleted ? "Trash" : "Empty Trash"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-md w-80">
        <PopoverHeader>
          <PopoverTitle>Deleted Tasks</PopoverTitle>
        </PopoverHeader>
        {hasDeleted ? (
          <>
            <Button
              size="sm"
              variant="destructive"
              className="mb-2 w-full"
              onClick={cleanTrash}
            >
              Clean Trash
            </Button>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {deletedTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-2 border-b pb-2 last:border-b-0"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate max-w-xs">{task.label}</span>
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
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="text-muted-foreground py-4 text-center">
            No deleted tasks.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
