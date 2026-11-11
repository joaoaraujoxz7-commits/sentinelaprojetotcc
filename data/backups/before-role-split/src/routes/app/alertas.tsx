import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, FileText, Sparkles, Clock } from "lucide-react";
import { PageHeader, Panel, StatusPill } from "@/components/sentinela/ui-kit";
import { myCitizenAlertsFn } from "@/lib/records";

export const Route = createFileRoute("/app/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas e notificações — Sentinela" },
      {
        name: "description",
        content: "Central de notificações: ocorrências, contestações, revisões, alertas e relatórios.",
      },
      { property: "og:title", content: "Alertas e notificações — Sentinela" },
      { property: "og:description", content: "Acompanhe atualizações do seu acesso no Sentinela." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Alertas,
});

const icons: Record<string, React.ReactNode> = {
  "Ocorrência atualizada": <FileText className="size-4" />,
  "Contestação atualizada": <Clock className="size-4" />,
  "Revisão concluída": <CheckCircle2 className="size-4" />,
  "Alerta de segurança": <AlertTriangle className="size-4" />,
  "Relatório disponível": <FileText className="size-4" />,
  "Previsão atualizada": <Sparkles className="size-4" />,
};

export function NotificationList() {
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; text: string; status: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = () => myCitizenAlertsFn().then(setNotifications).finally(() => setLoading(false));
    void load();
    const timer = window.setInterval(() => { void load(); }, 10000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <Panel key={n.id} className="flex items-start gap-4">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            {icons[n.type] ?? <Bell className="size-4" />}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={n.status === "Encerrada" || n.status === "Confirmada" ? "success" : n.status === "Em análise" ? "warning" : "info"}>{n.type}</StatusPill>
              <span className="text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{n.text}</p>
          </div>
        </Panel>
      ))}
      {!loading && notifications.length === 0 && <Panel><p className="text-sm text-muted-foreground">Você ainda não possui alertas.</p></Panel>}
      {loading && <p className="text-sm text-muted-foreground">Carregando seus alertas...</p>}
    </div>
  );
}

function Alertas() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Alertas" description="Atualizações sobre seus registros e sua região." />
      <NotificationList />
    </div>
  );
}
