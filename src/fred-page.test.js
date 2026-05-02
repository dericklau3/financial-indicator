import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const mainSource = readFileSync(new URL("./main.js", import.meta.url), "utf8");

describe("FRED page wiring", () => {
  test("adds a FRED sidebar view backed by the official T5YIFR graph page embed", () => {
    expect(mainSource).toContain('id: "fred"');
    expect(mainSource).toContain('src: "https://fred.stlouisfed.org/graph/?id=T5YIFR"');
    expect(mainSource).toContain('title: "FRED T5YIFR series page"');
  });
});
