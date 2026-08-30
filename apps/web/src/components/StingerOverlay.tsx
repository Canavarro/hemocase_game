import { Player } from "@remotion/player";
import { PhaseStinger, STINGER_DURATION, STINGER_FPS } from "../remotion/compositions";

/** Overlay de tela cheia com a vinheta Remotion de mudança de fase. */
export default function StingerOverlay({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="stinger-overlay" aria-hidden="true">
      <Player
        component={PhaseStinger}
        inputProps={{ label, sub }}
        durationInFrames={STINGER_DURATION}
        fps={STINGER_FPS}
        compositionWidth={1920}
        compositionHeight={1080}
        autoPlay
        controls={false}
        clickToPlay={false}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
