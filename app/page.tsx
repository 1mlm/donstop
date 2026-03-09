"use client";
import {
  CalendarRemove01Icon,
  Github,
  Settings01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import MainBar from "@/cpns/MainBar";
import { Separator } from "@/cpns/Separator";
import TaskBar from "@/cpns/TaskBar";
import { TODOStoreProvider } from "@/lib/store";
import { Note } from "../cpns/Note";

export default function TestPage() {
  return (
    <TODOStoreProvider>
      <div
        className={`w-screen h-screen flex
      *:p-3 *:h-full *:flex *:flex-col *:gap-3 *:items-center`}
      >
        {/* Task Bar */}
        <div className="w-1/3">
          <Note icon={Task01Icon} text="Tasks" className="pl-2" />
          <TaskBar />
        </div>
        {/* Main Content */}
        <div className="w-full">
          <MainBar />
          <div className="flex items-center justify-center gap-2">
            <Note text="1mlm/dontstop" icon={Github} variant="pill" />
            <Separator />
            <Note text="Settings" icon={Settings01Icon} variant="pill" />
            <Separator />
            <Note
              variant={"destructive"}
              icon={CalendarRemove01Icon}
              text="Connect Google Calendar"
            />
          </div>
        </div>
      </div>
    </TODOStoreProvider>
  );
}
