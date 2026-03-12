import { useEffect, useState } from "react";
import { NoStorageFallback } from "@/components/NoStorageFallback";
import { isLocalStorageAvailable } from "@/lib/safe-local-storage";

export function StorageGuard({ children }: { children: React.ReactNode }) {
  const [storageOk, setStorageOk] = useState<boolean | null>(null);

  useEffect(() => {
    setStorageOk(isLocalStorageAvailable());
  }, []);

  if (storageOk === null) return null; // Optionally show a spinner
  if (!storageOk) return <NoStorageFallback />;
  return <>{children}</>;
}
