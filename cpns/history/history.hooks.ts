import { useEffect, useState } from "react";

export function useHistoryNowMsEffect() {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalID = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalID);
    };
  }, []);

  return nowMs;
}
