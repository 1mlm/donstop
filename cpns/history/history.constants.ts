import {
  CalendarRemove01Icon,
  CloudIcon,
  CloudOffIcon,
} from "@hugeicons/core-free-icons";

export const TASK_SYNC_STATUS_ICON = {
  pending: CloudOffIcon,
  synced: CloudIcon,
  failed: CalendarRemove01Icon,
  deleted: CalendarRemove01Icon,
} as const;

export const RELATIVE_TOOLTIP_THRESHOLD_SECONDS = 1 * 3600 + 43 * 60 + 23;
