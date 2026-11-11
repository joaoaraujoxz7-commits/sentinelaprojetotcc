import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo, Lumia } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinela — Inteligência para uma segurança mais transparente" },
      {
        name: "description",
        content:
          "Sentinela: plataforma de monitoramento, análise de ocorrências e policiamento preditivo explicável para órgãos públicos e população.",
      },
      { property: "og:title", content: "Sentinela — Segurança pública transparente" },
      {
        property: "og:description",
        content:
          "Monitore ocorrências, entenda previsões explicáveis e participe de uma segurança mais colaborativa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/acesso" }), 3200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="page-glow absolute inset-0" />
      <div className="grid-lines absolute inset-0 opacity-40" />

      <div className="relative flex flex-col items-center text-center">
        <div className="flex items-end gap-6">
          <Logo size={84} withName={false} className="animate-in fade-in zoom-in duration-1000" />
          <Lumia size={78} className="animate-in fade-in slide-in-from-bottom-4 duration-1000" />
        </div>
        <h1 className="mt-8 font-sans text-4xl font-semibold tracking-[0.34em] text-foreground sm:text-5xl">
          SENTINELA
        </h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Inteligência para uma segurança mais transparente.
        </p>

        <div className="mt-10 h-1 w-56 overflow-hidden rounded-full bg-secondary">
          <div className="brand-gradient h-full w-1/3 animate-[loading_1.6s_ease-in-out_infinite] rounded-full" />
        </div>
        <Link
          to="/acesso"
          className="mt-8 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          Pular introdução
        </Link>
      </div>

      <style>{`@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}
