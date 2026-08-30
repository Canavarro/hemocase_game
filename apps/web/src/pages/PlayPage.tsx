import { useEffect, useRef, useState } from "react";
import { Check, Focus, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import { ConnectionStatus } from "../components/Status";
import { formatTime, useSession } from "../lib/socket";

const competitive = new Set(["WARMUP", "CASE_INVESTIGATION", "BLITZ", "FINAL_CHAIN"]);

export function PlayPage({ code }: { code: string }) {
  const token = localStorage.getItem(`hemocase:team:${code}`) ?? undefined;
  const { socket, snapshot, connected, error } = useSession("team", code, token);
  const [focusReady, setFocusReady] = useState(false);
  const [selection, setSelection] = useState<{ questionId?: string; choiceId?: string }>({});
  const [sendingQuestionId, setSendingQuestionId] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const hiddenAt = useRef<number | undefined>(undefined);

  const activePhase = snapshot?.phase;
  const currentQuestionId = snapshot?.question?.id;
  const selected = snapshot?.answeredChoiceId ?? (selection.questionId === currentQuestionId ? selection.choiceId : undefined);
  const sending = sendingQuestionId === currentQuestionId && !snapshot?.answerAccepted;

  useEffect(() => {
    if (!token || !activePhase || !competitive.has(activePhase)) return;
    const report = (type: string, hiddenDurationMs?: number) => socket.current?.emit("integrity:event", { code, teamToken: token, type, hiddenDurationMs });
    const visibility = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else if (hiddenAt.current) {
        report("visibility_hidden", Date.now() - hiddenAt.current);
        hiddenAt.current = undefined;
      }
    };
    const pagehide = () => report("pagehide");
    const blur = () => report("blur");
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("blur", blur);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("blur", blur);
    };
  }, [activePhase, code, socket, token]);

  async function enterFocus() {
    try { await document.documentElement.requestFullscreen?.(); } catch { /* optional */ }
    try {
      const wakeLock = (navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<unknown> } }).wakeLock;
      await wakeLock?.request("screen");
    } catch { /* optional */ }
    setFocusReady(true);
  }

  function submit() {
    if (!selected || !snapshot?.question || !token) return;
    setSendingQuestionId(snapshot.question.id);
    setSubmitError(undefined);
    socket.current?.emit("answer:submit", { code, teamToken: token, questionId: snapshot.question.id, choiceId: selected }, (result: { ok: boolean; error?: string }) => {
      if (!result.ok) {
        setSubmitError(result.error ?? "A resposta não foi registrada.");
        setSendingQuestionId(undefined);
      }
    });
  }

  if (!token) return <main className="mobile-shell centered-mobile"><LockKeyhole /><h1>Credencial ausente</h1><p>Entre novamente usando o código da sessão.</p><a className="button button--danger" href={`/join/${code}`}>Voltar à entrada</a></main>;
  if (error) return <main className="mobile-shell centered-mobile"><TriangleAlert /><h1>Sinal perdido</h1><p>{error}</p><a className="button button--danger" href={`/join/${code}`}>Tentar novamente</a></main>;

  return (
    <main className="mobile-shell play-screen">
      <header className="mobile-statusbar">
        <div><strong>{snapshot?.teamName ?? "Equipe"}</strong><span>{snapshot?.track ? `Trilho ${snapshot.track}` : `Sessão ${code}`}</span></div>
        <ConnectionStatus connected={connected} />
      </header>

      {snapshot?.phase === "LOBBY" && (
        <section className="waiting-state">
          <div className="waiting-signal"><i /><i /><i /></div>
          <p className="eyebrow">Conexão estabelecida</p>
          <h1>AGUARDE A TRANSMISSÃO</h1>
          <p>O Host ainda está reunindo as equipes. Não feche esta página.</p>
          <div className="score-line"><span>Bases recuperadas</span><strong>{snapshot.score ?? 0}</strong></div>
        </section>
      )}

      {snapshot?.phase === "FOCUS_CHECK" && (
        <section className="focus-screen">
          <Focus size={44} />
          <p className="eyebrow">Protocolo de integridade</p>
          <h1>MANTENHA OS OLHOS NA SALA.</h1>
          <p>Durante as rodadas, sair desta página pode zerar os pontos da rodada. O registro pode ser revisto pelo Host.</p>
          <button className={`button button--full ${focusReady ? "button--confirmed" : "button--danger"}`} onClick={enterFocus} disabled={focusReady}>{focusReady ? <><ShieldCheck /> Modo de foco ativo</> : <><Focus /> Entrar no modo de jogo</>}</button>
        </section>
      )}

      {snapshot?.question && competitive.has(snapshot.phase) && (
        <section className="question-screen">
          <div className="question-meta"><span>{snapshot.phaseLabel} · {snapshot.questionIndex + 1}/{snapshot.questionCount}</span><strong className={(snapshot.remainingMs ?? 99_999) < 10_000 ? "timer is-critical" : "timer"}>{formatTime(snapshot.remainingMs)}</strong></div>
          <p className="eyebrow">{snapshot.question.title}</p>
          <h1>{snapshot.question.prompt}</h1>
          {snapshot.question.evidence?.length && <ul className="evidence-list">{snapshot.question.evidence.map((item) => <li key={item}>{item}</li>)}</ul>}
          <div className="choice-list">
            {snapshot.question.choices.map((choice) => (
              <button className={`choice ${selected === choice.id ? "is-selected" : ""}`} key={choice.id} onClick={() => !snapshot.answerAccepted && setSelection({ questionId: snapshot.question?.id, choiceId: choice.id })} disabled={snapshot.answerAccepted || sending}>
                <span>{choice.id}</span><strong>{choice.text}</strong>{selected === choice.id && <Check size={19} />}
              </button>
            ))}
          </div>
          {submitError && <p className="alert-text">{submitError}</p>}
          <button className={`button button--full ${snapshot.answerAccepted ? "button--confirmed" : "button--danger"}`} onClick={submit} disabled={!selected || sending || snapshot.answerAccepted}>
            {snapshot.answerAccepted ? <><LockKeyhole size={19} /> Resposta lacrada</> : sending ? "Registrando..." : "Confirmar resposta"}
          </button>
          <div className="score-line"><span>Bases recuperadas</span><strong>{snapshot.score ?? 0}</strong></div>
        </section>
      )}

      {snapshot?.phase === "PAUSED" && <section className="waiting-state"><p className="eyebrow">Tempo suspenso</p><h1>O HOST INTERROMPEU O MECANISMO.</h1><p>Permaneça nesta tela. A contagem continuará do ponto exato.</p><strong className="large-timer">{formatTime(snapshot.remainingMs)}</strong></section>}

      {(snapshot?.phase === "REVEAL" || snapshot?.phase === "FINISHED") && (
        <section className="finish-screen"><p className="eyebrow">Protocolo concluído</p><h1>VOCÊS SEGUIRAM A CADEIA.</h1><p>Do gene ao fenótipo, cada pista fazia parte do mesmo mecanismo.</p><strong className="final-score">{snapshot.score ?? 0}<span>bases</span></strong><ol>{snapshot.teams.map((team, index) => <li key={team.id}><span>{index + 1}. {team.name}</span><strong>{team.score}</strong></li>)}</ol></section>
      )}
    </main>
  );
}
