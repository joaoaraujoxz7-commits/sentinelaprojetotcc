import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users } from "lucide-react";
import { Logo, Lumia } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/acesso")({
  head: () => ({
    meta: [
      { title: "Bem-vindo ao Sentinela — Seleção de acesso" },
      {
        name: "description",
        content:
          "Escolha entre o acesso da população ou o acesso institucional para usar a plataforma Sentinela.",
      },
      { property: "og:title", content: "Bem-vindo ao Sentinela" },
      { property: "og:description", content: "Selecione como deseja acessar a plataforma Sentinela." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Acesso,
});

function Acesso() {
  return (
    <div className="relative min-h-screen px-6 py-12">
      <div className="page-glow absolute inset-0" />
      <div className="relative mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Logo />
          <Link to="/onboarding" className="text-xs text-muted-foreground hover:text-primary">
            Conheça o Sentinela
          </Link>
        </div>

        <header className="mt-16 text-center">
          <h1 className="font-sans text-3xl font-semibold sm:text-4xl">Bem-vindo ao Sentinela</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Selecione como deseja acessar a plataforma.
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article className="surface-card group flex flex-col p-7 transition-all hover:glow-ring">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Users className="size-6" />
            </span>
            <h2 className="mt-5 font-sans text-xl font-semibold">Acesso da População</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              Registre ocorrências, acompanhe informações da sua região e participe de uma
              segurança mais colaborativa.
            </p>
            <Button asChild className="mt-6">
              <Link to="/entrar">Entrar como população</Link>
            </Button>
          </article>

          <article className="surface-card group flex flex-col p-7 transition-all hover:glow-ring">
            <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
              <Building2 className="size-6" />
            </span>
            <h2 className="mt-5 font-sans text-xl font-semibold">Acesso Institucional</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              Monitore ocorrências, analise padrões, acompanhe previsões e gerencie informações de
              segurança.
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <Link to="/institucional/entrar">Entrar como órgão público</Link>
            </Button>
          </article>
        </div>

        <div className="surface-card mt-10 flex items-center gap-4 p-5">
          <Lumia size={52} />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">LumIA</span> acompanha você em toda a
            plataforma explicando indicadores, previsões e procedimentos de contestação.
          </p>
        </div>
      </div>
    </div>
  );
}
