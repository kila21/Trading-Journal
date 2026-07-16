"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

// Fixed logical coordinate space — the <svg> scales to its container via
// `width="100%"` + viewBox, so these are units, not pixels.
const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 28, left: 44 };
const INNER_WIDTH = WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

export interface EquityCurvePoint {
  point: number;
  value: number;
}

/** Rounds a span to a "nice" step (1/2/5 * 10^n) so axis ticks land on clean numbers. */
function niceNumber(value: number, round: boolean): number {
  if (value === 0) return 0;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  let niceFraction: number;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  return niceFraction * 10 ** exponent;
}

function niceTicks(min: number, max: number, tickCount = 4): number[] {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const step = niceNumber(niceNumber(max - min, false) / (tickCount - 1), true) || 1;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) ticks.push(Math.round(v));
  return ticks;
}

function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const compact = abs >= 1000 ? `${Math.round(abs / 100) / 10}k` : String(Math.round(abs));
  return value < 0 ? `-${compact}` : compact;
}

/**
 * Generic cumulative-value line chart (equity curve). Copy-free and
 * trade-agnostic on purpose — the dashboard overview feeds it this month's
 * running P&L, and a future analytics page can feed it a different range
 * without this component changing.
 */
export function EquityCurveChart({
  data,
  formatValue = (value) => value.toLocaleString("en-US"),
  pointLabel = (point) => `Point ${point}`,
  emptyMessage,
  className,
}: {
  data: EquityCurvePoint[];
  formatValue?: (value: number) => string;
  pointLabel?: (point: number) => string;
  emptyMessage?: string;
  className?: string;
}) {
  const gradientId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const hasTrades = data.length > 1;
  const values = data.map((d) => d.value);
  const yTicks = niceTicks(Math.min(0, ...values), Math.max(0, ...values));
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];
  const maxPoint = data.length > 0 ? data[data.length - 1].point : 1;

  const xScale = (point: number) => PADDING.left + (maxPoint === 0 ? 0 : (point / maxPoint) * INNER_WIDTH);
  const yScale = (value: number) =>
    PADDING.top + INNER_HEIGHT - ((value - yMin) / (yMax - yMin || 1)) * INNER_HEIGHT;

  const coords = data.map((d) => ({ ...d, x: xScale(d.point), y: yScale(d.value) }));
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const baselineY = yScale(yMin);
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`
      : "";

  const active = activeIndex !== null ? coords[activeIndex] : null;
  const activeLeftPercent = active ? Math.min(92, Math.max(8, (active.x / WIDTH) * 100)) : 0;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={
          hasTrades
            ? `Equity curve, ending at ${formatValue(values[values.length - 1])}`
            : (emptyMessage ?? "No trades yet")
        }
      >
        <defs>
          <clipPath id={`${gradientId}-clip`}>
            <rect x={PADDING.left} y={PADDING.top} width={INNER_WIDTH} height={INNER_HEIGHT} />
          </clipPath>
        </defs>

        {/* Gridlines — recessive hairlines, one step off the surface color */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text x={PADDING.left - 8} y={yScale(tick)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-[10px]">
              {formatCompact(tick)}
            </text>
          </g>
        ))}

        {hasTrades && (
          <g clipPath={`url(#${gradientId}-clip)`}>
            <path d={areaPath} fill="var(--success)" fillOpacity={0.1} stroke="none" />
          </g>
        )}

        {hasTrades && <path d={linePath} fill="none" stroke="var(--success)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

        {/* X-axis point labels (trade sequence) */}
        {coords
          .filter((c) => c.point > 0)
          .map((c) => (
            <text key={c.point} x={c.x} y={HEIGHT - PADDING.bottom + 18} textAnchor="middle" className="fill-muted text-[10px]">
              {c.point}
            </text>
          ))}

        {/* Crosshair on hover/focus */}
        {active && (
          <line x1={active.x} x2={active.x} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} stroke="var(--border)" strokeWidth={1} />
        )}

        {/* Directional dots (skip the synthetic point-0 baseline) + invisible hit targets */}
        {coords.slice(1).map((c, i) => {
          const prevValue = coords[i].value;
          const tone = c.value > prevValue ? "var(--success)" : c.value < prevValue ? "var(--danger)" : "var(--muted)";
          const isActive = activeIndex === i + 1;
          return (
            <g key={c.point}>
              <circle cx={c.x} cy={c.y} r={isActive ? 6 : 4} fill={tone} stroke="var(--surface)" strokeWidth={2} />
              <circle
                cx={c.x}
                cy={c.y}
                r={12}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${pointLabel(c.point)}: ${formatValue(c.value)}`}
                onMouseEnter={() => setActiveIndex(i + 1)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(i + 1)}
                onBlur={() => setActiveIndex(null)}
                className="cursor-pointer outline-none"
              />
            </g>
          );
        })}

        {/* Endpoint value label */}
        {hasTrades && (
          <text
            x={coords[coords.length - 1].x}
            y={coords[coords.length - 1].y - 12}
            textAnchor="end"
            className="fill-foreground text-xs font-semibold"
          >
            {formatValue(values[values.length - 1])}
          </text>
        )}
      </svg>

      {!hasTrades && emptyMessage && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">{emptyMessage}</p>
      )}

      {active && active.point > 0 && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `${activeLeftPercent}%` }}
        >
          <p className="font-semibold text-foreground">{formatValue(active.value)}</p>
          <p className="text-muted">{pointLabel(active.point)}</p>
        </div>
      )}
    </div>
  );
}
