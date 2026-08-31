import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { BookOpenText, DoorOpen, Eye, EyeOff, Lightbulb, PackageOpen, Undo2, X } from "lucide-react";
import { ESCAPE_REVIEW_COST, escapeRoomIds, type EscapeClientStep, type EscapePuzzleType, type EscapeRoomId, type SessionSnapshot } from "@hemocase/shared";
import { ScoreTicker } from "../components/ScoreTicker";
import { formatTime } from "../lib/socket";
import { ArchivistCameo, GhostHint } from "./atmosphere";
import { DoorTransition } from "./DoorTransition";
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

/** Erros viram consequência narrativa, não um "ERRADO" seco. */
const wrongAttemptLines: Partial<Record<EscapePuzzleType, string>> = {
  "microscope": "A lâmina errada embaça a objetiva. A SENTINELA registra a contaminação (−bases).",
  "code": "O teclado pisca vermelho e recusa a combinação (−bases).",
  "board-select": "O quadro rejeita o conjunto: há achados que não pertencem a este paciente (−bases).",
  "assemble": "As peças não se encaixam — a estrutura desaba na bancada (−bases).",
  "chain-fill": "A cadeia não fecha; o painel apaga as lacunas (−bases).",
  "mechanism-fill": "A frase não se sustenta; o giz se parte no quadro (−bases).",
  "sequence-spot": "Alinhamento recusado: o códon apontado é idêntico à referência (−bases).",
  "inheritance": "O heredograma não confirma esse padrão (−bases).",
  "family-question": "O interfone devolve um silêncio constrangedor (−bases).",
  "dial-safe": "MUTAÇÃO DELETÉRIA. O cofre trava os seletores (−5 bases, 45 s).",
};

function readVisualHelp(): boolean {
  try { return localStorage.getItem("hemocase:ajuda-visual") !== "off"; } catch { return true; }
}

export default function EscapeGame({ code, token, snapshot, socket }: EscapeGameProps) {
  const escape = snapshot.escape;
  const [openStep, setOpenStep] = useState<EscapeClientStep>();
  const [gesture, setGesture] = useState<HandGesture>("idle");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "erro"; text: string }>();
  const [localHints, setLocalHints] = useState<Record<string, string[]>>({});
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [transition, setTransition] = useState<{ name: string; back: boolean }>();
  const [visualHelp, setVisualHelp] = useState(readVisualHelp);
  const [ghost, setGhost] = useState<{ x: number; y: number }>();
  const [archivist, setArchivist] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const previousRoom = useRef<string>(undefined);
  const gestureTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const guidedRooms = useRef(new Set<string>());
  const archivistSeen = useRef(false);

  function toggleVisualHelp() {
    setVisualHelp((current) => {
      try { localStorage.setItem("hemocase:ajuda-visual", current ? "off" : "on"); } catch { /* armazenamento indisponível */ }
      return !current;
    });
  }

  /** O Arquivista aparece UMA vez por partida, de relance. */
  function maybeSummonArchivist(chance: number) {
    if (archivistSeen.current || Math.random() > chance) return;
    archivistSeen.current = true;
    setArchivist(true);
    setTimeout(() => setArchivist(false), 4600);
  }

  // Transição de porta (abrir + atravessar) quando a sala exibida muda.
  useEffect(() => {
    const roomId = escape?.roomId;
    if (!roomId) return;
    const previous = previousRoom.current;
    previousRoom.current = roomId;
    if (previous && previous !== roomId) {
      setOpenStep(undefined);
      setNotebookOpen(false);
      setNoteDraft("");
      const back = escapeRoomIds.indexOf(roomId as EscapeRoomId) < escapeRoomIds.indexOf(previous as EscapeRoomId);
      setTransition({ name: escape!.roomName, back });
      if (!back) maybeSummonArchivist(0.3);
      const timer = setTimeout(() => setTransition(undefined), 1900);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roomName muda junto com roomId
  }, [escape?.roomId]);

  // Guia espectral: na PRIMEIRA visita à sala, uma mão translúcida demonstra
  // onde interagir por ~2,5 s (desligável em "Ajuda visual").
  const stepObject = escape?.step?.object;
  useEffect(() => {
    const roomId = escape?.roomId;
    if (!roomId || !stepObject || !visualHelp || escape?.reviewing) return;
    if (guidedRooms.current.has(roomId)) return;
    guidedRooms.current.add(roomId);
    const spot = sceneSpots[roomId as EscapeRoomId]?.[stepObject];
    if (!spot) return;
    const showTimer = setTimeout(() => setGhost({ x: spot.x + spot.w / 2, y: spot.y + spot.h / 2 }), 2100);
    const hideTimer = setTimeout(() => setGhost(undefined), 4700);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara por sala
  }, [escape?.roomId, stepObject, visualHelp]);

  // Sistema de tensão: o ambiente reage conforme o tempo escorre.
  const totalMs = (snapshot.durationMin ?? 35) * 60_000;
  const remaining = snapshot.remainingMs ?? totalMs;
  const fraction = totalMs > 0 ? remaining / totalMs : 1;
  const tension = snapshot.phase === "ESCAPE" && !escape?.finishedAt
    ? (fraction <= 0.1 ? 3 : fraction <= 0.25 ? 2 : fraction <= 0.5 ? 1 : 0)
    : 0;
  // Nos últimos 10% do tempo, o Arquivista aparece (se ainda não apareceu).
  useEffect(() => {
    if (tension >= 3) maybeSummonArchivist(1);
     
  }, [tension]);

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
        setFeedback({ kind: "erro", text: wrongAttemptLines[step.type] ?? "A SENTINELA recusou. Analisem de novo (−bases)." });
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

  /** Sala do PROGRESSO (mesmo durante a revisão de uma sala anterior). */
  function progressRoomId(): EscapeRoomId {
    return escape!.visitedRooms?.find((item) => item.current)?.id ?? escape!.roomId;
  }

  function submitNote() {
    if (noteDraft.trim().length < 3) return;
    socket.current?.emit("escape:note", { code, teamToken: token, roomId: progressRoomId(), text: noteDraft.trim() }, (result: { ok: boolean; error?: string }) => {
      if (!result.ok) return setFeedback({ kind: "erro", text: result.error ?? "O prontuário não foi salvo." });
      setNotebookOpen(false);
      setNoteDraft("");
    });
  }

  /** Navega para uma sala já visitada (−2 bases) ou volta à investigação (grátis). */
  function goToRoom(roomId: EscapeRoomId) {
    socket.current?.emit("escape:review", { code, teamToken: token, roomId }, (result: { ok: boolean; error?: string }) => {
      if (!result.ok) setFeedback({ kind: "erro", text: result.error ?? "Não foi possível voltar." });
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
  const reviewing = Boolean(escape.reviewing);
  const activeSpots = reviewing
    ? (escape.reviewSteps ?? [])
    : [escape.step, escape.optionalStep].filter((step): step is EscapeClientStep => Boolean(step));
  const usedHints = openStep ? (localHints[openStep.id] ?? escape.revealedHints[openStep.id] ?? []) : [];

  return (
    <section className={`escape-stage ${transition ? "is-entering" : ""} tension-${tension}`}>
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
        {archivist && <ArchivistCameo />}
        {ghost && <GhostHint x={ghost.x} y={ghost.y} />}
        <Hands gesture={gesture} />
        {remaining > 0 && remaining <= 10_000 && !escape.finishedAt && (
          <strong className="final-count" aria-hidden="true">{Math.ceil(remaining / 1000)}</strong>
        )}
        {transition && <DoorTransition roomName={transition.name} back={transition.back} />}
      </div>

      <header className="escape-hud">
        <div className="hud-room">
          <strong>{escape.roomName}</strong>
          <span>Sala {escape.roomIndex + 1}/{escape.roomCount} · mecanismo {Math.min(escape.stepIndex + 1, escape.mandatoryCount)}/{escape.mandatoryCount}</span>
        </div>
        <strong className={`hud-timer ${(snapshot.remainingMs ?? 999_999) < 5 * 60_000 ? "is-critical" : ""}`}>{formatTime(snapshot.remainingMs)}</strong>
        <div className="hud-bases"><span>bases</span><ScoreTicker value={snapshot.score ?? 0} /></div>
      </header>

      {(escape.visitedRooms?.length ?? 0) > 1 && (
        <nav className="room-strip" aria-label="Salas visitadas">
          <span className="strip-label">Salas</span>
          {escape.visitedRooms!.map((visited) => {
            const isShown = visited.id === room;
            return (
              <button
                key={visited.id}
                className={`room-pill ${visited.current ? "is-current" : ""} ${isShown && reviewing ? "is-reviewing" : ""}`}
                disabled={isShown}
                title={visited.current ? "Sala atual da investigação" : `Rever ${visited.name} (−${ESCAPE_REVIEW_COST} bases)`}
                onClick={() => goToRoom(visited.id)}
              >
                {visited.name}{!visited.current && !isShown && <em>−{ESCAPE_REVIEW_COST}</em>}
              </button>
            );
          })}
        </nav>
      )}

      {reviewing ? (
        <div className="review-banner">
          <span>Modo revisão: os enigmas desta sala já foram resolvidos — toquem nos objetos para reler as evidências.</span>
          <button className="button button--quiet" onClick={() => goToRoom(progressRoomId())}><Undo2 size={15} /> Voltar à investigação</button>
        </div>
      ) : (
        <p className="sentinela-line">{escape.roomIntro}</p>
      )}

      <footer className="escape-toolbar">
        <button className="button button--quiet" onClick={() => { setNoteDraft(escape.notes[progressRoomId()] ?? ""); setNotebookOpen(true); }}><BookOpenText size={17} /> Prontuário</button>
        <button className="icon-button" title={visualHelp ? "Desligar ajuda visual" : "Ligar ajuda visual"} onClick={toggleVisualHelp}>
          {visualHelp ? <Eye size={17} /> : <EyeOff size={17} />}
        </button>
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
            {reviewing ? (
              <p className="success-text">Enigma já resolvido — revisão apenas das evidências.</p>
            ) : escape.lockedUntilMs && openStep.type === "dial-safe" ? (
              <p className="alert-text">Cofre travado por erro. Liberação em {Math.ceil(escape.lockedUntilMs / 1000)} s.</p>
            ) : (
              <PuzzleBody step={openStep} sending={sending} onSubmit={(answer) => submitAttempt(openStep, answer)} onGesture={pulseGesture} />
            )}
            {feedback && <p className={feedback.kind === "ok" ? "success-text" : "alert-text"}>{feedback.text}</p>}
            <div className="hint-zone">
              {usedHints.map((hint, index) => <p key={index} className="hint-line"><Lightbulb size={14} /> {hint}</p>)}
              {!reviewing && usedHints.length < 3 && (
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
