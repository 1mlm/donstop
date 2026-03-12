import { ChevronDown, MoreIcon, Play } from "@hugeicons/core-free-icons";
import { formatPreviewTime } from "@/lib/util";
import { Icon } from "../Icon";

export function TaskDragOverlayCard({
  label,
  storedSeconds,
  childrenCount,
  isInvalidDrop = false,
}: {
  label: string;
  storedSeconds: number;
  childrenCount: number;
  isInvalidDrop?: boolean;
}) {
  return (
    <div
      className={`pointer-events-none min-w-56 rounded-2xl squircle squircle-2xl px-2 py-0.5 pr-2.5 backdrop-blur-[1px] transition-colors duration-100 ${
        isInvalidDrop
          ? "border border-destructive/70 bg-destructive/20 text-destructive"
          : "border border-white/70 bg-primary/92 text-primary-foreground"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex shrink-0 items-center gap-0.5 opacity-85">
          <span className="rounded squircle squircle-lg p-1">
            <Icon icon={MoreIcon} className="size-4" />
          </span>
          <span className="rounded squircle squircle-lg p-1">
            <Icon icon={Play} className="size-4" />
          </span>
        </div>

        <span className="min-w-0 flex-1 truncate pl-0.5 text-left text-sm font-medium">
          {label}
          <span
            className={`pl-1 text-xs ${
              isInvalidDrop
                ? "text-destructive/75"
                : "text-primary-foreground/60"
            }`}
          >
            {formatPreviewTime(storedSeconds)}
          </span>
        </span>

        {childrenCount > 0 ? (
          <span className="shrink-0 rounded squircle squircle-lg p-1 opacity-90">
            <Icon icon={ChevronDown} className="size-4 scale-125" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
