"use client";

/**
 * Sparkline — a tiny inline trend chart for KPI numbers.
 *
 * Designed to live RIGHT NEXT TO a number, not as a standalone chart.
 * Stripe / Linear use this pattern everywhere: instead of bare "$12,340"
 * you get "$12,340 ▁▃▅▆▇" — same horizontal real-estate, doubled signal.
 *
 * Pure SVG, no chart library. Auto-scales to the min/max of the data.
 * Renders nothing for empty / constant series.
 */
import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Stroke colour. Defaults to `currentColor` so it inherits the parent's
   *  text colour — easy to tint via a wrapper `<span className="text-...">`. */
  color?: string;
  /** Pre-rendered label of the latest value's delta vs first value.
   *  When supplied we render a faint baseline at y(first). */
  showBaseline?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 72,
  height = 20,
  color = "currentColor",
  showBaseline = false,
  className,
}: SparklineProps) {
  const { points, baselineY, lastX, lastY, areaPath } = useMemo(() => {
    if (data.length < 2) {
      return { points: "", baselineY: 0, lastX: 0, lastY: 0, areaPath: "" };
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const ys = data.map((v) => height - ((v - min) / range) * height);
    const pts = data.map((_, i) => `${i * stepX},${ys[i]}`).join(" ");
    const area =
      `M0,${height} L` +
      data.map((_, i) => `${i * stepX},${ys[i]}`).join(" L") +
      ` L${width},${height} Z`;
    return {
      points: pts,
      baselineY: ys[0],
      lastX: (data.length - 1) * stepX,
      lastY: ys[ys.length - 1],
      areaPath: area,
    };
  }, [data, width, height]);

  if (data.length < 2) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible inline-block align-middle ${className ?? ""}`}
      aria-hidden="true"
    >
      {/* Faint area under the line — gives weight without ink */}
      <path d={areaPath} fill={color} opacity={0.08} />
      {showBaseline && (
        <line
          x1={0}
          y1={baselineY}
          x2={width}
          y2={baselineY}
          stroke={color}
          strokeDasharray="2 2"
          opacity={0.25}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last-point dot */}
      <circle cx={lastX} cy={lastY} r={1.75} fill={color} />
    </svg>
  );
}

/**
 * Generate a deterministic pseudo-random time series for a given seed
 * (e.g. `user.id`) — used while real time-series APIs aren't wired up.
 * Same seed always produces same series so screenshots stay stable.
 *
 * `direction` biases the overall trend; `volatility` controls noise.
 */
export function pseudoSeries(
  seed: string,
  points: number,
  baseline: number,
  options: { volatility?: number; direction?: number } = {},
): number[] {
  const { volatility = 0.12, direction = 0 } = options;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = ((h ^ seed.charCodeAt(i)) >>> 0) * 16777619;
  }
  const out: number[] = [];
  let cur = baseline;
  for (let i = 0; i < points; i++) {
    h = (h * 16807) | 0;
    const noise = (((h >>> 8) & 0xff) / 256 - 0.5) * volatility;
    cur = cur * (1 + noise + direction / points);
    out.push(Math.max(0, cur));
  }
  return out;
}
