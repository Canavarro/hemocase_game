import { describe, expect, it } from "vitest";
import { formatTime } from "./socket";

describe("formatTime", () => {
  it("formata o relógio sem produzir valores negativos", () => {
    expect(formatTime(30 * 60 * 1000)).toBe("30:00");
    expect(formatTime(9_001)).toBe("00:10");
    expect(formatTime(-1)).toBe("00:00");
    expect(formatTime(null)).toBe("--:--");
  });
});
