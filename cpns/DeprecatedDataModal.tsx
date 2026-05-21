"use client";

import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/cpns/Icon";
import { useTODOStore } from "@/lib/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/ui/alert-dialog";

export function DeprecatedDataModal() {
  const needsDataReset = useTODOStore((s) => s.needsDataReset);
  const wipeAllData = useTODOStore((s) => s.wipeAllData);
  const dismissDataReset = useTODOStore((s) => s.dismissDataReset);

  return (
    <AlertDialog open={needsDataReset}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-1 flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
            <Icon icon={AlertCircleIcon} className="size-5" />
          </div>
          <AlertDialogTitle>Data format changed</AlertDialogTitle>
          <AlertDialogDescription>
            Your saved data uses an old nested-task format that no longer
            exists. Reset everything to start fresh — or keep your tasks as-is
            (nesting will be ignored).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={dismissDataReset}>
            Keep my data
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={wipeAllData}>
            Reset everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
