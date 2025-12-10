import React, { useEffect, useRef } from "react";
import { formatMonth, formatPct } from "../utils/format.js";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function calculateReturnStats(data) {
  if (!data.length) {
    return {
      cagr: 0,
      best: null,
      worst: null,
      winRate: 0,
      avg: 0,
      std: 0,
    };
  }
  const months = data.length;
  const totalReturn = data.reduce((acc, m) => acc * (1 + m.returnPct / 100), 1);
  const cagr = Math.pow(totalReturn, 12 / months) - 1;

  let best = data[0];
  let worst = data[0];
  let wins = 0;
  let sum = 0;

  data.forEach((m) => {
    if (m.returnPct > best.returnPct) best = m;
    if (m.returnPct < worst.returnPct) worst = m;
    if (m.returnPct > 0) wins += 1;
    sum += m.returnPct;
  });

  const avg = sum / months;
  const variance =
    data.reduce((acc, m) => acc + Math.pow(m.returnPct - avg, 2), 0) / months;
  const std = Math.sqrt(variance);

  return {
    cagr,
    best,
    worst,
    winRate: wins / months,
    avg,
    std,
  };
}

export function renderReturnsChart(canvas, data) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  if (!data.length) return;

  const max = Math.max(...data.map((d) => d.returnPct));
  const min = Math.min(...data.map((d) => d.returnPct));
  const maxAbs = Math.max(Math.abs(max), Math.abs(min), 0.1);
  const padding = 40;
  const chartH = height - padding * 2;
  const scale = chartH / (maxAbs * 2);
  const zeroY = padding + maxAbs * scale;

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  [maxAbs, 0, -maxAbs].forEach((val) => {
    const y = zeroY - val * scale;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(formatPct(val, 1), 6, y + 4);
  });

  const barWidth = (width - padding * 2) / data.length;
  data.forEach((point, idx) => {
    const x = padding + idx * barWidth + barWidth * 0.1;
    const barH = point.returnPct * scale;
    const y = zeroY - barH;
    const color =
      point.returnPct >= 0 ? "rgba(109, 213, 140, 0.9)" : "rgba(255, 107, 107, 0.9)";
    ctx.fillStyle = color;
    const bw = barWidth * 0.8;
    ctx.fillRect(x, y, bw, barH);

    // Highlight latest month with a glow
    if (idx === data.length - 1) {
      ctx.strokeStyle = "rgba(93, 214, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, bw + 2, barH + 2);
    }
  });

  // Month labels every 6 months
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "11px Inter, sans-serif";
  data.forEach((point, idx) => {
    if (idx % 6 !== 0 && idx !== data.length - 1) return;
    const x = padding + idx * barWidth + barWidth * 0.4;
    ctx.fillText(formatMonth(point.month), clamp(x, 6, width - 60), height - 10);
  });
}

export function ReturnsChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderReturnsChart(canvasRef.current, data);
    }
  }, [data]);

  return React.createElement("canvas", {
    ref: canvasRef,
    width: 1200,
    height: 340,
  });
}
