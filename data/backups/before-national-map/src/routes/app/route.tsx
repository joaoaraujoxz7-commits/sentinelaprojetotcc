import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  Bell,
  FileWarning,
  Home,
  LogOut,
  Map,
  MessageSquareWarning,
  ClipboardList,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/sentinela/shell";
import { sessionFn } from "@/lib/auth";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const user = await sessionFn();
    if (!user || user.role !== "citizen") throw redirect({ to: "/entrar" });
    return { user };
  },
  component: CitizenLayout,
});

const nav: NavItem[] = [
  { label: "Início", to: "/app", icon: <Home className="size-4" /> },
  { label: "Mapa", to: "/app/mapa", icon: <Map className="size-4" /> },
  { label: "Registrar ocorrência", to: "/app/registrar", icon: <FileWarning className="size-4" /> },
  { label: "Minhas ocorrências", to: "/app/ocorrencias", icon: <ClipboardList className="size-4" /> },
  { label: "Alertas", to: "/app/alertas", icon: <Bell className="size-4" /> },
  { label: "Contestação", to: "/app/contestacao", icon: <MessageSquareWarning className="size-4" /> },
  { label: "Privacidade", to: "/app/privacidade", icon: <ShieldCheck className="size-4" /> },
  { label: "Configurações", to: "/app/configuracoes", icon: <Settings className="size-4" /> },
  { label: "Sair", to: "/sair", icon: <LogOut className="size-4" /> },
];

function CitizenLayout() {
  const { user } = Route.useRouteContext();
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <AppShell
      nav={nav}
      title="População"
      showHeaderNotifications={false}
      meta={`${user.neighborhood ?? "Salvador"} · ${user.city} — ${user.state}`}
      user={{ name: `Olá, ${user.name}`, role: "Cidadã", initials }}
    >
      <Outlet />
    </AppShell>
  );
}
