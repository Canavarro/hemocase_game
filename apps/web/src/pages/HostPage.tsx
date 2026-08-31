import { useEffect, useState } from "react";
import { ArrowLeft, DoorOpen, Download, ExternalLink, Pause, Play, Plus, RotateCcw, ShieldAlert, SlidersHorizontal, Square, SkipForward, Timer } from "lucide-react";
import { diseaseGroupLabels, diseaseGroups, escapeTopicLabels, escapeTopics, type DiseaseGroup, type EscapeLibrary, type EscapeTopic, type GameMode, type HostAction, type IntegrityPolicy } from "@hemocase/shared";
import { ConnectionStatus } from "../components/Status";
import { formatTime, useSession } from "../lib/socket";

const storedCode = sessionStorage.getItem("hemocase:host-code") ?? undefined;
const storedToken = sessionStorage.getItem("hemocase:host-token") ?? undefined;
type WithoutHostAuth<T> = T extends unknown ? Omit<T, "code" | "hostToken"> : never;
type HostActionPayload = WithoutHostAuth<HostAction>;

const topicPresets: Record<string, EscapeTopic[]> = {
  "Aula completa": [...escapeTopics],
  "Hemoglobinopatias": ["proteinas-funcoes", "hemoglobina-estrutura", "anemia-falciforme", "talassemias", "mutacoes-ponto", "heranca-autossomica", "splicing-promotor"],
  "Coagulopatias": ["proteinas-funcoes", "hemostasia-primaria", "hemostasia-secundaria", "hemofilias", "von-willebrand", "bernard-soulier", "heranca-ligada-x", "trombofilias"],
};

export function HostPage() {
  const [code, setCode] = useState(storedCode);
  const [token, setToken] = useState(storedToken);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [mode, setMode] = useState<GameMode>("QUIZ");
  const [topics, setTopics] = useState<EscapeTopic[]>(topicPresets["Hemoglobinopatias"]!);
  const [durationMin, setDurationMin] = useState(35);
  const [library, setLibrary] = useState<EscapeLibrary>({ cases: [], diseases: [] });
  const [source, setSource] = useState("");
  const { socket, snapshot, connected, error } = useSession("host", code, token);

  useEffect(() => {
    if (mode !== "ESCAPE" || library.cases.length || library.diseases.length) return;
    fetch("/api/escape/library")
      .then((response) => response.json() as Promise<EscapeLibrary>)
      .then((data) => setLibrary({ cases: data.cases ?? [], diseases: data.diseases ?? [] }))
      .catch(() => setLibrary({ cases: [], diseases: [] }));
  }, [mode, library.cases.length, library.diseases.length]);

  /** Origem do caso: sorteio, caso pronto, doença específica, assunto ou aula inteira. */
  function pickSource(next: string) {
    setSource(next);
    const [kind, id] = next.split(":");
    if (kind === "case") {
      const picked = library.cases.find((item) => item.id === id);
      if (picked) setTopics([...picked.topicTags]);
    }
    if (kind === "disease") {
      const picked = library.diseases.find((item) => item.id === id);
      if (picked) setTopics([...picked.topicTags]);
    }
    if (kind === "group") {
      const tags = new Set<EscapeTopic>();
      for (const disease of library.diseases) {
        if (disease.group === id) for (const tag of disease.topicTags) tags.add(tag);
      }
      if (tags.size) setTopics([...tags]);
    }
    if (kind === "any") setTopics([...escapeTopics]);
  }

  function sourceNote(): string | undefined {
    const [kind, id] = source.split(":");
    if (kind === "case") {
      const picked = library.cases.find((item) => item.id === id);
      return `Sessão fixada em um único caso pronto: todo o jogo gira em torno de ${picked?.diagnosis ?? "uma única doença"}.`;
    }
    if (kind === "disease") {
      const picked = library.diseases.find((item) => item.id === id);
      return `A SENTINELA vai GERAR um caso inédito de ${picked?.name ?? "uma doença específica"}: paciente, senhas e alternativas mudam a cada sessão, mas todo o jogo é sobre essa doença.`;
    }
    if (kind === "group") {
      return `A SENTINELA sorteia uma doença de ${diseaseGroupLabels[id as DiseaseGroup] ?? "um assunto"} e gera um caso inédito sobre ela.`;
    }
    if (kind === "any") return "A SENTINELA sorteia qualquer doença da base de conhecimento (aula inteira) e gera um caso inédito.";
    return undefined;
  }

  function toggleTopic(topic: EscapeTopic) {
    setTopics((current) => current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]);
  }

  async function createSession() {
    setBusy(true);
    setNotice(undefined);
    try {
      const [kind, id] = source.split(":");
      const caseId = kind === "case" ? id : undefined;
      const generator = kind === "disease"
        ? { mode: "disease", diseaseId: id }
        : kind === "group"
          ? { mode: "group", group: id }
          : kind === "any" ? { mode: "any" } : undefined;
      const body = mode === "ESCAPE"
        ? { mode, integrityPolicy: "ZERO_ROUND", allowedTopics: topics, durationMin, caseId, generator }
        : { mode, integrityPolicy: "ZERO_ROUND" };
      const response = await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
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

          <div className="mode-picker" role="radiogroup" aria-label="Modalidade da sessão">
            <button className={`mode-card ${mode === "QUIZ" ? "is-active" : ""}`} role="radio" aria-checked={mode === "QUIZ"} onClick={() => setMode("QUIZ")}>
              <strong>Rodadas ao vivo</strong>
              <span>Fases sincronizadas, perguntas cronometradas e placar no projetor.</span>
            </button>
            <button className={`mode-card ${mode === "ESCAPE" ? "is-active" : ""}`} role="radio" aria-checked={mode === "ESCAPE"} onClick={() => setMode("ESCAPE")}>
              <strong>Escape: Protocolo Hélix</strong>
              <span>Laboratório selado em primeira pessoa. Cada equipe investiga no seu ritmo.</span>
            </button>
          </div>

          {mode === "ESCAPE" && (
            <div className="escape-setup">
              <div className="setup-row">
                <label className="field-label">Duração da corrida
                  <select value={durationMin} onChange={(event) => setDurationMin(Number(event.target.value))}>
                    <option value={25}>25 minutos</option>
                    <option value={35}>35 minutos</option>
                    <option value={45}>45 minutos</option>
                  </select>
                </label>
                <label className="field-label">Predefinição de tópicos
                  <select defaultValue="Hemoglobinopatias" onChange={(event) => { setSource(""); setTopics(topicPresets[event.target.value] ?? []); }}>
                    {Object.keys(topicPresets).map((preset) => <option key={preset} value={preset}>{preset}</option>)}
                  </select>
                </label>
              </div>
              <label className="field-label">Origem do caso
                <select value={source} onChange={(event) => pickSource(event.target.value)}>
                  <option value="">Sortear caso pronto pelos tópicos liberados</option>
                  {library.diseases.length > 0 && <option value="any">Gerar caso inédito · aula inteira (qualquer doença)</option>}
                  {library.diseases.length > 0 && (
                    <optgroup label="Gerar por assunto">
                      {diseaseGroups.filter((group) => library.diseases.some((disease) => disease.group === group)).map((group) => (
                        <option key={group} value={`group:${group}`}>Sortear doença de {diseaseGroupLabels[group]}</option>
                      ))}
                    </optgroup>
                  )}
                  {library.diseases.length > 0 && (
                    <optgroup label="Gerar por doença específica">
                      {library.diseases.map((disease) => (
                        <option key={disease.id} value={`disease:${disease.id}`}>{disease.name} · {diseaseGroupLabels[disease.group]}</option>
                      ))}
                    </optgroup>
                  )}
                  {library.cases.length > 0 && (
                    <optgroup label="Casos prontos (roteiro fixo)">
                      {library.cases.map((item) => (
                        <option key={item.id} value={`case:${item.id}`}>{item.title} · {item.diagnosis}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>
              {sourceNote() && (
                <p className="puzzle-note">
                  {sourceNote()} Os tópicos abaixo foram pré-ajustados; desmarque o que a turma ainda não viu.
                </p>
              )}
              <fieldset className="topic-grid">
                <legend>Conteúdos já vistos pela turma (nada fora disso entra no jogo)</legend>
                {escapeTopics.map((topic) => (
                  <label key={topic} className={`topic-chip ${topics.includes(topic) ? "is-on" : ""}`}>
                    <input type="checkbox" checked={topics.includes(topic)} onChange={() => toggleTopic(topic)} />
                    {escapeTopicLabels[topic]}
                  </label>
                ))}
              </fieldset>
            </div>
          )}

          <button className="button button--danger" onClick={createSession} disabled={busy}><Plus size={19} /> {busy ? "Criando..." : mode === "ESCAPE" ? "Selar o laboratório" : "Criar sessão"}</button>
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
        {snapshot?.mode === "ESCAPE" && snapshot.phase === "ESCAPE" && (
          <button className="button button--quiet" onClick={() => action({ action: "extendTime", minutes: 5 })}><Timer size={17} /> +5 min</button>
        )}
        <button className="button button--quiet" onClick={() => { if (window.confirm("Encerrar o protocolo e exibir o resultado final?")) action({ action: "finish" }); }} disabled={snapshot?.phase === "FINISHED"}><Square size={17} /> Encerrar</button>
      </nav>

      <div className="host-grid">
        <section className="host-section">
          <div className="section-heading"><div><p className="eyebrow">Monitor de equipes</p><h2>{snapshot?.mode === "ESCAPE" ? "Mapa do laboratório" : "Estado da sala"}</h2></div><code>{snapshot?.joinUrl}</code></div>
          {snapshot?.mode === "ESCAPE" ? (
            <>
              <div className="team-table" role="table">
                <div className="team-row team-row--escape team-row--head" role="row"><span>Equipe</span><span>Sala</span><span>Progresso</span><span>Dicas</span><span>Bases</span></div>
                {snapshot.escapeHost?.map((row) => {
                  const connected = snapshot.teams.find((team) => team.id === row.teamId)?.connected ?? false;
                  return (
                    <div className="team-row team-row--escape" role="row" key={row.teamId}>
                      <span><i className={connected ? "online-dot" : "offline-dot"} />{row.name}{row.finishedAt ? " · ESCAPOU" : ""}</span>
                      <span>{row.roomId} · {row.roomName}</span>
                      <span className="room-progress"><i style={{ width: `${row.mandatoryCount ? Math.round((row.stepIndex / row.mandatoryCount) * 100) : 0}%` }} />{row.stepIndex}/{row.mandatoryCount}</span>
                      <span>{row.hintsCount}</span>
                      <strong className="score-control">{row.bases}
                        <button className="icon-button icon-button--small" title={`Destravar a porta de ${row.name}`} onClick={() => { if (window.confirm(`Destravar a porta atual de ${row.name}?`)) action({ action: "unlockDoor", teamId: row.teamId }); }}><DoorOpen size={15} /></button>
                        <button className="icon-button icon-button--small" title={`Ajustar pontos de ${row.name}`} onClick={() => adjustScore(row.teamId)}><SlidersHorizontal size={15} /></button>
                      </strong>
                    </div>
                  );
                })}
                {!snapshot.escapeHost?.length && <p className="empty-state">Aguardando as equipes escanearem o código.</p>}
              </div>
              <div className="event-feed">
                {snapshot.escapeEvents?.slice(0, 8).map((event) => <p key={event.at + event.text}><span>{new Date(event.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>{event.text}</p>)}
                {!snapshot.escapeEvents?.length && <p className="empty-state">Sem eventos ainda.</p>}
              </div>
            </>
          ) : (
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
          )}
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
