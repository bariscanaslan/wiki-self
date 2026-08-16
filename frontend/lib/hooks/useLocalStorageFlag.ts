import { useCallback, useEffect, useState } from "react";

export function useLocalStorageFlag(storageKey: string, defaultValue: boolean) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) {
      return;
    }
    // One-time hydrate from localStorage after mount (SSR has no access to it, so the
    // default value is used for the initial render to avoid a hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(stored === "true");
  }, [storageKey]);

  const setPersisted = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: boolean) => boolean)(prev) : next;
        window.localStorage.setItem(storageKey, String(resolved));
        return resolved;
      });
    },
    [storageKey],
  );

  return [value, setPersisted] as const;
}
