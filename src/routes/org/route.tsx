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
  ShieldCheck,
  Route as RouteIcon,
  Lightbulb,
  Scale,
  DatabaseZap,
  GitCompareArrows,
  Wrench,
  TriangleAlert,
  Bot,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/sentinela/shell";
import { sessionFn } from "@/lib/auth";

export const Route = createFileRoute("/org")({
  beforeLoad: async ({ location }) => {
    const user = await sessionFn();
    if (!user || user.role !== "institutional") throw redirect({ to: "/institucional/entrar" });
    const agentOnly = ["/org/ocorrencias", "/org/analises", "/org/populacao", "/org/patrulhamentos", "/org/recomendacoes", "/org/decisoes-ia", "/org/lumia"];
    const auditorOnly = ["/org/auditoria", "/org/contestacoes", "/org/relatorios", "/org/equidade", "/org/qualidade-dados", "/org/governanca-modelos", "/org/mitigacao"];
    if (user.institutionalType === "agent" && auditorOnly.some((path) => location.pathname.startsWith(path))) throw redirect({ to: "/org" });
    if (user.institutionalType !== "agent" && agentOnly.some((path) => location.pathname.startsWith(path))) throw redirect({ to: "/org" });
    return { user };
  },
  component: OrgLayout,
});

const commonNav: NavItem[] = [
  { label: "Dashboard", to: "/org", icon: <Gauge className="size-4" /> },
  { label: "Previsões", to: "/org/previsoes", icon: <Sparkles className="size-4" /> },
];
const agentNav: NavItem[] = [
  ...commonNav,
  { label: "Mapa de risco", to: "/org/mapa", icon: <Map className="size-4" /> },
  { label: "Ocorrências", to: "/org/ocorrencias", icon: <ListChecks className="size-4" /> },
  { label: "Análises", to: "/org/analises", icon: <BarChart3 className="size-4" /> },
  { label: "População", to: "/org/populacao", icon: <Users className="size-4" /> },
  { label: "Patrulhamentos", to: "/org/patrulhamentos", icon: <RouteIcon className="size-4" /> },
  { label: "Recomendações", to: "/org/recomendacoes", icon: <Lightbulb className="size-4" /> },
  { label: "Decisões da IA", to: "/org/decisoes-ia", icon: <ShieldCheck className="size-4" /> },
  { label: "Alertas de disparidade", to: "/org/alertas-vies", icon: <TriangleAlert className="size-4" /> },
  { label: "LumIA", to: "/org/lumia", icon: <Bot className="size-4" /> },
];
const auditorNav: NavItem[] = [
  ...commonNav,
  { label: "Mapa de risco detalhado", to: "/org/mapa", icon: <Map className="size-4" /> },
  { label: "Auditoria", to: "/org/auditoria", icon: <ScrollText className="size-4" /> },
  { label: "Contestações", to: "/org/contestacoes", icon: <MessageSquareWarning className="size-4" /> },
  { label: "Relatórios", to: "/org/relatorios", icon: <FileBarChart className="size-4" /> },
  { label: "Equidade", to: "/org/equidade", icon: <Scale className="size-4" /> },
  { label: "Qualidade dos dados", to: "/org/qualidade-dados", icon: <DatabaseZap className="size-4" /> },
  { label: "Governança de modelos", to: "/org/governanca-modelos", icon: <GitCompareArrows className="size-4" /> },
  { label: "Mitigação", to: "/org/mitigacao", icon: <Wrench className="size-4" /> },
];

function OrgLayout() {
  const { user } = Route.useRouteContext();
  const profile = user.institutionalType === "agent" ? "Agente policial" : "Auditor";
  const nav: NavItem[] = [
    ...(user.institutionalType === "agent" ? agentNav : auditorNav),
    { label: "Notificações", to: "/org/notificacoes", icon: <Bell className="size-4" /> },
    { label: "Configurações", to: "/org/configuracoes", icon: <Settings className="size-4" /> },
    { label: "Sair", to: "/sair", icon: <LogOut className="size-4" /> },
  ];
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <AppShell
      nav={nav}
      title={profile}
      meta={`${user.institution ?? "Órgão público"} · ${user.city} — ${user.state}`}
      user={{ name: user.name, role: profile, initials }}
    >
      <Outlet />
    </AppShell>
  );
}
