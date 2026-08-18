import { useEffect, useRef, useState } from "react";

/** Pauses whenever the tab is hidden or the window loses focus. */
export function useAutoPause(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    const onBlur = () => setHidden(true);
    const onFocus = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  return hidden;
}

/** requestAnimationFrame loop with delta time; cleans itself up. */
export function useRafLoop(cb: (dt: number, t: number) => void, active: boolean) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const step = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      ref.current(dt, t);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
