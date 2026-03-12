import { PaintBoardIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/cpns/Icon";
import { cn } from "@/shadcn/lib/utils";
import { type PaletteColor, TAILWIND_500_COLORS } from "./settings.constants";
import { COLOR_PREVIEW_TEXT_CLASS } from "./settings.styles";
import { applyPrimaryColor, writeStoredPrimaryColor } from "./settings.utils";

export function PrimaryColorSection({
  primaryColor,
  setPrimaryColor,
  onPrimaryColorChanged,
}: {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  onPrimaryColorChanged?: (color: string) => void;
}) {
  const selectedPrimaryColor =
    TAILWIND_500_COLORS.find((color) => color.value === primaryColor) ?? null;

  return (
    <div className="space-y-2 rounded-md border px-2.5 py-2">
      <div className="flex items-start gap-2">
        <Icon
          icon={PaintBoardIcon}
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium leading-none whitespace-nowrap">
            Primary color
          </p>
          <span
            className={cn(
              COLOR_PREVIEW_TEXT_CLASS,
              "inline-flex gap-1 items-center",
            )}
            style={{ color: primaryColor }}
          >
            {selectedPrimaryColor?.name ?? "Custom"}
            <span
              style={{ backgroundColor: primaryColor }}
              className={`text-primary-foreground px-1 rounded-sm`}
            >
              {primaryColor}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-11 gap-1 overflow-visible">
        {TAILWIND_500_COLORS.map((color) => (
          <PrimaryColorSwatch
            key={color.name}
            color={color}
            isSelected={color.value === primaryColor}
            onSelect={setPrimaryColor}
            onPrimaryColorChanged={onPrimaryColorChanged}
          />
        ))}
      </div>
    </div>
  );
}

function PrimaryColorSwatch({
  color,
  isSelected,
  onSelect,
  onPrimaryColorChanged,
}: {
  color: PaletteColor;
  isSelected: boolean;
  onSelect: (color: string) => void;
  onPrimaryColorChanged?: (color: string) => void;
}) {
  return (
    <button
      type="button"
      title={color.name}
      aria-label={`Set primary color to ${color.name}`}
      onClick={() => {
        onSelect(color.value);
        applyPrimaryColor(color.value);
        writeStoredPrimaryColor(color.value);
        onPrimaryColorChanged?.(color.value);
      }}
      className={`relative size-5 rounded-md transition-all hover:scale-105 ${
        isSelected
          ? "z-10 scale-[1.2] border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.25),0_3px_8px_rgba(0,0,0,0.45)]"
          : "border border-white/20"
      }`}
      style={{ backgroundColor: color.value }}
    />
  );
}
