import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, StatCard, Disclaimer } from "@/components/sentinela/ui-kit";
import { TrendChart, BarsChart, DonutChart, ChartLegend } from "@/components/sentinela/charts";
import { Button } from "@/components/ui/button";
import { listRecordsFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/org/")({
  head: () => ({ meta: [{ title: "Dashboard operacional — Sentinela Institucional" }] }),
  component: OrgDashboard,
});

type DashboardData = { occurrences: ManagedRecord[]; predictions: ManagedRecord[]; notifications: ManagedRecord[]; contests: ManagedRecord[] };
const empty: DashboardData = { occurrences: [], predictions: [], notifications: [], contests: [] };

function OrgDashboard() {
  const { user } = getRouteApi("/org").useRouteContext();
  const [data, setData] = useState(empty);
  useEffect(() => { void Promise.all([
    listRecordsFn({ data: { kind: "occurrences" } }), listRecordsFn({ data: { kind: "predictions" } }),
    listRecordsFn({ data: { kind: "notifications" } }), listRecordsFn({ data: { kind: "contests" } }),
  ]).then(([occurrences, predictions, notifications, contests]) => setData({ occurrences, predictions, notifications, contests })); }, []);

  const metrics = useMemo(() => calculateDashboard(data), [data]);
  return <div className="space-y-6">
    <PageHeader title="Dashboard operacional" description={`${user.institution ?? "Órgão público"} — Salvador · BA`} action={<Button asChild variant="secondary"><Link to="/org/relatorios">Gerenciar relatórios</Link></Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Ocorrências (30 dias)" value={String(metrics.recent.length)} />
      <StatCard label="Confirmadas" value={String(metrics.confirmed)} tone="success" delta={percent(metrics.confirmed, metrics.recent.length)} />
      <StatCard label="Origem população" value={String(metrics.population)} delta={percent(metrics.population, metrics.recent.length)} />
      <StatCard label="Origem registros policiais" value={String(metrics.police)} delta={percent(metrics.police, metrics.recent.length)} />
      <StatCard label="Confiabilidade média das previsões" value={`${metrics.predictionConfidence}%`} hint="Média das previsões cadastradas no banco." />
      <StatCard label="Áreas em atenção" value={String(metrics.attentionAreas)} tone="warning" />
      <StatCard label="Alertas ativos" value={String(metrics.activeAlerts)} tone="danger" />
      <StatCard label="Contestações pendentes" value={String(metrics.pendingContests)} tone="warning" />
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel title="Evolução das ocorrências (3 meses)" className="xl:col-span-2"><ChartOrEmpty empty={metrics.monthly.every((item) => item.ocorrencias === 0)}><TrendChart data={metrics.monthly} height={260} /></ChartOrEmpty></Panel>
      <Panel title="Distribuição por tipo"><ChartOrEmpty empty={metrics.byType.length === 0}><DonutChart data={metrics.byType} nameKey="tipo" height={190} /><ChartLegend items={metrics.byType.map((item) => ({ label: String(item.tipo), value: String(item.valor) }))} /></ChartOrEmpty></Panel>
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel title="Ocorrências por dia da semana"><ChartOrEmpty empty={metrics.weekdays.every((item) => item.ocorrencias === 0)}><BarsChart data={metrics.weekdays} xKey="dia" /></ChartOrEmpty></Panel>
      <Panel title="Horários de maior concentração"><ChartOrEmpty empty={metrics.hours.every((item) => item.ocorrencias === 0)}><BarsChart data={metrics.hours} xKey="hora" /></ChartOrEmpty></Panel>
      <Panel title="Origem das ocorrências"><ChartOrEmpty empty={metrics.bySource.length === 0}><DonutChart data={metrics.bySource} nameKey="origem" height={190} /><ChartLegend items={metrics.bySource.map((item) => ({ label: String(item.origem), value: String(item.valor) }))} /></ChartOrEmpty></Panel>
    </div>
    <Disclaimer>Todos os números acima são calculados diretamente das tabelas do banco de dados. Nenhum valor demonstrativo é exibido.</Disclaimer>
  </div>;
}

function calculateDashboard(data: DashboardData) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const recent = data.occurrences.filter((item) => !item.eventDate || new Date(`${item.eventDate}T12:00:00`) >= cutoff);
  const confirmed = recent.filter((item) => item.status.toLowerCase().includes("confirm")).length;
  const population = recent.filter((item) => item.source.toLowerCase().includes("popula")).length;
  const police = recent.filter((item) => item.source.toLowerCase().includes("polic")).length;
  const predictionConfidence = data.predictions.length ? Math.round(data.predictions.reduce((sum, item) => sum + item.confidence, 0) / data.predictions.length) : 0;
  const attentionAreas = new Set(data.predictions.filter((item) => !isClosed(item.status)).map((item) => item.region)).size;
  const activeAlerts = data.notifications.filter((item) => !isClosed(item.status)).length;
  const pendingContests = data.contests.filter((item) => !isClosed(item.status)).length;
  const count = (items: ManagedRecord[], key: (item: ManagedRecord) => string) => Object.entries(items.reduce<Record<string, number>>((acc, item) => { const value = key(item) || "Não informado"; acc[value] = (acc[value] ?? 0) + 1; return acc; }, {}));
  const byType = count(recent, (item) => item.title).map(([tipo, valor]) => ({ tipo, valor }));
  const bySource = count(recent, (item) => item.source).map(([origem, valor]) => ({ origem, valor }));
  const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weekdays = weekdayNames.map((dia, index) => ({ dia, ocorrencias: recent.filter((item) => item.eventDate && new Date(`${item.eventDate}T12:00:00`).getDay() === index).length }));
  const hourLabels = ["00h", "04h", "08h", "12h", "16h", "20h"];
  const hours = hourLabels.map((hora, index) => ({ hora, ocorrencias: recent.filter((item) => item.eventTime && Math.floor(Number(item.eventTime.slice(0, 2)) / 4) === index).length }));
  const now = new Date();
  const monthly = Array.from({ length: 3 }, (_, offset) => { const date = new Date(now.getFullYear(), now.getMonth() - (2 - offset), 1); const month = date.toLocaleDateString("pt-BR", { month: "short" }); return { mes: month, ocorrencias: data.occurrences.filter((item) => { const event = new Date(`${item.eventDate}T12:00:00`); return event.getFullYear() === date.getFullYear() && event.getMonth() === date.getMonth(); }).length }; });
  return { recent, confirmed, population, police, predictionConfidence, attentionAreas, activeAlerts, pendingContests, byType, bySource, weekdays, hours, monthly };
}

function isClosed(status: string) { return ["concluído", "concluída", "encerrado", "encerrada", "cancelado", "cancelada"].includes(status.toLowerCase()); }
function percent(value: number, total: number) { return total ? `${Math.round(value / total * 100)}% do total` : "0% do total"; }
function ChartOrEmpty({ empty, children }: { empty: boolean; children: React.ReactNode }) { return empty ? <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">Os dados aparecerão após o primeiro cadastro.</p> : <>{children}</>; }
