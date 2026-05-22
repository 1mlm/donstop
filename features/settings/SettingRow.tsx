import type { HugeIcon } from "@/features/Icon";
import { Icon } from "@/features/Icon";

export function SettingRow({
  icon,
  title,
  children,
}: {
  icon: HugeIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-2.5 py-2">
      <div className="flex items-center gap-2">
        <Icon icon={icon} className="size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs font-medium">{title}</p>
      </div>
      {children}
    </div>
  );
}
