import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = {
  stroke: "oklch(0.735 0.023 213)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  contentStyle: {
    background: "oklch(0.243 0.024 214)",
    border: "1px solid oklch(0.34 0.03 210)",
    borderRadius: 10,
    fontSize: 12,
    color: "oklch(0.975 0.006 200)",
  },
  labelStyle: { color: "oklch(0.735 0.101 179.5)" },
  cursor: { fill: "oklch(0.735 0.101 179.5 / 8%)" },
} as const;

const palette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

export function TrendChart({ data, xKey = "mes", height = 220 }: { data: Record<string, unknown>[]; xKey?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(0.34 0.03 210 / 45%)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey="ocorrencias" stroke="var(--chart-1)" strokeWidth={2} fill="url(#areaFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({
  data,
  xKey,
  yKey = "ocorrencias",
  height = 220,
  colorful = false,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey?: string;
  height?: number;
  colorful?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="oklch(0.34 0.03 210 / 45%)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey={yKey} radius={[6, 6, 0, 0]} fill="var(--chart-1)">
          {colorful &&
            data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  nameKey,
  valueKey = "valor",
  height = 220,
}: {
  data: Record<string, unknown>[];
  nameKey: string;
  valueKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Tooltip {...tooltipStyle} cursor={false} />
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          innerRadius="58%"
          outerRadius="85%"
          paddingAngle={3}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ChartLegend({ items }: { items: { label: string; value?: string }[] }) {
  return (
    <ul className="mt-3 space-y-1.5 text-xs">
      {items.map((it, i) => (
        <li key={it.label} className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: palette[i % palette.length] }} />
            {it.label}
          </span>
          {it.value && <span className="text-foreground">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}
