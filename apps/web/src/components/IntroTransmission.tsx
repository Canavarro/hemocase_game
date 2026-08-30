import { useRef, useState } from "react";
import { Volume2, VolumeX, SkipForward } from "lucide-react";

export function IntroTransmission({ onFinished }: { onFinished: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);

  async function start() {
    const video = videoRef.current;
    if (!video) return;
    setFailed(false);
    try {
      const playback = video.play();
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
      await playback;
      setPlaying(true);
    } catch {
      setPlaying(false);
      setFailed(true);
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <main className={`transmission ${playing ? "is-playing" : ""}`}>
      <video ref={videoRef} playsInline preload="auto" onEnded={onFinished} onError={() => setFailed(true)}>
        <source src="/assets/intro.mp4" type="video/mp4" />
      </video>
      {!playing && (
        <section className="transmission-copy">
          <p className="eyebrow">LAGEM apresenta</p>
          <h1>HEMOCASE</h1>
          <p className="blood-title">Código Vermelho</p>
          <p className="terminal-copy">Uma transmissão aguarda autorização. Mantenha o som ligado.</p>
          <button className="button button--danger" onClick={start}>Reproduzir a fita</button>
          <small>Contém áudio e luzes intermitentes moderadas.</small>
          {failed && <div className="media-fallback"><span>Falha ao reproduzir a transmissão.</span><button className="button button--quiet" onClick={onFinished}>Continuar sem vídeo</button></div>}
        </section>
      )}
      {playing && (
        <div className="transmission-tools">
          <span className="live-label"><i /> Transmissão recebida</span>
          <div>
            <button className="icon-button" onClick={toggleMute} title={muted ? "Ativar som" : "Silenciar"}>{muted ? <VolumeX /> : <Volume2 />}</button>
            <button className="icon-button" onClick={onFinished} title="Pular transmissão"><SkipForward /></button>
          </div>
        </div>
      )}
    </main>
  );
}
