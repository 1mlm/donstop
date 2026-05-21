import { useEffect, useState } from "react";
import { NoStorageFallback } from "@/cpns/NoStorageFallback";
import { isLocalStorageAvailable } from "@/lib/safe-local-storage";

export function StorageGuard({ children }: { children: React.ReactNode }) {
  const [storageOk, setStorageOk] = useState<boolean | null>(null);

  useEffect(() => {
    setStorageOk(isLocalStorageAvailable());
  }, []);

  if (storageOk === null) return null;
  if (!storageOk) return <NoStorageFallback />;
  return <>{children}</>;
}
