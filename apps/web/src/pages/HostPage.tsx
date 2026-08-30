import { useState } from "react";
import { ArrowLeft, Download, ExternalLink, Pause, Play, Plus, RotateCcw, ShieldAlert, SlidersHorizontal, Square, SkipForward } from "lucide-react";
import type { HostAction, IntegrityPolicy } from "@hemocase/shared";
import { ConnectionStatus } from "../components/Status";
import { formatTime, useSession } from "../lib/socket";

const storedCode = sessionStorage.getItem("hemocase:host-code") ?? undefined;
const storedToken = sessionStorage.getItem("hemocase:host-token") ?? undefined;
type WithoutHostAuth<T> = T extends unknown ? Omit<T, "code" | "hostToken"> : never;
type HostActionPayload = WithoutHostAuth<HostAction>;

export function HostPage() {
  const [code, setCode] = useState(storedCode);
  const [token, setToken] = useState(storedToken);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>();
  const { socket, snapshot, connected, error } = useSession("host", code, token);

  async function createSession() {
    setBusy(true);
    setNotice(undefined);
    try {
      const response = await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ integrityPolicy: "ZERO_ROUND" }) });
      const data = await response.json() as { code: string; hostToken: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível criar a sessão.");
      sessionStorage.setItem("hemocase:host-code", data.code);
      sessionStorage.setItem("hemocase:host-token", data.hostToken);
      setCode(data.code);
      setToken(data.hostToken);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Falha ao criar sessão.");
    } finally { setBusy(false); }
  }

  function action(payload: HostActionPayload) {
    if (!code || !token) return;
    socket.current?.emit("host:action", { code, hostToken: token, ...payload }, (result: { ok: boolean; error?: string }) => {
      if (!result.ok) setNotice(result.error);
      else setNotice(undefined);
    });
  }

  function newSession() {
    sessionStorage.removeItem("hemocase:host-code");
    sessionStorage.removeItem("hemocase:host-token");
    setCode(undefined);
    setToken(undefined);
  }

  function adjustScore(teamId: string) {
    const rawDelta = window.prompt("Ajuste de bases (use valor negativo para remover):", "0");
    if (rawDelta === null) return;
    const delta = Number(rawDelta);
    if (!Number.isInteger(delta) || delta < -100 || delta > 100 || delta === 0) return setNotice("Informe um número inteiro entre -100 e 100.");
    const reason = window.prompt("Justificativa do ajuste:");
    if (reason) action({ action: "adjustScore", teamId, delta, reason });
  }

  if (!code || !token) {
    return (
      <main className="host-start shell">
        <header className="masthead"><span>LAGEM</span><small>Console do facilitador</small></header>
        <section className="start-copy">
          <p className="eyebrow">Protocolo de sala</p>
          <h1 className="title-pulse headline-rise">HEMOCASE</h1>
          <p className="blood-title blood-title--typed">Código Vermelho</p>
          <p>Prepare a transmissão, conecte as equipes e assuma o controle do protocolo.</p>
          <button className="button button--danger" onClick={createSession} disabled={busy}><Plus size={19} /> {busy ? "Criando..." : "Criar sessão"}</button>
          {notice && <p className="alert-text">{notice}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="host-shell shell">
      <header className="masthead host-topbar">
        <div><strong>HEMOCASE</strong><span>Sessão {code}</span></div>
        <div><ConnectionStatus connected={connected} /><button className="button button--quiet" onClick={newSession}>Nova sessão</button></div>
      </header>

      {error && <div className="system-alert">{error}</div>}
      {notice && <div className="system-alert">{notice}</div>}

      <section className="host-summary">
        <div><span>Fase</span><strong>{snapshot?.phaseLabel ?? "Carregando"}</strong></div>
        <div><span>Relógio oficial</span><strong className="mono red">{formatTime(snapshot?.remainingMs ?? null)}</strong></div>
        <div><span>Equipes</span><strong>{snapshot?.teams.length ?? 0}</strong></div>
        <div><span>Questão</span><strong>{snapshot?.questionCount ? `${snapshot.questionIndex + 1}/${snapshot.questionCount}` : "—"}</strong></div>
      </section>

      <nav className="host-actions" aria-label="Controles da partida">
        <button className="button button--quiet" onClick={() => action({ action: "back" })} disabled={snapshot?.phase === "LOBBY" || snapshot?.phase === "PAUSED"}><ArrowLeft size={18} /> Voltar fase</button>
        {snapshot?.phase === "PAUSED"
          ? <button className="button button--primary" onClick={() => action({ action: "resume" })}><Play size={18} /> Retomar</button>
          : <button className="button button--quiet" onClick={() => action({ action: "pause" })} disabled={snapshot?.phase === "LOBBY" || snapshot?.phase === "FINISHED"}><Pause size={18} /> Pausar</button>}
        <button className="button button--danger" onClick={() => action({ action: "advance" })} disabled={snapshot?.phase === "PAUSED" || snapshot?.phase === "FINISHED"}><SkipForward size={18} /> Avançar</button>
        <button className="button button--quiet" onClick={() => action({ action: "reset" })}><RotateCcw size={18} /> Reiniciar</button>
        <button className="button button--quiet" onClick={() => window.open(`/screen/${code}`, "hemocase-screen")}><ExternalLink size={18} /> Abrir projetor</button>
        <button className="button button--quiet" onClick={() => { if (window.confirm("Encerrar o protocolo e exibir o resultado final?")) action({ action: "finish" }); }} disabled={snapshot?.phase === "FINISHED"}><Square size={17} /> Encerrar</button>
      </nav>

      <div className="host-grid">
        <section className="host-section">
          <div className="section-heading"><div><p className="eyebrow">Monitor de equipes</p><h2>Estado da sala</h2></div><code>{snapshot?.joinUrl}</code></div>
          <div className="team-table" role="table">
            <div className="team-row team-row--head" role="row"><span>Equipe</span><span>Trilho</span><span>Resposta</span><span>Bases</span></div>
            {snapshot?.teams.map((team) => (
              <div className="team-row" role="row" key={team.id}>
                <span><i className={team.connected ? "online-dot" : "offline-dot"} />{team.name}</span>
                <span>{team.track}</span><span>{team.answered ? "Registrada" : "Pendente"}</span><strong className="score-control">{team.score}<button className="icon-button icon-button--small" title={`Ajustar pontos de ${team.name}`} onClick={() => adjustScore(team.id)}><SlidersHorizontal size={15} /></button></strong>
              </div>
            ))}
            {!snapshot?.teams.length && <p className="empty-state">Aguardando as equipes escanearem o código.</p>}
          </div>
        </section>

        <aside className="host-section integrity-panel">
          <div className="section-heading"><div><p className="eyebrow">Integridade</p><h2>Incidentes</h2></div><ShieldAlert /></div>
          <label className="field-label">Política
            <select value={snapshot?.integrityPolicy ?? "ZERO_ROUND"} onChange={(event) => action({ action: "setPolicy", policy: event.target.value as IntegrityPolicy })}>
              <option value="ZERO_ROUND">Zerar rodada</option><option value="WARNING">Aviso</option><option value="MANUAL_REVIEW">Revisão manual</option><option value="OBSERVE_ONLY">Somente observar</option>
            </select>
          </label>
          <div className="incident-list">
            {snapshot?.incidents?.map((incident) => (
              <article className={incident.reversedAt ? "incident is-reversed" : "incident"} key={incident.id}>
                <div><strong>{incident.teamName}</strong><span>{incident.classification === "confirmed" ? "Confirmado" : "Suspeito"} · {incident.phase}</span></div>
                <span>{incident.deductedPoints ? `−${incident.deductedPoints} bases` : "registro"}</span>
                {!incident.reversedAt && <button className="text-button" onClick={() => { const reason = window.prompt("Motivo da reversão:"); if (reason) action({ action: "reverseIncident", incidentId: incident.id, reason }); }}>Desfazer</button>}
              </article>
            ))}
            {!snapshot?.incidents?.length && <p className="empty-state">Nenhum incidente registrado.</p>}
          </div>
        </aside>
      </div>

      <footer className="host-footer">
        <span>Exportação local</span>
        <a className="button button--quiet" href={`/api/sessions/${code}/export?token=${encodeURIComponent(token)}&format=csv`}><Download size={17} /> CSV</a>
        <a className="button button--quiet" href={`/api/sessions/${code}/export?token=${encodeURIComponent(token)}`}><Download size={17} /> JSON</a>
      </footer>
    </main>
  );
}
