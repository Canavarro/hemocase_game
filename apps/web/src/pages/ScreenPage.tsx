import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Activity, CheckCircle2, Users } from "lucide-react";
import type { Phase } from "@hemocase/shared";
import { IntroTransmission } from "../components/IntroTransmission";
import { ConnectionStatus } from "../components/Status";
import { formatTime, useSession } from "../lib/socket";

const StingerOverlay = lazy(() => import("../components/StingerOverlay"));
const RevealCinema = lazy(() => import("../components/RevealCinema"));

const reduceMotion = typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const stingerSubtitles: Partial<Record<Phase, string>> = {
  FOCUS_CHECK: "A sala observa quem desvia o olhar",
  WARMUP: "Provem que merecem as evidências",
  CASE_INVESTIGATION: "Quatro pacientes. Quatro mecanismos.",
  BLITZ: "Respondam antes que o sinal caia",
  FINAL_CHAIN: "Fechem a rota molecular",
  REVEAL: "DNA → RNA → proteína → função → fenótipo",
  FINISHED: "O protocolo lembra de tudo",
};

export function ScreenPage({ code }: { code: string }) {
  const introKey = `hemocase:intro:${code}`;
  const [introDone, setIntroDone] = useState(sessionStorage.getItem(introKey) === "done");
  const { snapshot, connected, error } = useSession("screen", code);
  const [stinger, setStinger] = useState<{ label: string; sub?: string } | null>(null);
  const previousPhase = useRef<Phase>(undefined);

  const phase = snapshot?.phase;
  const phaseLabel = snapshot?.phaseLabel;

  useEffect(() => {
    if (!phase || !phaseLabel) return;
    const changed = previousPhase.current !== undefined && previousPhase.current !== phase;
    previousPhase.current = phase;
    if (!changed || phase === "LOBBY" || phase === "PAUSED" || reduceMotion) return;
    setStinger({ label: phaseLabel, sub: stingerSubtitles[phase] });
    const timer = setTimeout(() => setStinger(null), 2700);
    return () => clearTimeout(timer);
  }, [phase, phaseLabel]);

  function finishIntro() {
    sessionStorage.setItem(introKey, "done");
    setIntroDone(true);
  }

  if (!introDone) return <IntroTransmission onFinished={finishIntro} />;
  if (error) return <main className="centered-screen"><p className="eyebrow">Sinal interrompido</p><h1>Sessão indisponível</h1><p>{error}</p></main>;

  const showRanking = phase === "REVEAL" || phase === "DEBRIEF" || phase === "FINISHED";
  const cinemaPhase = phase === "REVEAL" || phase === "DEBRIEF";
  return (
    <main className="public-screen shell">
      {stinger && <Suspense fallback={null}><StingerOverlay label={stinger.label} sub={stinger.sub} /></Suspense>}
      <header className="projector-header">
        <div className="projector-brand"><strong>HEMOCASE</strong><span>Código Vermelho</span></div>
        <div className="phase-chip"><Activity size={16} /> {snapshot?.phaseLabel ?? "Sincronizando"}</div>
        <ConnectionStatus connected={connected} />
      </header>

      {phase === "LOBBY" && (
        <section className="lobby-layout">
          <div className="lobby-copy">
            <p className="eyebrow">Sala de contenção aberta</p>
            <h1 className="headline-rise">ENTREM.<br />O TEMPO AINDA NÃO COMEÇOU.</h1>
            <p>Escaneie o código, dê um nome à equipe e mantenha um único celular conectado.</p>
            <div className="session-code"><span>Código da sessão</span><strong>{code}</strong></div>
          </div>
          <div className="qr-zone">
            <img src={`/api/sessions/${code}/qr`} alt={`QR Code para entrar na sessão ${code}`} />
            <code>{snapshot?.joinUrl}</code>
            <span><Users size={18} /> {snapshot?.teams.length ?? 0} equipes conectadas</span>
          </div>
          <div className="lobby-teams">
            {snapshot?.teams.map((team) => <span className="team-chip-enter" key={team.id}><i className={team.connected ? "online-dot" : "offline-dot"} />{team.name}</span>)}
          </div>
        </section>
      )}

      {snapshot?.mode === "ESCAPE" && (phase === "BRIEFING" || phase === "ESCAPE" || phase === "PAUSED") && (
        <section className="escape-screen">
          <div className="escape-screen-main">
            <p className="eyebrow">{snapshot.phaseLabel}</p>
            <h1 className="headline-rise">{phase === "BRIEFING" ? "O LABORATÓRIO SERÁ SELADO." : phase === "ESCAPE" ? "CINCO ALAS. UMA ROTA MOLECULAR." : "QUEM ESCAPOU, ESCAPOU PELO MECANISMO."}</h1>
            <strong className="projector-timer projector-timer--escape">{formatTime(snapshot.remainingMs)}</strong>
            <div className="escape-lanes">
              {snapshot.escapeHost?.map((row) => (
                <div key={row.teamId} className={`escape-lane ${row.finishedAt ? "is-out" : ""}`}>
                  <span>{row.name}{row.finishedAt ? " · ESCAPOU" : ""}</span>
                  <div className="lane-track">
                    {["R0", "R1", "R2", "R3", "R4", "R5"].map((roomId, index) => (
                      <i key={roomId} className={`lane-cell ${row.finishedAt || roomId < row.roomId ? "is-done" : roomId === row.roomId ? "is-here" : ""}`} title={roomId}>{index + 1}</i>
                    ))}
                  </div>
                  <b>{row.bases} bases</b>
                </div>
              ))}
            </div>
          </div>
          <aside className="escape-screen-feed">
            <p className="eyebrow">Registro da SENTINELA</p>
            {snapshot.escapeEvents?.slice(0, 10).map((event) => <p key={event.at + event.text}>{event.text}</p>)}
            {!snapshot.escapeEvents?.length && <p className="empty-state">O laboratório está silencioso.</p>}
          </aside>
        </section>
      )}

      {snapshot?.mode !== "ESCAPE" && phase && phase !== "LOBBY" && phase !== "REVEAL" && phase !== "FINISHED" && (
        <section className="mission-screen">
          <div className="mission-meta"><span>{snapshot?.questionCount ? `Mecanismo ${snapshot.questionIndex + 1} de ${snapshot.questionCount}` : "Protocolo coletivo"}</span><strong className="projector-timer">{formatTime(snapshot?.remainingMs ?? null)}</strong></div>
          <div className="mission-copy" key={`${phase}-${snapshot?.questionIndex ?? 0}`}>
            <p className="eyebrow">{snapshot?.phaseLabel}</p>
            <h1 className="headline-rise">{phase === "FOCUS_CHECK" ? "A SALA OBSERVA QUEM DESVIA O OLHAR." : snapshot?.question?.title ?? "AS EQUIPES ESTÃO SOB TESTE."}</h1>
            <p>{phase === "FOCUS_CHECK" ? "Ativem o modo de foco. Sair da página durante uma rodada deixa um registro." : snapshot?.question?.prompt ?? "Cada equipe recebeu evidências diferentes. O próximo mecanismo só será liberado quando o Host decidir."}</p>
          </div>
          <div className="progress-board">
            {snapshot?.teams.map((team) => <div key={team.id} className={team.answered ? "progress-team is-done" : "progress-team"}><span>{team.name}</span>{team.answered ? <CheckCircle2 size={20} /> : <i />}</div>)}
          </div>
        </section>
      )}

      {showRanking && (
        <section className="reveal-screen">
          <div>
            <p className="eyebrow">A verdade estava na cadeia</p>
            {cinemaPhase && !reduceMotion
              ? <Suspense fallback={<h1 className="headline-rise">DNA → RNA → PROTEÍNA → FUNÇÃO → FENÓTIPO</h1>}><RevealCinema /></Suspense>
              : <h1 className="headline-rise">{phase === "FINISHED" ? "PROTOCOLO ENCERRADO" : "DNA → RNA → PROTEÍNA → FUNÇÃO → FENÓTIPO"}</h1>}
            <div className="reveal-list">{snapshot?.reveal?.map((row, index) => <div style={{ "--i": index } as React.CSSProperties} key={row.title}><strong>{row.title}</strong><span>{row.explanation}</span></div>)}</div>
          </div>
          <ol className="ranking">
            {snapshot?.teams.map((team, index) => <li style={{ "--i": index } as React.CSSProperties} className={index === 0 ? "is-champion" : undefined} key={team.id}><span>{index + 1}</span><strong>{team.name}</strong><b>{team.score} bases</b></li>)}
          </ol>
        </section>
      )}
    </main>
  );
}
