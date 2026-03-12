import { type HugeIcon, Icon } from "@/cpns/Icon";
import { cn } from "@/shadcn/lib/utils";

export function Note({
  variant = "muted",
  icon,
  text,
  className,
  url,
  trailingIcon,
}: {
  url?: string;
  variant?: "muted" | "destructive" | "pill";
  text: string;
  icon: HugeIcon;
  trailingIcon?: HugeIcon;
  className?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      className={cn(
        `inline-flex gap-1.5 items-center select-none`,
        url && "hover:cursor-pointer hover:scale-105 duration-75",
        {
          destructive: "text-destructive",
          muted: "text-muted-foreground",
          pill: `p-0.5 px-2 rounded-full squircle squircle-full bg-card border-accent border`,
        }[variant],
        className,
      )}
    >
      <Icon {...{ icon }} />
      <span>{text}</span>
      {trailingIcon && <Icon icon={trailingIcon} />}
    </a>
  );
}
