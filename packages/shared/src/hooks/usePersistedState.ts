import { useState, useEffect } from "react";

/**
 * useState that syncs to sessionStorage. Survives page refresh within the same tab.
 *
 * @example
 * const [draft, setDraft] = usePersistedState("scenario_draft", { title: "", context: "" });
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved) as T;
      }
    } catch {
      // Ignore parse errors, use initial
    }
    return initial;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota errors
    }
  }, [key, value]);

  return [value, setValue];
}

/** Remove a persisted state entry from sessionStorage. */
export function clearPersistedState(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore
  }
}
