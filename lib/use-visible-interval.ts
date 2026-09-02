'use client';

import { useEffect, useRef } from 'react';

/**
 * Interval hook that pauses while the tab is hidden.
 *
 * - Runs `callback` every `delayMs` ms only when `document.visibilityState`
 *   is 'visible'. Nothing fires on a backgrounded tab, so a laptop lid or a
 *   pinned-tab in the background doesn't hammer our lambdas / Supabase pooler.
 * - Tears down the interval on `visibilitychange → hidden` and re-arms on
 *   `visibilitychange → visible`. The re-arm also fires ONE immediate refresh
 *   so a user returning to the tab sees fresh data without waiting a full tick.
 * - Passing `delayMs = null` (or `enabled = false`) disables everything and
 *   cleans up existing timers — useful for gating on session/auth.
 *
 * The callback ref is stable across renders — you can pass an inline closure
 * without re-arming the timer on every render.
 */
export function useVisibleInterval(
  callback: () => void,
  delayMs: number | null,
  enabled: boolean = true,
): void {
  const savedCallback = useRef(callback);

  // Keep the latest callback without re-arming the timer.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || delayMs == null || delayMs <= 0) return;
    if (typeof document === 'undefined') return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const arm = () => {
      if (intervalId != null) return;
      intervalId = setInterval(() => {
        // Guard here too — a fast hide-then-fire race could otherwise slip
        // through between the visibilitychange event and clearInterval.
        if (document.visibilityState === 'visible') {
          savedCallback.current();
        }
      }, delayMs);
    };

    const disarm = () => {
      if (intervalId == null) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // One immediate refresh on tab-visible transition, then re-arm.
        savedCallback.current();
        arm();
      } else {
        disarm();
      }
    };

    if (document.visibilityState === 'visible') arm();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      disarm();
    };
  }, [delayMs, enabled]);
}

export default useVisibleInterval;
