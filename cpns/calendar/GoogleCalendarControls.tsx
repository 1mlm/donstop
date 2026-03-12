"use client";

import {
  Alert02Icon,
  Appointment01Icon,
  ArrowDown01Icon,
  CalendarRemove01Icon,
  CalendarSetting01Icon,
  CloudIcon,
  CloudOffIcon,
  Delete02Icon,
  HourglassIcon,
  Loading01Icon,
  Logout02Icon,
  Play,
  RedoIcon,
  StopIcon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { googleLogout } from "@react-oauth/google";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  deleteGoogleCalendarEvent,
  fetchGoogleCalendarEvents,
  type GoogleCalendarEventItem,
  useCalendarSync,
  useGoogleCalendarAuth,
} from "@/lib/calendar";
import { useTODOStore } from "@/lib/store";
import { formatDateTime } from "@/lib/util";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shadcn/ui/alert-dialog";
import { Button } from "@/shadcn/ui/button";
import { Calendar } from "@/shadcn/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Input } from "@/shadcn/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import { Switch } from "@/shadcn/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { Icon } from "../Icon";
import {
  GOOGLE_CALENDAR_CLIENT_ID_ENV_KEY,
  isGoogleCalendarConfigured,
} from "./GoogleCalendarProvider";

const CREATE_CALENDAR_VALUE = "__create_calendar__";
const DEFAULT_NEW_CALENDAR_NAME = "DonStop";
const GOOGLE_INTERACTION_ENABLED_KEY = "todo-app-google-interaction-enabled";
const MOBILE_FULLSCREEN_MENU_CLASS =
  "max-md:fixed max-md:inset-0 max-md:h-dvh max-md:w-screen max-md:max-w-none max-md:rounded-none max-md:border-0 max-md:p-4 max-md:!left-0 max-md:!top-0 max-md:!transform-none";
const MOBILE_FULLSCREEN_POPOVER_CLASS =
  "max-md:fixed max-md:inset-0 max-md:h-dvh max-md:w-screen max-md:max-w-none max-md:rounded-none max-md:border-0 max-md:p-4 max-md:!left-0 max-md:!top-0 max-md:!transform-none";

function getEventStartTimestamp(event: GoogleCalendarEventItem) {
  const raw = event.start?.dateTime || event.start?.date;
  if (!raw) {
    return null;
  }

  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function formatEventTimeRange(event: GoogleCalendarEventItem) {
  const start = event.start?.dateTime || event.start?.date;
  const end = event.end?.dateTime || event.end?.date;

  if (!start || !end) {
    return "No date";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${formatDateTime(start)} - ${formatDateTime(end)}`;
  }

  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (sameDay) {
    return `${dateFormatter.format(startDate)}, ${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
  }

  return `${dateFormatter.format(startDate)}, ${timeFormatter.format(startDate)} - ${dateFormatter.format(endDate)}, ${timeFormatter.format(endDate)}`;
}

function splitEventSummaryAndCalendar(summary?: string | null) {
  if (!summary) {
    return { title: "(No title)", calendarName: null as string | null };
  }

  const match = summary.match(/^(.*)\(([^()]+)\)\s*$/);
  if (!match) {
    return { title: summary, calendarName: null as string | null };
  }

  return {
    title: match[1].trim(),
    calendarName: match[2].trim(),
  };
}

export default function GoogleCalendarControls() {
  if (!isGoogleCalendarConfigured()) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full squircle squircle-full px-3"
          >
            <Icon icon={UnavailableIcon} />
            Google Calendar not available
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          className={`w-80 max-w-[calc(100vw-2rem)] ${MOBILE_FULLSCREEN_POPOVER_CLASS}`}
        >
          <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">
              Google Calendar integration is optional.
            </p>
            <p>
              No{" "}
              <span className="font-mono">
                {GOOGLE_CALENDAR_CLIENT_ID_ENV_KEY}
              </span>{" "}
              was found.
            </p>
            <p>
              Add it in <span className="font-mono">.env.local</span> only if
              you want Calendar sync, or keep using the app normally without it.
            </p>
            <p>See the project README for setup details.</p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return <GoogleCalendarControlsInner />;
}

function GoogleCalendarControlsInner() {
  const [isGoogleInteractionEnabled, setIsGoogleInteractionEnabled] =
    useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUnlinkedMenuOpen, setIsUnlinkedMenuOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState(
    DEFAULT_NEW_CALENDAR_NAME,
  );
  const [isDeletingEvents, setIsDeletingEvents] = useState(false);
  const [deleteEventsError, setDeleteEventsError] = useState<string | null>(
    null,
  );
  const [isEventManagerOpen, setIsEventManagerOpen] = useState(false);
  const [isRangePopoverOpen, setIsRangePopoverOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoadingCalendarEvents, setIsLoadingCalendarEvents] = useState(false);
  const [calendarEventsError, setCalendarEventsError] = useState<string | null>(
    null,
  );
  const [calendarEvents, setCalendarEvents] = useState<
    GoogleCalendarEventItem[]
  >([]);
  const [calendarEventCountByCalendarID, setCalendarEventCountByCalendarID] =
    useState<Record<string, number>>({});
  const [isLoadingCalendarCounts, setIsLoadingCalendarCounts] = useState(false);
  const [selectedEventIDs, setSelectedEventIDs] = useState<string[]>([]);
  const [isRetryingConnection, setIsRetryingConnection] = useState(false);
  const [errorMessages, setErrorMessages] = useState<
    Array<{ id: string; message: string }>
  >([]);
  const history = useTODOStore((state) => state.history);
  const markHistoryEntriesDeleted = useTODOStore(
    (state) => state.markHistoryEntriesDeleted,
  );
  const logCalendarConnected = useTODOStore(
    (state) => state.logCalendarConnected,
  );
  const logCalendarDisconnected = useTODOStore(
    (state) => state.logCalendarDisconnected,
  );
  const logCalendarSyncEnabled = useTODOStore(
    (state) => state.logCalendarSyncEnabled,
  );
  const logCalendarSyncDisabled = useTODOStore(
    (state) => state.logCalendarSyncDisabled,
  );
  const logCalendarTargetChanged = useTODOStore(
    (state) => state.logCalendarTargetChanged,
  );

  const {
    status,
    auth,
    targetCalendarID,
    setTargetCalendarID,
    loadError,
    loginFeedback,
    createError,
    isCreatingCalendar,
    createAndSelectCalendar,
    startLogin,
    disconnect,
  } = useGoogleCalendarAuth();
  const syncAuth = isGoogleInteractionEnabled ? auth : null;
  const syncTargetCalendarID = isGoogleInteractionEnabled
    ? targetCalendarID
    : null;
  const { syncError } = useCalendarSync(syncAuth, syncTargetCalendarID);
  const calendarError = isGoogleInteractionEnabled
    ? syncError || loadError || null
    : null;
  const lastRecordedErrorRef = useRef<string | null>(null);
  const wasLinkedRef = useRef(false);

  useEffect(() => {
    const savedValue = window.localStorage.getItem(
      GOOGLE_INTERACTION_ENABLED_KEY,
    );

    if (savedValue === "0") {
      setIsGoogleInteractionEnabled(false);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      GOOGLE_INTERACTION_ENABLED_KEY,
      isGoogleInteractionEnabled ? "1" : "0",
    );
  }, [isGoogleInteractionEnabled]);

  useEffect(() => {
    if (!calendarError) {
      setErrorMessages([]);
      lastRecordedErrorRef.current = null;
      return;
    }

    if (lastRecordedErrorRef.current === calendarError) {
      return;
    }

    setErrorMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message: calendarError,
      },
    ]);
    lastRecordedErrorRef.current = calendarError;
  }, [calendarError]);

  useEffect(() => {
    const isLinked = status === "linked" && Boolean(auth);

    if (isLinked && !wasLinkedRef.current) {
      logCalendarConnected(
        auth?.profile?.email || auth?.profile?.name || "Google account",
      );
    }

    wasLinkedRef.current = isLinked;
  }, [auth, logCalendarConnected, status]);

  useEffect(() => {
    if (!isRetryingConnection || status === "loading") {
      return;
    }

    setIsRetryingConnection(false);
  }, [isRetryingConnection, status]);

  const selectedCalendar =
    auth?.calendars.find((c) => c.id === targetCalendarID) || null;
  const historyRefreshKey = useMemo(
    () =>
      history
        .map(
          (entry) =>
            `${entry.id}:${entry.calendarSyncStatus}:${entry.calendarEventId ?? ""}:${entry.syncedCalendarId ?? ""}`,
        )
        .join("|"),
    [history],
  );

  useEffect(() => {
    if (!auth || status !== "linked" || !isGoogleInteractionEnabled) {
      setCalendarEventCountByCalendarID({});
      setIsLoadingCalendarCounts(false);
      return;
    }

    let isCancelled = false;

    const loadCounts = async () => {
      setIsLoadingCalendarCounts(true);

      try {
        const entries = await Promise.all(
          auth.calendars.map(async (calendar) => {
            try {
              const events = await fetchGoogleCalendarEvents(
                auth.accessToken,
                calendar.id,
              );
              return [calendar.id, events.length] as const;
            } catch {
              return [calendar.id, 0] as const;
            }
          }),
        );

        if (isCancelled) {
          return;
        }

        setCalendarEventCountByCalendarID(Object.fromEntries(entries));
      } finally {
        if (!isCancelled) {
          setIsLoadingCalendarCounts(false);
        }
      }
    };

    void loadCounts();

    return () => {
      isCancelled = true;
    };
  }, [auth, status, isGoogleInteractionEnabled]);

  useEffect(() => {
    if (
      !isGoogleInteractionEnabled ||
      !auth ||
      !targetCalendarID ||
      status !== "linked"
    ) {
      setCalendarEvents([]);
      setSelectedEventIDs([]);
      setDateRange(undefined);
      setCalendarEventsError(null);
      setIsLoadingCalendarEvents(false);
      return;
    }

    let isCancelled = false;
    const refreshKey = historyRefreshKey;

    const loadAllEvents = async () => {
      setIsLoadingCalendarEvents(true);
      setCalendarEventsError(null);

      try {
        const events = await fetchGoogleCalendarEvents(
          auth.accessToken,
          targetCalendarID,
        );

        if (isCancelled) {
          return;
        }

        if (refreshKey !== historyRefreshKey) {
          return;
        }

        const sortedEvents = [...events].sort((left, right) => {
          const leftTs =
            getEventStartTimestamp(left) ?? Number.MAX_SAFE_INTEGER;
          const rightTs =
            getEventStartTimestamp(right) ?? Number.MAX_SAFE_INTEGER;
          return leftTs - rightTs;
        });

        setCalendarEvents(sortedEvents);
        setCalendarEventCountByCalendarID((current) => ({
          ...current,
          [targetCalendarID]: sortedEvents.length,
        }));
        setSelectedEventIDs([]);
        setDateRange(undefined);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setCalendarEvents([]);
        setSelectedEventIDs([]);
        setCalendarEventsError(
          error instanceof Error
            ? error.message
            : "Unable to load calendar events",
        );
      } finally {
        if (!isCancelled) {
          setIsLoadingCalendarEvents(false);
        }
      }
    };

    void loadAllEvents();

    return () => {
      isCancelled = true;
    };
  }, [
    auth,
    targetCalendarID,
    status,
    isGoogleInteractionEnabled,
    historyRefreshKey,
  ]);

  const selectedEventIDSet = useMemo(
    () => new Set(selectedEventIDs),
    [selectedEventIDs],
  );
  const isAllSelected =
    calendarEvents.length > 0 &&
    selectedEventIDs.length === calendarEvents.length;

  const isDefaultNamedCalendar =
    (selectedCalendar?.summary || "").trim().toLowerCase() ===
    DEFAULT_NEW_CALENDAR_NAME.toLowerCase();

  const triggerContent = selectedCalendar
    ? isDefaultNamedCalendar
      ? "Google Calendar"
      : `Google Calendar:${selectedCalendar.summary}`
    : "Google Calendar";

  const triggerText = isGoogleInteractionEnabled
    ? triggerContent
    : "Google Calendar (Paused)";

  const retryLabel = isRetryingConnection
    ? "Trying again.."
    : "Try reconnecting";
  const retryIcon = isRetryingConnection ? Loading01Icon : RedoIcon;
  const isCalendarUiLocked = isLoadingCalendarEvents || isDeletingEvents;

  const handleRetryConnection = async () => {
    if (isRetryingConnection || !isGoogleInteractionEnabled) {
      return;
    }

    setIsRetryingConnection(true);
    startLogin();
  };

  const toggleSelectEvent = (eventID: string) => {
    setSelectedEventIDs((current) => {
      const next = new Set(current);

      if (next.has(eventID)) {
        next.delete(eventID);
      } else {
        next.add(eventID);
      }

      return Array.from(next);
    });
  };

  const toggleSelectAllEvents = () => {
    if (isAllSelected) {
      setSelectedEventIDs([]);
      return;
    }

    setSelectedEventIDs(calendarEvents.map((event) => event.id));
  };

  const toggleSelectionForDateRange = () => {
    if (!dateRange?.from) return;

    const fromTs = dateRange.from.getTime();
    const toTs = dateRange.to ?? dateRange.from;
    toTs.setHours(23, 59, 59, 999);
    const maxTs = toTs.getTime();

    setSelectedEventIDs((current) => {
      const next = new Set(current);

      for (const event of calendarEvents) {
        const eventTs = getEventStartTimestamp(event);
        if (eventTs === null || eventTs < fromTs || eventTs > maxTs) continue;

        if (next.has(event.id)) {
          next.delete(event.id);
        } else {
          next.add(event.id);
        }
      }

      return Array.from(next);
    });

    setIsRangePopoverOpen(false);
  };

  const handleDeleteSelectedOrAll = async (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    if (!isGoogleInteractionEnabled) {
      return;
    }

    if (!auth || !targetCalendarID) {
      return;
    }

    const eventIDsToDelete = selectedEventIDs;

    if (eventIDsToDelete.length === 0) {
      return;
    }

    setDeleteEventsError(null);
    setIsDeletingEvents(true);

    try {
      for (const eventID of eventIDsToDelete) {
        await deleteGoogleCalendarEvent(
          auth.accessToken,
          targetCalendarID,
          eventID,
        );
      }

      const deletedIDSet = new Set(eventIDsToDelete);
      setCalendarEvents((current) =>
        current.filter((calendarEvent) => !deletedIDSet.has(calendarEvent.id)),
      );
      setCalendarEventCountByCalendarID((current) => ({
        ...current,
        [targetCalendarID]: Math.max(
          0,
          (current[targetCalendarID] ?? calendarEvents.length) -
            eventIDsToDelete.length,
        ),
      }));
      setSelectedEventIDs((current) =>
        current.filter((eventID) => !deletedIDSet.has(eventID)),
      );

      const deletedHistoryEntryIDs = history
        .filter(
          (entry) =>
            entry.syncedCalendarId === targetCalendarID &&
            entry.calendarEventId &&
            deletedIDSet.has(entry.calendarEventId),
        )
        .map((entry) => entry.id);

      if (deletedHistoryEntryIDs.length > 0) {
        markHistoryEntriesDeleted(deletedHistoryEntryIDs);
      }

      setIsDeletingEvents(false);
      setIsEventManagerOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      setDeleteEventsError(
        error instanceof Error
          ? error.message
          : "Unable to delete calendar events",
      );
      setIsDeletingEvents(false);
    }
  };

  if (status !== "linked") {
    const transientMessage = loginFeedback?.message || null;
    const buttonIcon = calendarError
      ? Alert02Icon
      : status === "loading"
        ? Loading01Icon
        : loginFeedback?.kind === "popup_closed"
          ? Logout02Icon
          : loginFeedback?.kind === "popup_failed"
            ? CalendarRemove01Icon
            : Appointment01Icon;

    const buttonText =
      status === "loading"
        ? "Loading calendars..."
        : transientMessage || "Integrate Google Calendar";

    if (!calendarError) {
      return (
        <DropdownMenu
          open={isUnlinkedMenuOpen}
          onOpenChange={setIsUnlinkedMenuOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full squircle squircle-full px-3"
            >
              <Icon
                icon={buttonIcon}
                className={status === "loading" ? "animate-spin" : undefined}
              />
              {buttonText}
              <Icon
                icon={ArrowDown01Icon}
                className={`size-4 transition-transform ${
                  isUnlinkedMenuOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            className={`w-96 max-w-[calc(100vw-2rem)] p-2 ${MOBILE_FULLSCREEN_MENU_CLASS}`}
          >
            <DropdownMenuLabel>
              Why integrate Google Calendar?
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-2 px-2 py-1 text-xs text-muted-foreground leading-relaxed">
              <p>
                Enabling Google Calendar will send each event you've worked on
                on the specific calendar of your choice so you can keep track of
                your productivity. This mainly aims at motivating a lot of
                procasting students like me so they can litterally "visualize"
                their productivity which helps to fight procrastination in the
                long term.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={startLogin}
              >
                <Icon icon={Appointment01Icon} />
                Integrate Google Calendar
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <DropdownMenu
        open={isUnlinkedMenuOpen}
        onOpenChange={setIsUnlinkedMenuOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full squircle squircle-full px-3"
          >
            <Icon
              icon={buttonIcon}
              className={status === "loading" ? "animate-spin" : undefined}
            />
            {buttonText}
            <Icon
              icon={ArrowDown01Icon}
              className={`size-4 transition-transform ${
                isUnlinkedMenuOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          className={`w-96 max-w-[calc(100vw-2rem)] p-2 ${MOBILE_FULLSCREEN_MENU_CLASS}`}
        >
          <DropdownMenuLabel className="text-destructive">
            Google Calendar Error
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="space-y-2 px-2 py-1 text-xs text-muted-foreground">
            <p className="text-destructive font-medium break-words">
              {calendarError}
            </p>
            <p>
              Authentication or sync failed. Reconnect Google Calendar to
              continue syncing task sessions.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={isRetryingConnection}
              onClick={handleRetryConnection}
            >
              <Icon
                icon={retryIcon}
                className={isRetryingConnection ? "animate-spin" : undefined}
              />
              {retryLabel}
            </Button>
            {errorMessages.length > 0 ? (
              <div className="space-y-1 pt-1">
                {errorMessages.map((errorItem, index) => (
                  <p
                    key={errorItem.id}
                    className="break-words text-destructive"
                  >
                    {index + 1}. {errorItem.message}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={calendarError ? "destructive" : "outline"}
            size="sm"
            className="bg-transparent gap-1.5 rounded-full squircle squircle-full px-3"
          >
            <Icon
              icon={
                !isGoogleInteractionEnabled
                  ? CloudOffIcon
                  : calendarError
                    ? Alert02Icon
                    : status === "linked"
                      ? CloudIcon
                      : CloudOffIcon
              }
            />
            {triggerText}
            <Icon
              icon={ArrowDown01Icon}
              className={`size-4 transition-transform ${
                isMenuOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="bottom"
          className={`w-80 max-w-[calc(100vw-2rem)] p-0 overflow-hidden ${MOBILE_FULLSCREEN_MENU_CLASS} max-md:overflow-y-auto`}
        >
          {/* Profile row */}
          <div className="flex items-center gap-3 px-3 py-3">
            {auth?.profile?.picture ? (
              <span
                aria-hidden
                className="size-8 shrink-0 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${auth.profile.picture})` }}
              />
            ) : (
              <span className="size-8 shrink-0 rounded-full bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {auth?.profile?.name ||
                  auth?.profile?.email ||
                  "Google account"}
              </p>
              {auth?.profile?.email ? (
                <p className="truncate text-xs text-muted-foreground">
                  {auth.profile.email}
                </p>
              ) : null}
            </div>

            <div className="ml-auto flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="px-1">
                    <Switch
                      size="sm"
                      checked={isGoogleInteractionEnabled}
                      onCheckedChange={(checked) => {
                        if (checked !== isGoogleInteractionEnabled) {
                          const calendarLabel =
                            selectedCalendar?.summary || "selected calendar";
                          if (checked) {
                            logCalendarSyncEnabled(calendarLabel);
                          } else {
                            logCalendarSyncDisabled(calendarLabel);
                          }
                        }

                        setIsGoogleInteractionEnabled(checked);
                      }}
                      disabled={isCalendarUiLocked}
                      aria-label="Toggle Google Calendar synchronization"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isGoogleInteractionEnabled
                    ? "Disable Google Calendar synchronization"
                    : "Enable Google Calendar synchronization"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-9 shrink-0 px-0 text-destructive hover:text-destructive"
                    aria-label="Log out"
                    disabled={isCalendarUiLocked}
                    onClick={() => {
                      logCalendarDisconnected(
                        auth?.profile?.email ||
                          auth?.profile?.name ||
                          "Google account",
                      );
                      googleLogout();
                      disconnect();
                      setIsMenuOpen(false);
                    }}
                  >
                    <Icon icon={Logout02Icon} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Log out</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Separator />

          {/* Calendar select */}
          <div className="px-3 py-2.5">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Calendar:
            </p>
            {auth ? (
              <Select
                value={targetCalendarID || undefined}
                disabled={!isGoogleInteractionEnabled || isCalendarUiLocked}
                onValueChange={async (value) => {
                  if (value === CREATE_CALENDAR_VALUE) {
                    setIsCreateFormOpen(true);
                    return;
                  }

                  const previousCalendarName =
                    selectedCalendar?.summary || "Unknown calendar";
                  const nextCalendarName =
                    auth.calendars.find((calendar) => calendar.id === value)
                      ?.summary || "Unknown calendar";

                  if (value !== targetCalendarID) {
                    logCalendarTargetChanged(
                      previousCalendarName,
                      nextCalendarName,
                    );
                  }

                  setIsCreateFormOpen(false);
                  setTargetCalendarID(value);
                }}
              >
                <SelectTrigger className="h-9 px-3 text-xs">
                  <SelectValue placeholder="Choose target calendar" />
                </SelectTrigger>
                <SelectContent className="p-1.5">
                  {auth.calendars.map((calendar) => (
                    <SelectItem
                      key={calendar.id}
                      value={calendar.id}
                      className="rounded-lg px-2 py-1.5"
                    >
                      <span className="inline-flex w-full items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block size-2 rounded-full"
                            style={{
                              backgroundColor:
                                calendar.backgroundColor || "currentColor",
                            }}
                          />
                          {calendar.primary
                            ? `${auth.profile?.name || auth.profile?.email || calendar.summary} (Main)`
                            : calendar.summary}
                        </span>
                        <span className="inline-flex rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {isLoadingCalendarCounts
                            ? "..."
                            : (calendarEventCountByCalendarID[calendar.id] ??
                              0)}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem
                    value={CREATE_CALENDAR_VALUE}
                    className="rounded-lg px-2 py-1.5"
                  >
                    + Create calendar...
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : null}

            {isCreateFormOpen ? (
              <div className="mt-2 space-y-2 rounded-md border p-2">
                <Input
                  autoFocus
                  value={newCalendarName}
                  onChange={(event) => setNewCalendarName(event.target.value)}
                  placeholder={DEFAULT_NEW_CALENDAR_NAME}
                  className="h-8"
                  disabled={isCreatingCalendar}
                  aria-invalid={Boolean(createError)}
                  onKeyDown={async (event) => {
                    if (event.key !== "Enter" || isCreatingCalendar) return;
                    event.preventDefault();
                    const didCreate =
                      await createAndSelectCalendar(newCalendarName);
                    if (didCreate) {
                      setIsCreateFormOpen(false);
                      setNewCalendarName(DEFAULT_NEW_CALENDAR_NAME);
                    }
                  }}
                />
                {createError ? (
                  <p className="text-sm font-medium text-destructive">
                    {createError}
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={isCreatingCalendar || isCalendarUiLocked}
                    onClick={() => {
                      setIsCreateFormOpen(false);
                      setNewCalendarName(DEFAULT_NEW_CALENDAR_NAME);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 min-w-28 border-border text-foreground"
                    disabled={isCreatingCalendar || isCalendarUiLocked}
                    onClick={async () => {
                      const didCreate =
                        await createAndSelectCalendar(newCalendarName);
                      if (didCreate) {
                        setIsCreateFormOpen(false);
                        setNewCalendarName(DEFAULT_NEW_CALENDAR_NAME);
                      }
                    }}
                  >
                    <Icon
                      icon={Loading01Icon}
                      className={isCreatingCalendar ? "animate-spin" : "hidden"}
                    />
                    {isCreatingCalendar ? "Creating..." : "Create & use"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center justify-center px-2 py-1.5">
            {/* Event manager button */}
            {targetCalendarID ? (
              calendarEvents.length === 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full shrink-0 gap-1.5 px-2 text-muted-foreground/70"
                        aria-label="No events yet"
                        disabled
                      >
                        <Icon icon={CalendarSetting01Icon} />
                        <span className="text-xs font-medium">No events</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    sideOffset={10}
                    className="max-w-[32rem] text-[13px] leading-normal"
                  >
                    <p>
                      When you{" "}
                      <span className="inline-flex items-center whitespace-nowrap text-foreground/95">
                        <span className="pl-0.5 pr-1">
                          <Icon icon={Play} className="size-3.5 shrink-0" />
                        </span>
                        <span className="pr-0.5">Start</span>
                      </span>{" "}
                      and{" "}
                      <span className="inline-flex items-center whitespace-nowrap text-foreground/95">
                        <span className="pl-0.5 pr-1">
                          <Icon icon={StopIcon} className="size-3.5 shrink-0" />
                        </span>
                        <span className="pr-0.5">Stop</span>
                      </span>{" "}
                      tasks, and they get posted on your Google Calendar, you
                      will be able to manage them here.
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <AlertDialog
                  open={isEventManagerOpen}
                  onOpenChange={setIsEventManagerOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0 gap-1.5 px-2 flex-1"
                      aria-label="Manage calendar events"
                      disabled={
                        !isGoogleInteractionEnabled || isCalendarUiLocked
                      }
                      onClick={() => setIsEventManagerOpen(true)}
                    >
                      <Icon icon={CalendarSetting01Icon} />
                      <span className="text-xs font-medium">
                        {isLoadingCalendarEvents
                          ? "..."
                          : calendarEvents.length}{" "}
                        events
                      </span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-3xl max-md:h-dvh max-md:w-screen max-md:max-w-none max-md:rounded-none max-md:border-0 max-md:p-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Google Calendar Events
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You can select specific events or delete all.
                      </AlertDialogDescription>
                      {calendarEventsError ? (
                        <p className="text-sm font-medium text-destructive">
                          {calendarEventsError}
                        </p>
                      ) : null}
                      {deleteEventsError ? (
                        <p className="text-sm font-medium text-destructive">
                          {deleteEventsError}
                        </p>
                      ) : null}
                    </AlertDialogHeader>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {/* Select-all squircle */}
                        <button
                          type="button"
                          className="flex shrink-0 items-center gap-2.5 disabled:pointer-events-none disabled:opacity-40"
                          onClick={toggleSelectAllEvents}
                          disabled={
                            calendarEvents.length === 0 || isCalendarUiLocked
                          }
                          aria-label={
                            isAllSelected ? "Deselect all" : "Select all"
                          }
                        >
                          <span
                            className={`inline-flex size-6 items-center justify-center rounded-xl squircle squircle-full border-2 transition-colors ${
                              isAllSelected
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-transparent"
                            }`}
                          >
                            {isAllSelected ? (
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 11 11"
                                fill="none"
                                aria-hidden
                              >
                                <path
                                  d="M1.5 5.5L4.5 8.5L9.5 2.5"
                                  stroke="currentColor"
                                  strokeWidth="1.75"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {selectedEventIDs.length === 0
                              ? "None selected"
                              : isAllSelected
                                ? "All selected"
                                : `${selectedEventIDs.length}/${calendarEvents.length} selected`}
                          </span>
                        </button>

                        <div className="flex-1" />

                        {/* Date range picker */}
                        <Popover
                          open={isRangePopoverOpen}
                          onOpenChange={setIsRangePopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              disabled={
                                calendarEvents.length === 0 ||
                                isCalendarUiLocked
                              }
                            >
                              Select range
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="bottom"
                            className="w-auto p-0"
                            align="end"
                          >
                            <Calendar
                              mode="range"
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={1}
                            />
                            <div className="flex items-center justify-end gap-2 border-t p-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isCalendarUiLocked}
                                onClick={() => setIsRangePopoverOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                disabled={
                                  !dateRange?.from || isCalendarUiLocked
                                }
                                onClick={toggleSelectionForDateRange}
                              >
                                Apply range
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="max-h-80 space-y-1 overflow-auto rounded-md border p-2">
                        {isLoadingCalendarEvents ? (
                          <p className="text-sm text-muted-foreground">
                            Loading calendar events...
                          </p>
                        ) : calendarEvents.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No events found in this calendar.
                          </p>
                        ) : (
                          calendarEvents.map((calendarEvent) => {
                            const isSelected = selectedEventIDSet.has(
                              calendarEvent.id,
                            );
                            return (
                              <button
                                key={calendarEvent.id}
                                className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-accent/40"
                                onClick={() =>
                                  toggleSelectEvent(calendarEvent.id)
                                }
                                disabled={isCalendarUiLocked}
                              >
                                <span className="inline-flex size-5 items-center justify-center rounded-lg squircle squircle-lg border border-border text-[10px] leading-none">
                                  {isSelected ? "✓" : ""}
                                </span>
                                <span className="min-w-0 flex-1">
                                  {(() => {
                                    const { title, calendarName } =
                                      splitEventSummaryAndCalendar(
                                        calendarEvent.summary,
                                      );

                                    return (
                                      <span className="block truncate text-sm font-medium text-foreground">
                                        {title}
                                        {calendarName ? (
                                          <span className="ml-1.5 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                            {calendarName}
                                          </span>
                                        ) : null}
                                      </span>
                                    );
                                  })()}
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {formatEventTimeRange(calendarEvent)}
                                  </span>
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeletingEvents}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        className="text-primary-foreground"
                        loading={isDeletingEvents}
                        loadingIcon={HourglassIcon}
                        disabled={
                          isDeletingEvents ||
                          isLoadingCalendarEvents ||
                          calendarEvents.length === 0 ||
                          selectedEventIDs.length === 0
                        }
                        onClick={handleDeleteSelectedOrAll}
                      >
                        {!isDeletingEvents ? (
                          <Icon icon={Delete02Icon} className="size-4" />
                        ) : null}
                        {isDeletingEvents
                          ? "Deleting..."
                          : selectedEventIDs.length === 0
                            ? "No event selected"
                            : "Delete selected"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )
            ) : null}
          </div>

          {calendarError ? (
            <>
              <Separator />
              <div className="space-y-2 px-3 py-2 text-xs text-muted-foreground">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-fit"
                  disabled={
                    isRetryingConnection ||
                    !isGoogleInteractionEnabled ||
                    isCalendarUiLocked
                  }
                  onClick={handleRetryConnection}
                >
                  <Icon
                    icon={retryIcon}
                    className={
                      isRetryingConnection ? "animate-spin" : undefined
                    }
                  />
                  {retryLabel}
                </Button>
                <div className="space-y-1">
                  {errorMessages.map((errorItem, index) => (
                    <p
                      key={errorItem.id}
                      className="break-words text-destructive"
                    >
                      {index + 1}. {errorItem.message}
                    </p>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
