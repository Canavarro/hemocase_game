import { useEffect, useRef, useState } from "react";

/** Número animado: conta do valor anterior até o atual e pulsa ao mudar. */
export function ScoreTicker({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const [bump, setBump] = useState(false);
  const shownRef = useRef(value);
  const raf = useRef(0);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    const startedAt = performance.now();
    const duration = 700;
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from + (value - from) * eased);
      shownRef.current = next;
      setShown(next);
      setBump(t < 1);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <span className={`score-ticker ${bump ? "is-bumping" : ""}`}>{shown}</span>;
}
