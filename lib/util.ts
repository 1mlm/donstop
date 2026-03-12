export function randomHash<K>(arr: K[], text: string) {
  return arr[
    text.split("").reduce((acc, curr) => curr.charCodeAt(0) + acc, 0) %
      arr.length
  ];
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getElapsedSeconds(startedAt: string, endTimeMs = Date.now()) {
  const startTimeMs = new Date(startedAt).getTime();

  if (!Number.isFinite(startTimeMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((endTimeMs - startTimeMs) / 1000));
}

export function getLiveTaskTimeSeconds(
  storedSeconds: number,
  startedAt?: string,
  endTimeMs = Date.now(),
) {
  if (!startedAt) {
    return storedSeconds;
  }

  return storedSeconds + getElapsedSeconds(startedAt, endTimeMs);
}

export function formatPreviewTime(time: number) {
  if (!time) return;

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  return `${hours > 0 ? `${hours}h` : ""}${minutes > 0 ? `${minutes}m` : ""}${seconds}s`;
}

export function formatChronoTime(time: number) {
  const totalSeconds = Math.max(0, Math.floor(time));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (totalSeconds < 60) {
    return `${seconds}s`;
  }

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDateTime(isoString: string) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateTimeRange(startedAt: string, endedAt: string) {
  return `${formatDateTime(startedAt)} - ${formatDateTime(endedAt)}`;
}

function formatClock(isoString: string) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "Invalid time";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatHistoryDateTimeRange(startedAt: string, endedAt: string) {
  const startDate = new Date(startedAt);
  const endDate = new Date(endedAt);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Invalid date";
  }

  const isSameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  if (isSameDay) {
    return `${formatClock(startedAt)} - ${formatClock(endedAt)}`;
  }

  return formatDateTimeRange(startedAt, endedAt);
}
