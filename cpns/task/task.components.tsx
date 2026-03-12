import {
  ArrowDataTransferDiagonalIcon,
  ArrowRight01Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  FavouriteIcon,
  HeartbreakIcon,
  IdIcon,
  PartyIcon,
  TextIcon,
  Undo03Icon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
import { createPortal } from "react-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { type HugeIcon, Icon } from "../Icon";

export function DropGapIndicator({
  setNodeRef,
  isActive,
  position,
}: {
  setNodeRef: (node: HTMLDivElement | null) => void;
  isActive: boolean;
  position: "top" | "bottom";
}) {
  const containerPositionClass =
    position === "top" ? "-top-3.5" : "-bottom-3.5";

  return (
    <div
      ref={setNodeRef}
      className={`pointer-events-none absolute inset-x-0 ${containerPositionClass} z-20 h-7`}
    >
      <div
        className={`absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-full bg-primary transition-all duration-150 ease-out ${
          isActive ? "h-2.5 opacity-100" : "h-px scale-x-75 opacity-0"
        }`}
      />
    </div>
  );
}

export function TaskDragPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`w-full rounded-2xl squircle squircle-2xl border border-dashed border-foreground/30 bg-muted/30 ${
        compact ? "min-h-4" : "min-h-6"
      }`}
    />
  );
}

export function MenuRow({
  icon,
  iconClass,
  label,
  onClick,
  className,
  disabled,
}: {
  icon: HugeIcon;
  iconClass?: string;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-xl px-1.5 py-1 text-sm font-normal transition-colors hover:bg-primary/15 disabled:opacity-50 disabled:cursor-not-allowed ${className || ""}`}
    >
      <Icon icon={icon} className={`size-4 ${iconClass || ""}`} />
      <span className="font-semibold">{label}</span>
    </button>
  );
}

type TaskActionsMenuProps = {
  open: boolean;
  position: { left: number; top: number } | null;
  taskID: string;
  isActive: boolean;
  activeTaskID?: string;
  isFavorite: boolean;
  copyMenuOpen: boolean;
  onMouseEnterMenu: () => void;
  onMouseLeaveMenu: () => void;
  onMouseEnterCopy: () => void;
  onMouseLeaveCopy: () => void;
  onToggleCopy: () => void;
  onStartEdit: () => void;
  onTransfer: () => void;
  onFinishActive: () => void;
  onResetActiveDuration: () => void;
  onCancelActive: () => void;
  onFinishTask: () => void;
  onResetTaskDuration: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onCopyID: () => void;
  onCopyName: () => void;
};

export function TaskActionsMenu({
  open,
  position,
  taskID,
  isActive,
  activeTaskID,
  isFavorite,
  copyMenuOpen,
  onMouseEnterMenu,
  onMouseLeaveMenu,
  onMouseEnterCopy,
  onMouseLeaveCopy,
  onToggleCopy,
  onStartEdit,
  onTransfer,
  onFinishActive,
  onResetActiveDuration,
  onCancelActive,
  onFinishTask,
  onResetTaskDuration,
  onToggleFavorite,
  onDelete,
  onCopyID,
  onCopyName,
}: TaskActionsMenuProps) {
  if (!open || !position) {
    return null;
  }

  return createPortal(
    <TooltipProvider>
      <div
        className="fixed z-[9999] w-36 rounded-2xl border bg-popover/92 p-1 text-popover-foreground shadow-lg backdrop-blur-sm ring-1 ring-foreground/12 font-normal"
        style={{
          left: `${position.left}px`,
          top: `${position.top}px`,
        }}
        onMouseEnter={onMouseEnterMenu}
        onMouseLeave={onMouseLeaveMenu}
      >
        <div className="flex flex-col gap-0.5">
          {isActive ? (
            <>
              <MenuRow icon={Edit02Icon} label="Edit" onClick={onStartEdit} />
              <MenuRow icon={PartyIcon} label="Finish" onClick={onFinishActive} />
              <MenuRow
                icon={UndoIcon}
                label="Reset duration"
                onClick={onResetActiveDuration}
              />
              <MenuRow icon={Undo03Icon} label="Cancel" onClick={onCancelActive} />
            </>
          ) : (
            <>
              <MenuRow icon={Edit02Icon} label="Edit" onClick={onStartEdit} />
              {activeTaskID && activeTaskID !== taskID ? (
                <MenuRow
                  icon={ArrowDataTransferDiagonalIcon}
                  label="Transfer"
                  onClick={onTransfer}
                />
              ) : null}
              <MenuRow icon={PartyIcon} label="Finish" onClick={onFinishTask} />
              <MenuRow
                icon={UndoIcon}
                label="Reset duration"
                onClick={onResetTaskDuration}
              />
            </>
          )}

          <div className="mx-1 my-0.5 border-t border-border/60" />

          <div
            className="relative"
            onMouseEnter={onMouseEnterCopy}
            onMouseLeave={onMouseLeaveCopy}
          >
            <button
              className="inline-flex w-full items-center gap-1 rounded-xl px-1.5 py-1 text-sm font-normal transition-colors hover:bg-primary/15"
              onClick={onToggleCopy}
            >
              <Icon icon={Copy01Icon} className="size-4" />
              <span className="font-semibold">Copy</span>
              <Icon icon={ArrowRight01Icon} className="ml-auto size-4" />
            </button>

            <div
              className={`absolute left-full top-0.5 z-[10000] ml-2 w-28 overflow-hidden rounded-2xl border bg-popover/92 p-1 text-popover-foreground shadow-lg backdrop-blur-sm ring-1 ring-foreground/12 transition-all ${
                copyMenuOpen
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="flex flex-col gap-1">
                <MenuRow icon={IdIcon} label="ID" onClick={onCopyID} />
                <MenuRow icon={TextIcon} label="Name" onClick={onCopyName} />
              </div>
            </div>
          </div>

          <MenuRow
            icon={isFavorite ? HeartbreakIcon : FavouriteIcon}
            label={isFavorite ? "Un-Favorite" : "Favorite"}
            onClick={onToggleFavorite}
          />

          <div className="mx-1 my-0.5 border-t border-border/60" />

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <MenuRow
                  icon={Delete02Icon}
                  label="Delete"
                  onClick={onDelete}
                  className="text-destructive hover:bg-destructive/15 w-full"
                  disabled={isActive}
                />
              </div>
            </TooltipTrigger>
            {isActive ? (
              <TooltipContent side="left" className="max-w-48 text-xs">
                Can't delete a currently active task
              </TooltipContent>
            ) : null}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>,
    document.body,
  );
}
