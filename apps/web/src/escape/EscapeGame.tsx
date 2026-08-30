import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { BookOpenText, DoorOpen, Lightbulb, PackageOpen, X } from "lucide-react";
import type { EscapeClientStep, SessionSnapshot } from "@hemocase/shared";
import { ScoreTicker } from "../components/ScoreTicker";
import { formatTime } from "../lib/socket";
import { Hands, type HandGesture } from "./Hands";
import { PuzzleBody } from "./puzzles";
import { SceneBackdrop, sceneSpots } from "./scenes";

interface EscapeGameProps {
  code: string;
  token: string;
  snapshot: SessionSnapshot;
  socket: RefObject<Socket | null>;
}

const hintCostLabels = ["grátis", "−3 bases", "−8 bases"];

export default function EscapeGame({ code, token, snapshot, socket }: EscapeGameProps) {
  const escape = snapshot.escape;
  const [openStep, setOpenStep] = useState<EscapeClientStep>();
  const [gesture, setGesture] = useState<HandGesture>("idle");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "erro"; text: string }>();
  const [localHints, setLocalHints] = useState<Record<string, string[]>>({});
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [doorAnimating, setDoorAnimating] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const previousRoom = useRef<string>(undefined);
  const gestureTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Transição de porta quando a sala muda.
  useEffect(() => {
    const roomId = escape?.roomId;
    if (!roomId) return;
    if (previousRoom.current && previousRoom.current !== roomId) {
      setOpenStep(undefined);
      setNotebookOpen(false);
      setNoteDraft("");
      setDoorAnimating(true);
      const timer = setTimeout(() => setDoorAnimating(false), 1100);
      return () => clearTimeout(timer);
    }
    previousRoom.current = roomId;
  }, [escape?.roomId]);
  useEffect(() => { previousRoom.current = escape?.roomId; }, [escape?.roomId]);

  // Parallax pelo toque/mouse e pelo giroscópio quando existir.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const setVars = (x: number, y: number) => {
      scene.style.setProperty("--px", x.toFixed(3));
      scene.style.setProperty("--py", y.toFixed(3));
    };
    const onPointer = (event: PointerEvent) => {
      const rect = scene.getBoundingClientRect();
      setVars((event.clientX - rect.left) / rect.width - 0.5, (event.clientY - rect.top) / rect.height - 0.5);
    };
    const onTilt = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      setVars(Math.max(-0.5, Math.min(0.5, event.gamma / 60)), Math.max(-0.5, Math.min(0.5, (event.beta - 40) / 90)));
    };
    scene.addEventListener("pointermove", onPointer);
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      scene.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [escape?.roomId]);

  if (!escape) return null;

  function pulseGesture(next: HandGesture) {
    setGesture(next);
    clearTimeout(gestureTimer.current);
    gestureTimer.current = setTimeout(() => setGesture("idle"), 1100);
  }

  function submitAttempt(step: EscapeClientStep, answer: string[]) {
    setSending(true);
    setFeedback(undefined);
    socket.current?.emit("escape:attempt", { code, teamToken: token, stepId: step.id, answer }, (result: { ok: boolean; correct?: boolean; error?: string }) => {
      setSending(false);
      if (!result.ok) return setFeedback({ kind: "erro", text: result.error ?? "Tentativa não registrada." });
      if (result.correct) {
        setFeedback({ kind: "ok", text: "Mecanismo liberado." });
        setTimeout(() => { setOpenStep(undefined); setFeedback(undefined); }, 900);
      } else {
        setFeedback({ kind: "erro", text: "A SENTINELA recusou. Analisem de novo (−bases)." });
      }
    });
  }

  function askHint(step: EscapeClientStep) {
    const used = (escape!.revealedHints[step.id] ?? localHints[step.id] ?? []).length;
    if (used >= 3) return;
    socket.current?.emit("escape:hint", { code, teamToken: token, stepId: step.id, level: used + 1 }, (result: { ok: boolean; hint?: string; error?: string }) => {
      if (!result.ok || !result.hint) return setFeedback({ kind: "erro", text: result.error ?? "Dica indisponível." });
      setLocalHints((current) => ({ ...current, [step.id]: [...(current[step.id] ?? escape!.revealedHints[step.id] ?? []), result.hint!] }));
    });
  }

  function submitNote() {
    if (noteDraft.trim().length < 3) return;
    socket.current?.emit("escape:note", { code, teamToken: token, roomId: escape!.roomId, text: noteDraft.trim() }, (result: { ok: boolean; error?: string }) => {
      if (!result.ok) return setFeedback({ kind: "erro", text: result.error ?? "O prontuário não foi salvo." });
      setNotebookOpen(false);
      setNoteDraft("");
    });
  }

  /* ---------- Fases externas à corrida ---------- */

  if (snapshot.phase === "BRIEFING") {
    return (
      <section className="escape-briefing">
        <p className="eyebrow">Transmissão da SENTINELA</p>
        <h1 className="headline-rise">{escape.caseTitle}</h1>
        <p className="terminal-copy briefing-type">{escape.briefing}</p>
        <div className="briefing-meta"><span>{escape.patientLabel}</span><span>{snapshot.durationMin} minutos na corrida</span></div>
        <strong className="large-timer">{formatTime(snapshot.remainingMs)}</strong>
        <p className="puzzle-note">A porta da Antecâmara abre quando o briefing terminar.</p>
      </section>
    );
  }

  if (snapshot.phase === "DEBRIEF" || snapshot.phase === "FINISHED" || escape.finishedAt) {
    return (
      <section className="escape-finish">
        <p className="eyebrow">{escape.finishedAt ? "Vocês escaparam" : "Protocolo encerrado"}</p>
        <h1 className="headline-rise">{escape.finishedAt ? "A PORTA ABRIU." : "O TEMPO VENCEU DESTA VEZ."}</h1>
        {escape.debrief && (
          <div className="debrief-card">
            <strong>{escape.debrief.diagnosis}</strong>
            <span>{escape.debrief.route}</span>
          </div>
        )}
        <strong className="final-score"><ScoreTicker value={snapshot.score ?? 0} /><span>bases</span></strong>
        <ol>{snapshot.teams.map((team, index) => <li style={{ "--i": index } as React.CSSProperties} key={team.id}><span>{index + 1}. {team.name}</span><strong>{team.score}</strong></li>)}</ol>
      </section>
    );
  }

  /* ---------- A corrida ---------- */

  const room = escape.roomId;
  const spots = sceneSpots[room];
  const activeSpots = [escape.step, escape.optionalStep].filter((step): step is EscapeClientStep => Boolean(step));
  const usedHints = openStep ? (localHints[openStep.id] ?? escape.revealedHints[openStep.id] ?? []) : [];

  return (
    <section className={`escape-stage ${doorAnimating ? "is-entering" : ""}`}>
      <div className="escape-scene" ref={sceneRef} key={room}>
        <div className="scene-parallax scene-parallax--far"><SceneBackdrop roomId={room} /></div>
        <div className="scene-hotspots scene-parallax scene-parallax--near">
          {activeSpots.map((step) => {
            const spot = spots[step.object];
            if (!spot) return null;
            return (
              <button
                key={step.id}
                className={`hotspot ${step.optional ? "hotspot--optional" : ""}`}
                style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
                onClick={() => { pulseGesture("reach"); setOpenStep(step); setFeedback(undefined); }}
              >
                <i /><span>{spot.label}</span>
              </button>
            );
          })}
          {escape.noteRequired && (
            <button className="hotspot hotspot--door" style={{ left: "42%", top: "18%", width: "16%", height: "40%" }} onClick={() => setNotebookOpen(true)}>
              <i /><span><DoorOpen size={15} /> A porta espera o prontuário</span>
            </button>
          )}
        </div>
        <div className="scene-grade" />
        <Hands gesture={gesture} />
      </div>

      <header className="escape-hud">
        <div className="hud-room">
          <strong>{escape.roomName}</strong>
          <span>Sala {escape.roomIndex + 1}/{escape.roomCount} · mecanismo {Math.min(escape.stepIndex + 1, escape.mandatoryCount)}/{escape.mandatoryCount}</span>
        </div>
        <strong className={`hud-timer ${(snapshot.remainingMs ?? 999_999) < 5 * 60_000 ? "is-critical" : ""}`}>{formatTime(snapshot.remainingMs)}</strong>
        <div className="hud-bases"><span>bases</span><ScoreTicker value={snapshot.score ?? 0} /></div>
      </header>

      <p className="sentinela-line">{escape.roomIntro}</p>

      <footer className="escape-toolbar">
        <button className="button button--quiet" onClick={() => { setNoteDraft(escape.notes[room] ?? ""); setNotebookOpen(true); }}><BookOpenText size={17} /> Prontuário</button>
        <div className="inventory-strip" aria-label="Inventário">
          <PackageOpen size={16} />
          {escape.inventory.length ? escape.inventory.map((item) => <span key={item}>{item}</span>) : <span className="empty">vazio</span>}
        </div>
      </footer>

      {openStep && (
        <div className="detail-view" role="dialog" aria-label={openStep.title}>
          <div className="detail-card">
            <header>
              <div><p className="eyebrow">{openStep.optional ? "Arquivo de emergência" : escape.roomName}</p><h2>{openStep.title}</h2></div>
              <button className="icon-button" onClick={() => setOpenStep(undefined)} title="Voltar à sala"><X size={18} /></button>
            </header>
            <p className="detail-prompt">{openStep.prompt}</p>
            {openStep.evidence?.map((line) => <p className="evidence-line" key={line}>{line}</p>)}
            {escape.lockedUntilMs && openStep.type === "dial-safe" ? (
              <p className="alert-text">Cofre travado por erro. Liberação em {Math.ceil(escape.lockedUntilMs / 1000)} s.</p>
            ) : (
              <PuzzleBody step={openStep} sending={sending} onSubmit={(answer) => submitAttempt(openStep, answer)} onGesture={pulseGesture} />
            )}
            {feedback && <p className={feedback.kind === "ok" ? "success-text" : "alert-text"}>{feedback.text}</p>}
            <div className="hint-zone">
              {usedHints.map((hint, index) => <p key={index} className="hint-line"><Lightbulb size={14} /> {hint}</p>)}
              {usedHints.length < 3 && (
                <button className="text-button" onClick={() => askHint(openStep)}>
                  Pedir dica {usedHints.length + 1} ({hintCostLabels[usedHints.length]})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {notebookOpen && (
        <div className="detail-view" role="dialog" aria-label="Prontuário genético">
          <div className="detail-card">
            <header>
              <div><p className="eyebrow">{escape.patientLabel}</p><h2>Prontuário genético</h2></div>
              <button className="icon-button" onClick={() => setNotebookOpen(false)} title="Fechar"><X size={18} /></button>
            </header>
            {Object.entries(escape.notes).map(([roomId, text]) => roomId !== room && <p className="hint-line" key={roomId}><strong>{roomId}:</strong> {text}</p>)}
            <label className="field-label">Hipótese desta sala (obrigatória para abrir a porta)
              <textarea rows={3} maxLength={280} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="O que os achados desta sala dizem sobre o caso?" />
            </label>
            <button className="button button--danger button--full" disabled={noteDraft.trim().length < 3} onClick={submitNote}>Registrar no prontuário</button>
          </div>
        </div>
      )}
    </section>
  );
}
