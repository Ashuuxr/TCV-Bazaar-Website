import { useEffect, useState } from "react";

/** Returns true after the first client-side render. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}