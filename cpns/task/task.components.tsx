import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { type HugeIcon, Icon } from "../Icon";

// ─── Drop zone indicators ────────────────────────────────────────────────────

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

export function TaskDragPlaceholder({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className={`w-full rounded-2xl squircle squircle-2xl border border-dashed border-foreground/30 bg-muted/30 ${
        compact ? "min-h-4" : "min-h-6"
      }`}
    />
  );
}

// ─── Menu primitives ─────────────────────────────────────────────────────────

export function MenuRow({
  icon,
  iconClass,
  label,
  onClick,
  className,
  disabled,
  danger,
}: {
  icon: HugeIcon;
  iconClass?: string;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-1.5 rounded-xl px-1.5 py-1 text-sm font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "text-destructive hover:bg-destructive/15"
          : "hover:bg-primary/15"
      } ${className ?? ""}`}
    >
      <Icon icon={icon} className={`size-4 shrink-0 ${iconClass ?? ""}`} />
      <span className="font-semibold">{label}</span>
    </button>
  );
}

// ─── Declarative menu types ───────────────────────────────────────────────────

export type SubmenuItem = {
  id: string;
  icon: HugeIcon;
  label: string;
  onClick: () => void;
};

export type MenuItem = {
  id: string;
  icon: HugeIcon;
  label: string;
  /** Called when item is clicked (or confirmed, if confirm is set) */
  onClick?: () => void;
  /** Defaults true. Set false to hide without removing from the array. */
  visible?: boolean;
  disabled?: boolean;
  /** Tooltip shown when disabled */
  disabledReason?: string;
  /** Red danger styling */
  danger?: boolean;
  /** If set, clicking shows a confirmation panel with this message before calling onClick */
  confirm?: string;
  /** If set, hovering reveals a submenu to the right */
  submenu?: SubmenuItem[];
};

export type MenuGroup = {
  id: string;
  items: MenuItem[];
};

// ─── Task actions menu ────────────────────────────────────────────────────────

const SUB_OPEN_MS = 80;
const SUB_CLOSE_MS = 130;

export function TaskActionsMenu({
  open,
  position,
  taskID,
  groups,
}: {
  open: boolean;
  position: { left: number; top: number } | null;
  taskID: string;
  groups: MenuGroup[];
}) {
  const [confirmOpenId, setConfirmOpenId] = useState<string | null>(null);
  const [submenuOpenId, setSubmenuOpenId] = useState<string | null>(null);
  const openSubRef = useRef<number | null>(null);
  const closeSubRef = useRef<number | null>(null);

  // Reset internal state when menu closes
  useEffect(() => {
    if (!open) {
      setConfirmOpenId(null);
      setSubmenuOpenId(null);
    }
  }, [open]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (openSubRef.current !== null) window.clearTimeout(openSubRef.current);
      if (closeSubRef.current !== null)
        window.clearTimeout(closeSubRef.current);
    };
  }, []);

  const scheduleOpenSubmenu = (id: string) => {
    if (closeSubRef.current !== null) {
      window.clearTimeout(closeSubRef.current);
      closeSubRef.current = null;
    }
    openSubRef.current = window.setTimeout(() => {
      setSubmenuOpenId(id);
      openSubRef.current = null;
    }, SUB_OPEN_MS);
  };

  const scheduleCloseSubmenu = () => {
    if (openSubRef.current !== null) {
      window.clearTimeout(openSubRef.current);
      openSubRef.current = null;
    }
    closeSubRef.current = window.setTimeout(() => {
      setSubmenuOpenId(null);
      closeSubRef.current = null;
    }, SUB_CLOSE_MS);
  };

  if (!open || !position) return null;

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => item.visible !== false),
    }))
    .filter((g) => g.items.length > 0);

  return createPortal(
    <TooltipProvider>
      <div
        data-task-actions-menu={taskID}
        className="fixed z-[9999] w-40 rounded-2xl border bg-popover/92 p-1 text-popover-foreground shadow-lg backdrop-blur-sm ring-1 ring-foreground/12"
        style={{ left: `${position.left}px`, top: `${position.top}px` }}
      >
        <div className="flex flex-col gap-0.5">
          {visibleGroups.map((group, groupIndex) => (
            <div key={group.id} className="contents">
              {groupIndex > 0 && (
                <div className="mx-1 my-0.5 border-t border-border/60" />
              )}

              {group.items.map((item) => {
                // ── Submenu item ──────────────────────────────────────────
                if (item.submenu) {
                  return (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => scheduleOpenSubmenu(item.id)}
                      onMouseLeave={scheduleCloseSubmenu}
                    >
                      <button className="flex w-full items-center gap-1.5 rounded-xl px-1.5 py-1 text-sm transition-colors hover:bg-primary/15">
                        <Icon icon={item.icon} className="size-4 shrink-0" />
                        <span className="font-semibold">{item.label}</span>
                        <Icon
                          icon={ArrowRight01Icon}
                          className="ml-auto size-4 shrink-0"
                        />
                      </button>

                      <div
                        className={`absolute left-full top-0.5 z-[10000] ml-2 w-28 overflow-hidden rounded-2xl border bg-popover/92 p-1 shadow-lg backdrop-blur-sm ring-1 ring-foreground/12 transition-all ${
                          submenuOpenId === item.id
                            ? "pointer-events-auto opacity-100"
                            : "pointer-events-none opacity-0"
                        }`}
                        onMouseEnter={() => scheduleOpenSubmenu(item.id)}
                        onMouseLeave={scheduleCloseSubmenu}
                      >
                        <div className="flex flex-col gap-0.5">
                          {item.submenu.map((sub) => (
                            <MenuRow
                              key={sub.id}
                              icon={sub.icon}
                              label={sub.label}
                              onClick={sub.onClick}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                // ── Confirmation item ─────────────────────────────────────
                if (item.confirm) {
                  return (
                    <div key={item.id} className="relative">
                      <MenuRow
                        icon={item.icon}
                        label={item.label}
                        danger={item.danger}
                        onClick={() =>
                          setConfirmOpenId(
                            confirmOpenId === item.id ? null : item.id,
                          )
                        }
                      />
                      <div
                        className={`absolute left-full top-0 z-[10001] ml-2 w-56 rounded-2xl border bg-popover/95 p-2 shadow-lg backdrop-blur-sm ring-1 ring-foreground/12 transition-all ${
                          confirmOpenId === item.id
                            ? "pointer-events-auto opacity-100"
                            : "pointer-events-none opacity-0"
                        }`}
                      >
                        <p className="text-xs leading-relaxed text-foreground">
                          {item.confirm}
                        </p>
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            className="rounded-lg border border-border px-2 py-1 text-xs transition-colors hover:bg-muted"
                            onClick={() => setConfirmOpenId(null)}
                          >
                            Keep
                          </button>
                          <button
                            className="rounded-lg border border-destructive/40 px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                            onClick={() => {
                              item.onClick?.();
                              setConfirmOpenId(null);
                            }}
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ── Regular item (with optional disabled tooltip) ─────────
                const row = (
                  <MenuRow
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    onClick={item.onClick ?? (() => {})}
                    disabled={item.disabled}
                    danger={item.danger}
                  />
                );

                if (item.disabled && item.disabledReason) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <div>{row}</div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs text-xs">
                        {item.disabledReason}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return row;
              })}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>,
    document.body,
  );
}
