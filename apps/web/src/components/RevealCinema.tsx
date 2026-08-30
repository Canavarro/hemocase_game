import { Player } from "@remotion/player";
import { RevealChain, REVEAL_DURATION, REVEAL_FPS } from "../remotion/compositions";

/** Cadeia molecular animada (Remotion) exibida na fase de revelação do projetor. */
export default function RevealCinema() {
  return (
    <div className="reveal-cinema" aria-label="DNA, RNA, proteína, função, fenótipo">
      <Player
        component={RevealChain}
        durationInFrames={REVEAL_DURATION}
        fps={REVEAL_FPS}
        compositionWidth={1920}
        compositionHeight={560}
        autoPlay
        controls={false}
        clickToPlay={false}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
