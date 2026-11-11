import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { SettingsView } from "@/components/sentinela/settings-view";

export const Route = createFileRoute("/org/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações institucionais — Sentinela" },
      {
        name: "description",
        content: "Preferências do usuário institucional, notificações, acessibilidade e segurança.",
      },
      { property: "og:title", content: "Configurações institucionais — Sentinela" },
      { property: "og:description", content: "Conta, notificações, acessibilidade e segurança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfiguracoesInstitucionais,
});

function ConfiguracoesInstitucionais() {
  const { user } = getRouteApi("/org").useRouteContext();
  return <SettingsView institutional user={user} />;
}
