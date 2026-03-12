import { ArrowUpRight01Icon, Github } from "@hugeicons/core-free-icons";
import type { ComponentType, ReactNode } from "react";
import GoogleCalendarControls from "@/cpns/calendar/GoogleCalendarControls";
import HistoryMenu from "@/cpns/history/HistoryMenu";
import { Icon } from "@/cpns/Icon";
import { SettingsButton } from "@/cpns/settings";

const CREDIT_LINK_CLASS =
  "inline-flex items-center gap-1.5 rounded-full squircle squircle-full border border-accent/60 bg-card px-2 py-0.5 select-none transition-opacity duration-75 hover:opacity-80";

const TOP_CONTROLS = [
  SettingsButton,
  HistoryMenu,
  GoogleCalendarControls,
] as const satisfies readonly ComponentType[];

export function AppTopBar() {
  return (
    <div className="absolute inset-x-0 top-0 flex items-center justify-around px-6 pt-2">
      <div className="flex items-center gap-2 text-xs text-foreground">
        <span>Made with</span>
        <span className="text-sm leading-none">❤️</span>
        <span>on</span>

        <CreditLink href="https://github.com/1mlm/donstop">
          <Icon icon={Github} className="size-4" />
          <span className="text-xs font-medium">1mlm/donstop</span>
          <Icon
            icon={ArrowUpRight01Icon}
            className="relative -top-0.5 size-3 text-muted-foreground"
          />
        </CreditLink>

        <span>by</span>

        <CreditLink href="https://github.com/1mlm">
          <span
            aria-hidden
            className="size-5 rounded-full bg-cover bg-center"
            style={{
              backgroundImage: "url(/pfp.jpg)",
            }}
          />
          <span className="text-xs font-medium">Malik</span>
          <Icon
            icon={ArrowUpRight01Icon}
            className="relative -top-0.5 size-3 text-muted-foreground"
          />
        </CreditLink>
      </div>

      <div className="h-6 w-px bg-border/70" />

      {TOP_CONTROLS.map((Control) => (
        <Control key={Control.name} />
      ))}
    </div>
  );
}

function CreditLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={CREDIT_LINK_CLASS}
    >
      {children}
    </a>
  );
}
