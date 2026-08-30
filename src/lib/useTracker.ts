// Tiny wrapper the app calls; safe when the loader isn't mounted.
export function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = (window as any).__tcvTrack as
    | ((e: string, p?: Record<string, unknown>) => void)
    | undefined;
  try {
    fn?.(event, params);
  } catch {
    /* noop */
  }
}

export function useTracker() {
  return { track };
}
