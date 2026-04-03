import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

type Serializable = string | number | boolean;

/** Widen literal types: 0 → number, "foo" → string, true → boolean */
type Widen<T> = T extends number
  ? number
  : T extends boolean
    ? boolean
    : T extends string
      ? string
      : T;

interface UseUrlStateOptions<T> {
  /** Custom serializer. Default: String(value) */
  serialize?: (value: T) => string;
  /** Custom deserializer. Default: inferred from defaultValue type */
  deserialize?: (raw: string) => T;
  /** Use replaceState instead of pushState. Default: true */
  replace?: boolean;
}

/**
 * Drop-in replacement for useState that syncs to URL search params.
 *
 * - When value === defaultValue, the param is removed from the URL (clean URLs).
 * - Uses replaceState by default so tab/filter changes don't pollute browser history.
 * - Multiple useUrlState calls on the same page share the same URLSearchParams.
 *
 * @example
 * const [tab, setTab] = useUrlState("tab", "profile");
 * // URL: /settings           (default, no param)
 * // URL: /settings?tab=keys  (non-default)
 */
export function useUrlState<T extends Serializable>(
  key: string,
  defaultValue: T,
  options?: UseUrlStateOptions<Widen<T>>,
): [Widen<T>, (value: Widen<T> | ((prev: Widen<T>) => Widen<T>)) => void] {
  type W = Widen<T>;
  const [searchParams, setSearchParams] = useSearchParams();
  const replace = options?.replace ?? true;
  const def = defaultValue as unknown as W;

  const deserialize = useMemo(() => {
    if (options?.deserialize) return options.deserialize;
    if (typeof defaultValue === "number") {
      return (raw: string) => {
        const n = Number(raw);
        return (Number.isFinite(n) ? n : defaultValue) as W;
      };
    }
    if (typeof defaultValue === "boolean") {
      return (raw: string) => (raw === "1" || raw === "true") as unknown as W;
    }
    return (raw: string) => raw as unknown as W;
  }, [defaultValue, options?.deserialize]);

  const serialize = useMemo(() => {
    if (options?.serialize) return options.serialize;
    if (typeof defaultValue === "boolean") {
      return (value: W) => (value ? "1" : "0");
    }
    return (value: W) => String(value);
  }, [defaultValue, options?.serialize]);

  // Read current value from URL, fallback to default
  const rawValue = searchParams.get(key);
  const value: W = rawValue !== null ? deserialize(rawValue) : def;

  const setValue = useCallback(
    (next: W | ((prev: W) => W)) => {
      setSearchParams(
        (prev) => {
          const currentRaw = prev.get(key);
          const currentValue: W =
            currentRaw !== null ? deserialize(currentRaw) : def;
          const nextValue =
            typeof next === "function"
              ? (next as (prev: W) => W)(currentValue)
              : next;

          const updated = new URLSearchParams(prev);
          if (nextValue === def) {
            updated.delete(key);
          } else {
            updated.set(key, serialize(nextValue));
          }
          return updated;
        },
        { replace },
      );
    },
    [key, def, serialize, deserialize, setSearchParams, replace],
  );

  return [value, setValue];
}
