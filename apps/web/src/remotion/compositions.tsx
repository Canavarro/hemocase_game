import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const STINGER_DURATION = 78;
export const STINGER_FPS = 30;
export const REVEAL_DURATION = 240;
export const REVEAL_FPS = 30;

const mono = 'ui-monospace, "Cascadia Mono", Consolas, monospace';
const sans = 'Inter, ui-sans-serif, system-ui, sans-serif';

/** Vinheta exibida no projetor a cada mudança de fase. */
export function PhaseStinger({ label, sub }: { label: string; sub?: string }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slam = spring({ frame, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const scale = interpolate(slam, [0, 1], [2.6, 1]);
  const barW = interpolate(spring({ frame: frame - 4, fps, config: { damping: 20 } }), [0, 1], [0, 100]);
  const subIn = spring({ frame: frame - 14, fps, config: { damping: 200 } });
  const out = interpolate(frame, [durationInFrames - 14, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const flash = interpolate(frame, [0, 3, 10], [0.55, 0.28, 0], { extrapolateRight: "clamp" });
  const jitter = frame < 8 ? Math.sin(frame * 31) * (8 - frame) * 0.7 : 0;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "rgba(4, 5, 5, .88)", opacity: out, fontFamily: sans }}>
      <AbsoluteFill style={{ background: `rgba(167, 16, 23, ${flash})` }} />
      <AbsoluteFill style={{
        background: "repeating-linear-gradient(0deg, rgba(255,255,255,.028) 0 2px, transparent 2px 5px)",
        opacity: 0.6,
      }} />
      <div style={{ textAlign: "center", transform: `translateX(${jitter}px)` }}>
        <div style={{
          margin: "0 auto 34px", height: 4, width: `${barW * 5.2}px`,
          background: "#df3035", boxShadow: "0 0 24px rgba(223,48,53,.8)",
        }} />
        <h1 style={{
          margin: 0, color: "#e4e1d7", fontSize: 132, fontWeight: 900, lineHeight: 0.9,
          letterSpacing: interpolate(slam, [0, 1], [26, 2]),
          textTransform: "uppercase", transform: `scale(${scale})`,
          textShadow: "6px 6px 0 rgba(167,16,23,.5), 0 0 60px rgba(223,48,53,.35)",
        }}>
          {label}
        </h1>
        {sub && (
          <p style={{
            margin: "30px 0 0", color: "#9b9b93", fontFamily: mono, fontSize: 30,
            letterSpacing: 6, textTransform: "uppercase",
            opacity: subIn, transform: `translateY(${interpolate(subIn, [0, 1], [18, 0])}px)`,
          }}>
            {sub}
          </p>
        )}
        <div style={{
          margin: "38px auto 0", height: 4, width: `${barW * 5.2}px`,
          background: "#19a7a6", boxShadow: "0 0 24px rgba(25,167,166,.7)",
        }} />
      </div>
    </AbsoluteFill>
  );
}

const CHAIN = ["DNA", "RNA", "PROTEÍNA", "FUNÇÃO", "FENÓTIPO"];
const STEP_EVERY = 26;

/** Cadeia molecular animada da fase de revelação. */
export function RevealChain() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tagIn = spring({ frame: frame - CHAIN.length * STEP_EVERY - 14, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "transparent", fontFamily: sans }}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: 18, padding: 40 }}>
        {CHAIN.map((step, index) => {
          const at = index * STEP_EVERY;
          const pop = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 150 } });
          const arrow = spring({ frame: frame - at - 14, fps, config: { damping: 24 } });
          const isLast = index === CHAIN.length - 1;
          return (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{
                display: "inline-block", padding: "18px 30px",
                border: `3px solid ${isLast ? "#df3035" : "#19a7a6"}`,
                color: isLast ? "#ff8f93" : "#e4e1d7",
                background: "rgba(9, 11, 11, .82)",
                fontSize: 54, fontWeight: 900, letterSpacing: 2,
                opacity: pop,
                transform: `scale(${interpolate(pop, [0, 1], [0.4, 1])}) translateY(${interpolate(pop, [0, 1], [40, 0])}px)`,
                boxShadow: isLast ? "0 0 42px rgba(223,48,53,.35)" : "0 0 28px rgba(25,167,166,.18)",
              }}>
                {step}
              </span>
              {!isLast && (
                <span style={{
                  color: "#9b9b93", fontSize: 46, fontWeight: 700,
                  opacity: arrow, transform: `translateX(${interpolate(arrow, [0, 1], [-14, 0])}px)`,
                }}>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p style={{
        margin: 0, color: "#9b9b93", fontFamily: mono, fontSize: 30, letterSpacing: 5,
        textTransform: "uppercase", opacity: tagIn,
        transform: `translateY(${interpolate(tagIn, [0, 1], [16, 0])}px)`,
      }}>
        Esse foi o caminho que vocês percorreram hoje.
      </p>
    </AbsoluteFill>
  );
}
