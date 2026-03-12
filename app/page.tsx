"use client";
import { Note05Icon } from "@hugeicons/core-free-icons";
import { GoogleCalendarProvider } from "@/cpns/calendar/GoogleCalendarProvider";
import { Icon } from "@/cpns/Icon";
import MainBar from "@/cpns/MainBar";
import { AppCredits, AppTopBar, TopControls } from "@/cpns/page";
import { TaskBar } from "@/cpns/task";
import { TODOStoreProvider } from "@/lib/store";

export default function HomePage() {
  return (
    <GoogleCalendarProvider>
      <TODOStoreProvider>
        <div className="relative min-h-screen w-full overflow-x-hidden md:h-screen md:overflow-hidden">
          <div className="flex flex-col gap-3 p-3 pb-5 md:hidden">
            <div className="rounded-2xl border bg-card/70 p-2">
              <TopControls className="flex-wrap" />
            </div>

            <div className="h-[34vh] min-h-[15rem]">
              <MainBar />
            </div>

            <div className="h-[52vh] min-h-[22rem]">
              <div className="mb-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon icon={Note05Icon} className="size-4" />
                <span className="font-medium">Tasks</span>
              </div>
              <TaskBar />
            </div>

            <AppCredits className="justify-center border-t border-border/70 pt-3" />
          </div>

          <div className="relative hidden h-screen w-screen overflow-hidden pt-16 md:flex">
            <div className="flex h-full w-1/3 flex-col items-center p-3 pt-1">
              <div className="mb-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon icon={Note05Icon} className="size-4" />
                <span className="font-medium">Tasks</span>
              </div>
              <TaskBar />
            </div>
            <div className="flex h-full flex-1 flex-col items-center gap-3 p-3">
              <MainBar />
            </div>

            <div className="pointer-events-none absolute inset-x-8 top-[3.3rem] border-t-2 border-border/70" />
            <AppTopBar />
          </div>
        </div>
      </TODOStoreProvider>
    </GoogleCalendarProvider>
  );
}
