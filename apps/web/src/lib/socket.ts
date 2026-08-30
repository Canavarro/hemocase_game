import { io, type Socket } from "socket.io-client";
import type { SessionSnapshot } from "@hemocase/shared";
import { useEffect, useRef, useState } from "react";

type Role = "host" | "screen" | "team";

export function createSocket() {
  return io({ transports: ["websocket", "polling"], reconnection: true, reconnectionDelay: 500 });
}

export function useSession(role: Role, code?: string, token?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<SessionSnapshot>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!code) return;
    const socket = createSocket();
    socketRef.current = socket;
    const watch = () => socket.emit("session:watch", {
      code, role,
      hostToken: role === "host" ? token : undefined,
      teamToken: role === "team" ? token : undefined,
    }, (result: { ok: boolean; snapshot?: SessionSnapshot; error?: string }) => {
      if (result.ok && result.snapshot) {
        setSnapshot(result.snapshot);
        setError(undefined);
      } else setError(result.error ?? "Não foi possível entrar na sessão.");
    });
    socket.on("connect", () => { setConnected(true); watch(); });
    socket.on("disconnect", () => setConnected(false));
    socket.on("session:update", setSnapshot);
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [code, role, token]);

  return { socket: socketRef, snapshot, connected, error };
}

export function formatTime(remainingMs: number | null) {
  if (remainingMs === null) return "--:--";
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
