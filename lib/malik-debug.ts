const DEBUG_FLAG =
  process.env.NEXT_PUBLIC_MALIK_DEBUG ?? process.env.MALIK_DEBUG ?? "";

function isDebugEnabled() {
  return DEBUG_FLAG === "1" || DEBUG_FLAG.toLowerCase() === "true";
}

export type MalikEmoji = "✅" | "🟥" | "⬜";

export function malikDebug(
  emoji: MalikEmoji,
  message: string,
  payload?: unknown,
) {
  if (!isDebugEnabled()) return;

  const print = emoji === "🟥" ? console.error : console.info;
  if (payload === undefined) return print(`${emoji} ${message}`);

  return print(`${emoji} ${message}`, payload);
}
