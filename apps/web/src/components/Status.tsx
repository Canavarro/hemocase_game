import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <span className={`connection-status ${connected ? "is-online" : "is-offline"}`}>
      {connected ? <Wifi size={15} /> : <WifiOff size={15} />}
      {connected ? "Conectado" : "Reconectando"}
    </span>
  );
}
