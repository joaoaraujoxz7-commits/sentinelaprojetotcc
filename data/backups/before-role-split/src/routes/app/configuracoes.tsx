import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { SettingsView } from "@/components/sentinela/settings-view";

export const Route = createFileRoute("/app/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações da conta — Sentinela" },
      {
        name: "description",
        content: "Ajuste conta, notificações, privacidade, acessibilidade e segurança no Sentinela.",
      },
      { property: "og:title", content: "Configurações — Sentinela" },
      { property: "og:description", content: "Conta, notificações, privacidade e acessibilidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const { user } = getRouteApi("/app").useRouteContext();
  return <SettingsView user={user} />;
}
