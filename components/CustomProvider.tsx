import { StorageGuard } from "@/components/StorageGuard";
import { GoogleCalendarProvider } from "@/cpns/calendar/GoogleCalendarProvider";
import { TODOStoreProvider } from "@/lib/store";
import { TooltipProvider } from "@/shadcn/ui/tooltip";

export function CustomProvider({ children }: { children: React.ReactNode }) {
  return (
    <TODOStoreProvider>
      <TooltipProvider>
        <StorageGuard>
          <GoogleCalendarProvider>{children}</GoogleCalendarProvider>
        </StorageGuard>
      </TooltipProvider>
    </TODOStoreProvider>
  );
}
