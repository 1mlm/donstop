import { type HugeIcon, Icon } from "@/cpns/Icon";
import { cn } from "@/shadcn/lib/utils";

export function Note({
  variant = "muted",
  icon,
  text,
  className,
  url,
}: {
  url?: string;
  variant?: "muted" | "destructive" | "pill";
  text: string;
  icon: HugeIcon;
  className?: string;
}) {
  return (
    <a
      href={url}
      className={cn(
        `inline-flex gap-1.5 items-center`,
        {
          destructive: "text-destructive",
          muted: "text-muted-foreground",
          pill: `p-0.5 px-2 rounded-full bg-card border-accent border hover-hand hover:scale-105 duration-75`,
        }[variant],
        className,
      )}
    >
      <Icon {...{ icon }} />
      <span>{text}</span>
    </a>
  );
}
