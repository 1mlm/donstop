import type { HugeIcon } from "@/cpns/Icon";
import { Icon } from "@/cpns/Icon";
import { SETTINGS_ROW_CLASS } from "./settings.styles";

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
    <div className={SETTINGS_ROW_CLASS}>
      <div className="flex items-center gap-2">
        <Icon icon={icon} className="size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs font-medium">{title}</p>
      </div>
      {children}
    </div>
  );
}
