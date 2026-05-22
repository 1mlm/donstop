"use client";

import { Delete02Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/cpns/Icon";
import { useTODOStore } from "@/lib/store";
import { TODO_STORE_STORAGE_KEY } from "@/lib/store/store-model";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/ui/alert-dialog";

function downloadOldData() {
  try {
    const raw = localStorage.getItem(TODO_STORE_STORAGE_KEY);
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donstop-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}

export function DeprecatedDataModal() {
  const needsDataReset = useTODOStore((s) => s.needsDataReset);
  const wipeAllData = useTODOStore((s) => s.wipeAllData);

  return (
    <AlertDialog open={needsDataReset}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Data format changed</AlertDialogTitle>
          <AlertDialogDescription>
            Your saved data uses an old nested-task format that no longer
            exists. Download it as a backup if you want, then reset to start
            fresh.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <button
            type="button"
            onClick={downloadOldData}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Icon icon={Download01Icon} className="size-4" />
            Download my data
          </button>
          <AlertDialogAction variant="destructive" onClick={wipeAllData}>
            <Icon icon={Delete02Icon} className="size-4" />
            Reset everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
