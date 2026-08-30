import assert from "node:assert/strict";
import { io } from "socket.io-client";

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const response = await fetch(`${baseUrl}/api/sessions`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ integrityPolicy: "ZERO_ROUND" }),
});
assert.equal(response.status, 201);
const created = await response.json();
assert.match(created.code, /^[A-F0-9]{6}$/);
assert.ok(created.hostToken.length >= 16);

const unauthorized = await fetch(`${baseUrl}/api/sessions/${created.code}/export?token=invalid`);
assert.equal(unauthorized.status, 401);

const teamSocket = io(baseUrl, { transports: ["websocket"] });
await once(teamSocket, "connect");
const joined = await emit(teamSocket, "session:join", { code: created.code, name: "Equipe Integração" });
assert.equal(joined.ok, true);
assert.equal(joined.snapshot.phase, "LOBBY");
assert.equal(joined.snapshot.teamName, "Equipe Integração");

const hostSocket = io(baseUrl, { transports: ["websocket"] });
await once(hostSocket, "connect");
const watched = await emit(hostSocket, "session:watch", { code: created.code, role: "host", hostToken: created.hostToken });
assert.equal(watched.ok, true);
assert.equal(watched.snapshot.teams.length, 1);

assert.equal((await emit(hostSocket, "host:action", { code: created.code, hostToken: created.hostToken, action: "advance" })).ok, true);
assert.equal((await emit(hostSocket, "host:action", { code: created.code, hostToken: created.hostToken, action: "advance" })).ok, true);

const restored = await emit(teamSocket, "session:watch", { code: created.code, role: "team", teamToken: joined.teamToken });
assert.equal(restored.snapshot.phase, "WARMUP");
assert.equal(restored.snapshot.question.id, "W1");

const answer = await emit(teamSocket, "answer:submit", { code: created.code, teamToken: joined.teamToken, questionId: "W1", choiceId: "A" });
assert.equal(answer.ok, true);
assert.ok(answer.awardedPoints >= 5);
const duplicate = await emit(teamSocket, "answer:submit", { code: created.code, teamToken: joined.teamToken, questionId: "W1", choiceId: "A" });
assert.equal(duplicate.ok, false);

teamSocket.disconnect();
const reconnectSocket = io(baseUrl, { transports: ["websocket"] });
await once(reconnectSocket, "connect");
const reconnected = await emit(reconnectSocket, "session:join", { code: created.code, teamToken: joined.teamToken });
assert.equal(reconnected.ok, true);
assert.equal(reconnected.restored, true);
assert.equal(reconnected.snapshot.answerAccepted, true);

const exported = await fetch(`${baseUrl}/api/sessions/${created.code}/export?token=${encodeURIComponent(created.hostToken)}`);
assert.equal(exported.status, 200);
const report = await exported.json();
assert.equal(report.teams[0].name, "Equipe Integração");
assert.ok(report.teams[0].score >= 5);

reconnectSocket.disconnect();
hostSocket.disconnect();
console.log(`Fluxo integrado validado: sessão ${created.code}, entrada, resposta, duplicidade, reconexão e exportação.`);

function once(socket, event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout aguardando ${event}`)), 5000);
    socket.once(event, (...args) => { clearTimeout(timer); resolve(args); });
  });
}

function emit(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout em ${event}`)), 5000);
    socket.emit(event, payload, (result) => { clearTimeout(timer); resolve(result); });
  });
}
