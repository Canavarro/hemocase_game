import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import QRCode from "qrcode";
import { Server as SocketServer, type Socket } from "socket.io";
import {
  answerSchema, hostActionSchema, integritySchema, joinSessionSchema, watchSessionSchema,
  type GameContent, type IntegrityPolicy,
} from "@hemocase/shared";
import { GameEngine, type SessionState } from "./game-engine.js";
import { findPrivateIpv4 } from "./network.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const contentPath = path.resolve(rootDir, "content/game.pt-BR.json");
const webDist = path.resolve(rootDir, "apps/web/dist");
const content = JSON.parse(fs.readFileSync(contentPath, "utf8")) as GameContent;
const engine = new GameEngine(content);
const app = Fastify({ logger: true, bodyLimit: 64 * 1024 });
const io = new SocketServer(app.server, { maxHttpBufferSize: 64 * 1024 });
const port = Number(process.env.PORT ?? 3000);
const lanIp = process.env.HOST_IP ?? findPrivateIpv4();
const publicBaseUrl = process.env.PUBLIC_URL ?? `http://${lanIp}:${port}`;

declare module "socket.io" {
  interface SocketData {
    role?: "host" | "screen" | "team";
    code?: string;
    teamToken?: string;
  }
}

app.get("/api/health", async () => ({ ok: true, lanIp, port }));

app.post<{ Body: { integrityPolicy?: IntegrityPolicy } }>("/api/sessions", async (request, reply) => {
  const session = engine.createSession(publicBaseUrl, request.body?.integrityPolicy ?? "ZERO_ROUND");
  reply.code(201);
  return { code: session.code, hostToken: session.hostToken, joinUrl: session.joinUrl, screenUrl: `${publicBaseUrl}/screen/${session.code}` };
});

app.get<{ Params: { code: string } }>("/api/sessions/:code/public", async (request, reply) => {
  const session = engine.getSession(request.params.code);
  if (!session) return reply.code(404).send({ error: "Sessão não encontrada." });
  return engine.snapshot(session, "screen");
});

app.get<{ Params: { code: string } }>("/api/sessions/:code/qr", async (request, reply) => {
  const session = engine.getSession(request.params.code);
  if (!session) return reply.code(404).send({ error: "Sessão não encontrada." });
  const image = await QRCode.toBuffer(session.joinUrl, { margin: 2, width: 560, color: { dark: "#090909", light: "#ffffff" } });
  return reply.type("image/png").send(image);
});

app.get<{ Params: { code: string }; Querystring: { token?: string; format?: string } }>("/api/sessions/:code/export", async (request, reply) => {
  try {
    const session = engine.requireHost(request.params.code, request.query.token ?? "");
    if (request.query.format === "csv") {
      return reply.type("text/csv; charset=utf-8").header("content-disposition", `attachment; filename=hemocase-${session.code}.csv`).send(`\uFEFF${engine.exportCsv(session)}`);
    }
    return reply.header("content-disposition", `attachment; filename=hemocase-${session.code}.json`).send(engine.exportSession(session));
  } catch (error) {
    return reply.code(401).send({ error: error instanceof Error ? error.message : "Não autorizado." });
  }
});

io.on("connection", (socket) => {
  socket.on("session:join", async (raw, acknowledge) => {
    try {
      const payload = joinSessionSchema.parse(raw);
      const result = engine.join(payload.code, payload.name, payload.teamToken);
      bindSocket(socket, result.session, "team", result.team.token);
      acknowledge({ ok: true, teamToken: result.team.token, restored: result.restored, snapshot: engine.snapshot(result.session, "team", result.team.token) });
      await broadcast(result.session);
    } catch (error) {
      acknowledge({ ok: false, error: message(error) });
    }
  });

  socket.on("session:watch", async (raw, acknowledge) => {
    try {
      const payload = watchSessionSchema.parse(raw);
      const session = engine.getSession(payload.code);
      if (!session) throw new Error("Sessão não encontrada.");
      if (payload.role === "host") engine.requireHost(payload.code, payload.hostToken ?? "");
      if (payload.role === "team") {
        const restored = engine.join(payload.code, undefined, payload.teamToken);
        bindSocket(socket, session, "team", restored.team.token);
      } else {
        bindSocket(socket, session, payload.role);
      }
      acknowledge({ ok: true, snapshot: engine.snapshot(session, payload.role, payload.teamToken) });
      await broadcast(session);
    } catch (error) {
      acknowledge({ ok: false, error: message(error) });
    }
  });

  socket.on("answer:submit", async (raw, acknowledge) => {
    try {
      const payload = answerSchema.parse(raw);
      const result = engine.submitAnswer(payload.code, payload.teamToken, payload.questionId, payload.choiceId);
      acknowledge({ ok: true, correct: result.correct, awardedPoints: result.awardedPoints });
      await broadcast(result.session);
    } catch (error) {
      acknowledge({ ok: false, error: message(error) });
    }
  });

  socket.on("integrity:event", async (raw, acknowledge) => {
    try {
      const payload = integritySchema.parse(raw);
      const result = engine.registerIntegrity(payload.code, payload.teamToken, payload.type, payload.hiddenDurationMs);
      acknowledge?.({ ok: true, classification: result.incident.classification });
      await broadcast(result.session);
    } catch (error) {
      acknowledge?.({ ok: false, error: message(error) });
    }
  });

  socket.on("host:action", async (raw, acknowledge) => {
    try {
      const action = hostActionSchema.parse(raw);
      const session = engine.applyHostAction(action);
      acknowledge({ ok: true });
      await broadcast(session);
    } catch (error) {
      acknowledge({ ok: false, error: message(error) });
    }
  });

  socket.on("disconnect", async () => {
    if (socket.data.role === "team" && socket.data.code && socket.data.teamToken) {
      const activeSession = engine.getSession(socket.data.code);
      if (activeSession && activeSession.phase !== "LOBBY") {
        try { engine.registerIntegrity(socket.data.code, socket.data.teamToken, "disconnect"); } catch { /* session may already be gone */ }
      }
      engine.disconnect(socket.data.code, socket.data.teamToken);
      const session = engine.getSession(socket.data.code);
      if (session) await broadcast(session);
    }
  });
});

function bindSocket(socket: Socket, session: SessionState, role: "host" | "screen" | "team", teamToken?: string) {
  if (socket.data.code) socket.leave(socket.data.code);
  socket.data = { role, code: session.code, teamToken };
  socket.join(session.code);
}

async function broadcast(session: SessionState) {
  const sockets = await io.in(session.code).fetchSockets();
  for (const socket of sockets) {
    const role = socket.data.role ?? "screen";
    socket.emit("session:update", engine.snapshot(session, role, socket.data.teamToken));
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "A operação não pôde ser concluída.";
}

setInterval(async () => {
  for (const session of engine.tick()) await broadcast(session);
  for (const session of engine.sessions.values()) {
    if (session.phaseStartedAt) await broadcast(session);
  }
}, 1000).unref();

if (fs.existsSync(webDist)) {
  await app.register(fastifyStatic, { root: webDist });
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api/")) return reply.code(404).send({ error: "Rota não encontrada." });
    return reply.type("text/html").sendFile("index.html");
  });
}

await app.listen({ host: "0.0.0.0", port });
app.log.info(`HEMOCASE Host: http://127.0.0.1:${port}/host`);
app.log.info(`Acesso na rede local: ${publicBaseUrl}`);
