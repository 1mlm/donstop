"use client";

import {
  Cancel01Icon,
  Edit03Icon,
  PlusSignIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { useRef, useState } from "react";
import { Icon } from "@/features/Icon";
import { type TagID, useTODOStore } from "@/lib/store";
import { Button } from "@/shadcn/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shadcn/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { TAG_ICONS } from "./tag-icons";

const ICON_KEYS = Object.keys(TAG_ICONS) as (keyof typeof TAG_ICONS)[];

export default function TagsButton() {
  const tags = useTODOStore((s) => s.tags);
  const activeTagFilter = useTODOStore((s) => s.activeTagFilter);
  const createTag = useTODOStore((s) => s.createTag);
  const deleteTag = useTODOStore((s) => s.deleteTag);
  const renameTag = useTODOStore((s) => s.renameTag);
  const setActiveTagFilter = useTODOStore((s) => s.setActiveTagFilter);

  const [newName, setNewName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>(ICON_KEYS[0]);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createTag(name, selectedIcon);
    setNewName("");
    setSelectedIcon(ICON_KEYS[0]);
    setIconPickerOpen(false);
  };

  const startRename = (tag: { id: string; name: string }) => {
    setRenamingId(tag.id);
    setRenameValue(tag.name);
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      renameTag(renamingId as TagID, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const SelectedIconComp = TAG_ICONS[selectedIcon];
  const activeTag = tags.find((t) => t.id === activeTagFilter);

  return (
    <TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <span className="inline-flex cursor-pointer-custom">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-full squircle squircle-full px-3 gap-1.5 max-w-40 ${
                activeTagFilter
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : ""
              }`}
              aria-label="Tags"
            >
              <Icon icon={Tag01Icon} className="shrink-0" />
              <span className="truncate">
                {activeTag ? activeTag.name : "Tags"}
              </span>
              {activeTagFilter ? (
                <span
                  role="button"
                  aria-label="Clear tag filter"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTagFilter(null);
                  }}
                  className="shrink-0 inline-flex size-4 items-center justify-center rounded-full hover:bg-primary/20 transition-colors"
                >
                  <Icon icon={Cancel01Icon} className="size-2.5" />
                </span>
              ) : null}
            </Button>
          </span>
        </PopoverTrigger>

        <PopoverContent className="w-60 gap-0 p-2">
          {/* Create row */}
          <div className="flex gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIconPickerOpen((v) => !v)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-muted/40 transition-colors hover:bg-muted"
                >
                  {SelectedIconComp && (
                    <Icon icon={SelectedIconComp} className="size-3.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Pick icon</TooltipContent>
            </Tooltip>

            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="New tag..."
              className="h-7 flex-1 rounded-lg border bg-muted/30 px-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:bg-background focus:ring-1 focus:ring-ring/40"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  aria-label="Create tag"
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
                >
                  <Icon icon={PlusSignIcon} className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Create tag</TooltipContent>
            </Tooltip>
          </div>

          {iconPickerOpen && (
            <div className="mt-2 grid grid-cols-5 gap-1 rounded-lg border bg-muted/20 p-1.5">
              {ICON_KEYS.map((key) => {
                const Comp = TAG_ICONS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    title={key.replace("Icon", "")}
                    onClick={() => {
                      setSelectedIcon(key);
                      setIconPickerOpen(false);
                    }}
                    className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
                      selectedIcon === key
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {Comp && <Icon icon={Comp} className="size-4" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tag list */}
          {tags.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {tags.map((tag) => {
                const IconComp = TAG_ICONS[tag.icon];
                const isFiltered = activeTagFilter === tag.id;
                const isRenaming = renamingId === tag.id;

                return (
                  <li key={tag.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        !isRenaming &&
                        setActiveTagFilter(
                          isFiltered ? null : (tag.id as TagID),
                        )
                      }
                      className={`flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors min-w-0 ${
                        isFiltered
                          ? "bg-primary/15 text-primary font-medium"
                          : "hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      {IconComp && (
                        <Icon icon={IconComp} className="size-3.5 shrink-0" />
                      )}
                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitRename();
                            }
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          onBlur={commitRename}
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 bg-transparent outline-none border-b border-border/60 text-sm"
                        />
                      ) : (
                        <span className="truncate">{tag.name}</span>
                      )}
                    </button>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Rename ${tag.name}`}
                            onClick={() => startRename(tag)}
                            className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Icon icon={Edit03Icon} className="size-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Rename</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Delete ${tag.name} tag`}
                            onClick={() => deleteTag(tag.id as TagID)}
                            className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Icon icon={Cancel01Icon} className="size-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Delete tag</TooltipContent>
                      </Tooltip>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
