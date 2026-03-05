# shadcn Component Implementation

## MANDATORY: Fetch Docs First

Before implementing ANY shadcn component, use `fetch_webpage`:
- URL: `https://ui.shadcn.com/docs/components/[component-name]`
- Read API/examples—use patterns from docs, not guesses
- If docs say it's automatic (like ContextMenu handling right-clicks), don't add manual logic

## Install via CLI

**Always** use `npx shadcn@latest add [component-name]` to install components. Never write shadcn components from scratch.

## DRY for Menus

Define structure as typed const, map over it with recursive component:

```typescript
const ITEMS = [
  { type: "item", id: "create", label: "Create", icon: AddIcon },
  { type: "separator" },
  { 
    type: "item", id: "backups", label: "Backups", icon: SaveIcon,
    children: [
      { type: "item", id: "import", label: "Import", icon: UploadIcon },
      { type: "item", id: "export", label: "Export", icon: DownloadIcon }
    ]
  },
  { type: "separator" },
  { type: "item", id: "reset", label: "Reset", icon: DeleteIcon, variant: "destructive" as const }
] as const satisfies MenuItemType[];

// Recursive component handles items, separators, nested children
function MenuItem({ item }: { item: MenuItemType }) {
  if (item.type === "separator") return <ContextMenuSeparator />;
  if (item.children) return <ContextMenuSub>...</ContextMenuSub>;
  return <ContextMenuItem variant={item.variant}>...</ContextMenuItem>;
}
```

## TypeScript Conventions

- **Never use `interface`** → Always use `type`
- **Never `children: React.ReactNode`** → Use `PropsWithChildren` from React
- **Extract prop types from components**: `Parameters<typeof Component>[0]["propName"]`
- Remove unnecessary type declarations—use PropsWithChildren directly

## DRY JavaScript/JSX

**Extract repeated JSX fragments** into variables, don't duplicate:
```typescript
const content = (
  <>
    {item.icon && <Icon icon={item.icon} size={16} />}
    <span>{item.label}</span>
  </>
);

// Use once in conditional logic:
if (item.children) return <Sub>{content}</Sub>;
return <Item>{content}</Item>;
```

## Common Mistakes

❌ `DropdownMenu` for right-click → ✅ `ContextMenu`  
❌ Manual `onContextMenu` logic → ✅ ContextMenu does it  
❌ Repeating menu JSX → ✅ Const array + `.map()`  
❌ Hardcoded submenus → ✅ Recursive component  
❌ Writing shadcn components → ✅ Use CLI to install

## Project Setup

- Icons: `@hugeicons/core-free-icons` + wrapper at `cpns/Icon.tsx`
- Use relative imports (`./Icon`) for same-folder components
- shadcn components in `shadcn/ui/`
