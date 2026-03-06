import { type HugeIcon, Icon } from "@/cpns/Icon";
import { cn } from "@/shadcn/lib/utils";

function randomHash<K>(arr: K[], text: string) {
  return arr[
    text.split("").reduce((acc, curr) => curr.charCodeAt(0) + acc, 0) %
      arr.length
  ];
}

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
  const randomRotate = randomHash(
    [
      "hover:rotate-1",
      "hover:-rotate-1",
      "hover:rotate-2",
      "hover:-rotate-2",
      "hover:rotate-3",
      "hover:-rotate-3",
    ],
    url ?? text,
  );

  const randomTranslateY = randomHash(
    ["hover:-translate-y-0.5", "hover:translate-y-1", "hover:-translate-y-1.5"],
    url ?? text,
  );

  const randomTranslateX = randomHash(
    [
      "hover:translate-x-0.5",
      "hover:-translate-x-0.5",
      "hover:translate-x-1",
      "hover:-translate-x-1",
      "hover:translate-x-1.5",
      "hover:-translate-x-1.5",
    ],
    url ?? text,
  );

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
        ...(variant === "pill"
          ? [randomTranslateY, randomTranslateX, randomRotate]
          : []),
      )}
    >
      <Icon {...{ icon }} />
      <span>{text}</span>
    </a>
  );
}
