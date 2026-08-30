import { useState } from "react";
import { Activity, CheckCircle2, Users } from "lucide-react";
import { IntroTransmission } from "../components/IntroTransmission";
import { ConnectionStatus } from "../components/Status";
import { formatTime, useSession } from "../lib/socket";

export function ScreenPage({ code }: { code: string }) {
  const introKey = `hemocase:intro:${code}`;
  const [introDone, setIntroDone] = useState(sessionStorage.getItem(introKey) === "done");
  const { snapshot, connected, error } = useSession("screen", code);

  function finishIntro() {
    sessionStorage.setItem(introKey, "done");
    setIntroDone(true);
  }

  if (!introDone) return <IntroTransmission onFinished={finishIntro} />;
  if (error) return <main className="centered-screen"><p className="eyebrow">Sinal interrompido</p><h1>Sessão indisponível</h1><p>{error}</p></main>;

  const phase = snapshot?.phase;
  const showRanking = phase === "REVEAL" || phase === "FINISHED";
  return (
    <main className="public-screen shell">
      <header className="projector-header">
        <div className="projector-brand"><strong>HEMOCASE</strong><span>Código Vermelho</span></div>
        <div className="phase-chip"><Activity size={16} /> {snapshot?.phaseLabel ?? "Sincronizando"}</div>
        <ConnectionStatus connected={connected} />
      </header>

      {phase === "LOBBY" && (
        <section className="lobby-layout">
          <div className="lobby-copy">
            <p className="eyebrow">Sala de contenção aberta</p>
            <h1>ENTREM.<br />O TEMPO AINDA NÃO COMEÇOU.</h1>
            <p>Escaneie o código, dê um nome à equipe e mantenha um único celular conectado.</p>
            <div className="session-code"><span>Código da sessão</span><strong>{code}</strong></div>
          </div>
          <div className="qr-zone">
            <img src={`/api/sessions/${code}/qr`} alt={`QR Code para entrar na sessão ${code}`} />
            <code>{snapshot?.joinUrl}</code>
            <span><Users size={18} /> {snapshot?.teams.length ?? 0} equipes conectadas</span>
          </div>
          <div className="lobby-teams">
            {snapshot?.teams.map((team) => <span key={team.id}><i className={team.connected ? "online-dot" : "offline-dot"} />{team.name}</span>)}
          </div>
        </section>
      )}

      {phase && phase !== "LOBBY" && phase !== "REVEAL" && phase !== "FINISHED" && (
        <section className="mission-screen">
          <div className="mission-meta"><span>{snapshot?.questionCount ? `Mecanismo ${snapshot.questionIndex + 1} de ${snapshot.questionCount}` : "Protocolo coletivo"}</span><strong className="projector-timer">{formatTime(snapshot?.remainingMs ?? null)}</strong></div>
          <div className="mission-copy">
            <p className="eyebrow">{snapshot?.phaseLabel}</p>
            <h1>{phase === "FOCUS_CHECK" ? "A SALA OBSERVA QUEM DESVIA O OLHAR." : snapshot?.question?.title ?? "AS EQUIPES ESTÃO SOB TESTE."}</h1>
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
            <h1>{phase === "FINISHED" ? "PROTOCOLO ENCERRADO" : "DNA → RNA → PROTEÍNA → FUNÇÃO → FENÓTIPO"}</h1>
            <div className="reveal-list">{snapshot?.reveal?.map((row) => <div key={row.title}><strong>{row.title}</strong><span>{row.explanation}</span></div>)}</div>
          </div>
          <ol className="ranking">
            {snapshot?.teams.map((team, index) => <li key={team.id}><span>{index + 1}</span><strong>{team.name}</strong><b>{team.score} bases</b></li>)}
          </ol>
        </section>
      )}
    </main>
  );
}
