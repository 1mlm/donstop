import { StorageGuard } from "@/components/StorageGuard";
import { GoogleCalendarProvider } from "@/cpns/calendar/GoogleCalendarProvider";
import { TODOStoreProvider } from "@/lib/store";
import { TooltipProvider } from "@/shadcn/ui/tooltip";
import CustomCursor from "./CustomCursor";

export function CustomProvider({ children }: { children: React.ReactNode }) {
  return (
    <TODOStoreProvider>
      <CustomCursor />
      <TooltipProvider>
        <StorageGuard>
          <GoogleCalendarProvider>{children}</GoogleCalendarProvider>
        </StorageGuard>
      </TooltipProvider>
    </TODOStoreProvider>
  );
}
