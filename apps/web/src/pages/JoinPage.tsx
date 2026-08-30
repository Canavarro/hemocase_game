import { useState, type FormEvent } from "react";
import { ArrowRight, Users } from "lucide-react";
import type { SessionSnapshot } from "@hemocase/shared";
import { createSocket } from "../lib/socket";

export function JoinPage({ code }: { code: string }) {
  const [name, setName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!confirmed) return setError("Confirme que a equipe compartilhará este aparelho.");
    setBusy(true);
    const socket = createSocket();
    socket.emit("session:join", { code, name }, (result: { ok: boolean; teamToken?: string; snapshot?: SessionSnapshot; error?: string }) => {
      if (result.ok && result.teamToken) {
        localStorage.setItem(`hemocase:team:${code}`, result.teamToken);
        window.location.assign(`/play/${code}`);
      } else {
        setError(result.error ?? "Não foi possível entrar.");
        setBusy(false);
        socket.disconnect();
      }
    });
  }

  return (
    <main className="mobile-shell join-screen">
      <header className="mobile-brand"><strong>HEMOCASE</strong><span>Código Vermelho</span></header>
      <section>
        <p className="eyebrow">Sessão {code}</p>
        <h1>IDENTIFIQUE SUA EQUIPE</h1>
        <p>Use um nome curto. Esta será a identidade exibida na sala.</p>
        <form onSubmit={submit}>
          <label className="field-label">Nome da equipe
            <div className="text-field"><Users size={19} /><input autoFocus autoComplete="off" maxLength={24} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Equipe HBB" /></div>
          </label>
          <label className="check-line"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>Somos uma equipe e usaremos somente este celular.</span></label>
          {error && <p className="alert-text">{error}</p>}
          <button className="button button--danger button--full" disabled={busy || name.trim().length < 2}>{busy ? "Conectando..." : <>Entrar na sala <ArrowRight size={19} /></>}</button>
        </form>
      </section>
    </main>
  );
}
