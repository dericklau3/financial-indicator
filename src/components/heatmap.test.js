import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Heatmap } from "./heatmap.js";

describe("Heatmap", () => {
  test("does not render a monthly returns update button", () => {
    const html = renderToStaticMarkup(
      React.createElement(Heatmap, {
        data: [{ month: "2026-03", returnPct: 1.2 }],
        onUpdate: () => {},
      })
    );

    expect(html.includes("更新月度回报")).toBe(false);
  });
});
