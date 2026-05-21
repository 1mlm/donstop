"use client";

import {
  Cancel01Icon,
  PlusSignIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/cpns/Icon";
import { type TagID, useTODOStore } from "@/lib/store";
import { Button } from "@/shadcn/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shadcn/ui/popover";
import { TAG_ICONS } from "./tag-icons";

const ICON_KEYS = Object.keys(TAG_ICONS) as (keyof typeof TAG_ICONS)[];

export default function TagsButton() {
  const tags = useTODOStore((s) => s.tags);
  const activeTagFilter = useTODOStore((s) => s.activeTagFilter);
  const createTag = useTODOStore((s) => s.createTag);
  const deleteTag = useTODOStore((s) => s.deleteTag);
  const setActiveTagFilter = useTODOStore((s) => s.setActiveTagFilter);

  const [newName, setNewName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>(ICON_KEYS[0]);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createTag(name, selectedIcon);
    setNewName("");
    setSelectedIcon(ICON_KEYS[0]);
  };

  const SelectedIconComp = TAG_ICONS[selectedIcon];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="inline-flex cursor-pointer-custom">
          <Button
            variant="outline"
            size="sm"
            className={`rounded-full squircle squircle-full px-3 ${activeTagFilter ? "border-primary/50 bg-primary/10 text-primary" : ""}`}
            aria-label="Tags"
          >
            <Icon icon={Tag01Icon} />
            Tags
            {activeTagFilter ? (
              <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                1
              </span>
            ) : null}
          </Button>
        </span>
      </PopoverTrigger>

      <PopoverContent className="w-72">
        <PopoverHeader>
          <PopoverTitle>Tags</PopoverTitle>
        </PopoverHeader>

        {activeTagFilter ? (
          <button
            type="button"
            onClick={() => setActiveTagFilter(null)}
            className="mb-2 flex w-full items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/8 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
          >
            <Icon icon={Cancel01Icon} className="size-3 shrink-0" />
            Clear filter
          </button>
        ) : null}

        {tags.length === 0 ? (
          <p className="mb-2 text-xs text-muted-foreground">No tags yet.</p>
        ) : (
          <ul className="mb-3 space-y-1">
            {tags.map((tag) => {
              const IconComp = TAG_ICONS[tag.icon];
              const isFiltered = activeTagFilter === tag.id;
              return (
                <li key={tag.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTagFilter(isFiltered ? null : (tag.id as TagID))
                    }
                    className={`flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors ${
                      isFiltered
                        ? "bg-primary/15 text-primary font-medium"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    {IconComp && (
                      <Icon icon={IconComp} className="size-3.5 shrink-0" />
                    )}
                    <span className="truncate">{tag.name}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${tag.name} tag`}
                    onClick={() => deleteTag(tag.id as TagID)}
                    className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Icon icon={Cancel01Icon} className="size-3" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Create tag
          </p>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setIconPickerOpen((v) => !v)}
              title="Pick icon"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/40 transition-colors hover:bg-muted"
            >
              {SelectedIconComp && (
                <Icon icon={SelectedIconComp} className="size-4" />
              )}
            </button>

            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="Tag name..."
              className="h-8 flex-1 rounded-lg border bg-muted/30 px-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:bg-background focus:ring-1 focus:ring-ring/40"
            />

            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              aria-label="Create tag"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
            >
              <Icon icon={PlusSignIcon} className="size-4" />
            </button>
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
