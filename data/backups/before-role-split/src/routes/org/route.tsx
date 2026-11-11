import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  FileBarChart,
  Gauge,
  ListChecks,
  Map,
  MessageSquareWarning,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  LogOut,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/sentinela/shell";
import { sessionFn } from "@/lib/auth";

export const Route = createFileRoute("/org")({
  beforeLoad: async () => {
    const user = await sessionFn();
    if (!user || user.role !== "institutional") throw redirect({ to: "/institucional/entrar" });
    return { user };
  },
  component: OrgLayout,
});

const nav: NavItem[] = [
  { label: "Dashboard", to: "/org", icon: <Gauge className="size-4" /> },
  { label: "Mapa", to: "/org/mapa", icon: <Map className="size-4" /> },
  { label: "Ocorrências", to: "/org/ocorrencias", icon: <ListChecks className="size-4" /> },
  { label: "Previsões", to: "/org/previsoes", icon: <Sparkles className="size-4" /> },
  { label: "Análises", to: "/org/analises", icon: <BarChart3 className="size-4" /> },
  { label: "População", to: "/org/populacao", icon: <Users className="size-4" /> },
  { label: "Auditoria", to: "/org/auditoria", icon: <ScrollText className="size-4" /> },
  { label: "Contestações", to: "/org/contestacoes", icon: <MessageSquareWarning className="size-4" /> },
  { label: "Relatórios", to: "/org/relatorios", icon: <FileBarChart className="size-4" /> },
  { label: "Notificações", to: "/org/notificacoes", icon: <Bell className="size-4" /> },
  { label: "Configurações", to: "/org/configuracoes", icon: <Settings className="size-4" /> },
  { label: "Sair", to: "/sair", icon: <LogOut className="size-4" /> },
];

function OrgLayout() {
  const { user } = Route.useRouteContext();
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <AppShell
      nav={nav}
      title="Institucional"
      meta={`${user.institution ?? "Órgão público"} · Salvador — BA`}
      user={{ name: user.name, role: "Institucional", initials }}
    >
      <Outlet />
    </AppShell>
  );
}
