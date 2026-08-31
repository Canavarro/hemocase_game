import { describe, expect, it } from "vitest";
import { createDb, GameDb } from "./db.js";

describe("persistência opcional (Neon/Postgres)", () => {
  it("fica desativada sem DATABASE_URL — o jogo segue 100% em memória", () => {
    expect(createDb(undefined)).toBeUndefined();
    expect(createDb("")).toBeUndefined();
  });

  it("com DATABASE_URL, expõe a interface completa sem conectar de imediato", async () => {
    const db = createDb("postgres://user:pass@example.neon.tech/genetic_game?sslmode=require");
    expect(db).toBeInstanceOf(GameDb);
    expect(typeof db!.ensureSchema).toBe("function");
    expect(typeof db!.saveFinishedSession).toBe("function");
    expect(typeof db!.fetchRankings).toBe("function");
    await db!.close();
  });
});
