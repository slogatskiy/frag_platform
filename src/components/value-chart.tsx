// Área-график роста стоимости коллекции. Чистый inline-SVG (без внешних либ,
// self-contained под CSP). Точки — накопленная стоимость по датам добавления.
export function ValueChart({
  points,
  fmt,
}: {
  points: { label: string; v: number }[];
  fmt: (n: number) => string;
}) {
  const W = 640;
  const H = 200;
  const padX = 4;
  const padTop = 14;
  const padBottom = 4;

  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.02] text-sm text-neutral-500">
        Add a few more bottles to see your value grow over time.
      </div>
    );
  }

  const vs = points.map((p) => p.v);
  const max = Math.max(...vs);
  const n = points.length;

  const xs = points.map((_, i) => padX + (i / (n - 1)) * (W - 2 * padX));
  const ys = points.map(
    (p) => H - padBottom - (p.v / (max || 1)) * (H - padTop - padBottom)
  );

  const line = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${line} L${xs[n - 1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 200 }}>
        <defs>
          <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(251 191 36)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(251 191 36)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#valueFill)" />
        <path d={line} fill="none" stroke="rgb(252 211 77)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {/* последняя точка */}
        <circle cx={xs[n - 1]} cy={ys[n - 1]} r="3.5" fill="rgb(252 211 77)" />
      </svg>
      <div className="mt-2 flex justify-between text-xs text-neutral-600">
        <span>{points[0].label}</span>
        <span className="text-amber-200/80">{fmt(points[n - 1].v)}</span>
        <span>{points[n - 1].label}</span>
      </div>
    </div>
  );
}
