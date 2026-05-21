import { AlertDiamondIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/cpns/Icon";
import { cn } from "@/shadcn/lib/utils";

export function NoStorageFallback() {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background text-foreground text-center gap-6 p-8",
        "w-screen h-screen overflow-hidden",
      )}
      style={{ pointerEvents: "all" }}
    >
      <Icon icon={AlertDiamondIcon} className="size-16 text-destructive" />
      <div>
        <h1 className="text-2xl font-bold mb-2">Storage Unavailable</h1>
        <p className="max-w-md text-base opacity-80">
          Your device does not provide access to storage information.
          <br />
          Therefore this app cannot store your tasks, history, trash, or
          settings.
          <br />
          Please change your privacy settings before refreshing this website.
        </p>
      </div>
    </div>
  );
}
