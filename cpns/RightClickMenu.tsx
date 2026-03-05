"use client";

import {
  Add01Icon,
  Delete01Icon,
  Download01Icon,
  SaveIcon,
  SettingsIcon,
  Share03Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import type { PropsWithChildren } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Icon } from "./Icon";

type MenuItemType =
  | {
      type: "item";
      id: string;
      label: string;
      icon?: typeof Add01Icon;
      variant?: Parameters<typeof ContextMenuItem>[0]["variant"];
      children?: MenuItemType[];
    }
  | {
      type: "separator";
    };

const MENU_ITEMS = [
  {
    type: "item",
    id: "create",
    label: "Create a task",
    icon: Add01Icon,
  },
  { type: "separator" },
  {
    type: "item",
    id: "backups",
    label: "Backups",
    icon: SaveIcon,
    children: [
      {
        type: "item",
        id: "import",
        label: "Import a backup",
        icon: Upload01Icon,
      },
      {
        type: "item",
        id: "export",
        label: "Export as backup",
        icon: Download01Icon,
      },
    ],
  },
  {
    type: "item",
    id: "share",
    label: "Share",
    icon: Share03Icon,
  },
  { type: "separator" },
  {
    type: "item",
    id: "reset",
    label: "Reset all",
    icon: Delete01Icon,
    variant: "destructive" as const,
  },
  {
    type: "item",
    id: "settings",
    label: "Settings",
    icon: SettingsIcon,
  },
] as const satisfies MenuItemType[];

function RightClickMenuItem({ item }: { item: MenuItemType }) {
  if (item.type === "separator") {
    return <ContextMenuSeparator />;
  }

  if (item.children) {
    return (
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          {item.icon && <Icon icon={item.icon} size={16} />}
          <span>{item.label}</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {item.children.map((child, idx) => (
            <RightClickMenuItem
              key={child.type === "item" ? child.id : `sep-${idx}`}
              item={child}
            />
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
    );
  }

  return (
    <ContextMenuItem variant={item.variant}>
      {item.icon && <Icon icon={item.icon} size={16} />}
      <span>{item.label}</span>
    </ContextMenuItem>
  );
}

export function RightClickMenu({ children }: PropsWithChildren) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="w-full h-full">{children}</div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {MENU_ITEMS.map((item, idx) => (
          <RightClickMenuItem
            key={item.type === "item" ? item.id : `sep-${idx}`}
            item={item}
          />
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
