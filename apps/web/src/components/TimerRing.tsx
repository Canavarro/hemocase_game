import { formatTime } from "../lib/socket";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Anel de progresso do cronômetro da questão. */
export function TimerRing({ remainingMs, durationSec }: { remainingMs: number | null; durationSec?: number }) {
  const total = (durationSec ?? 0) * 1000;
  const fraction = remainingMs !== null && total > 0 ? Math.max(0, Math.min(1, remainingMs / total)) : 0;
  const critical = remainingMs !== null && remainingMs < 10_000;
  return (
    <span className={`timer-ring ${critical ? "is-critical" : ""}`}>
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <circle className="timer-ring-track" cx="30" cy="30" r={RADIUS} />
        <circle
          className="timer-ring-fill"
          cx="30" cy="30" r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
        />
      </svg>
      <strong className="timer">{formatTime(remainingMs)}</strong>
    </span>
  );
}
