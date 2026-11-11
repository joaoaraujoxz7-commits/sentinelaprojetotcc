import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lumia, Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Conheça o Sentinela — Onboarding" },
      {
        name: "description",
        content:
          "Entenda como o Sentinela analisa padrões de segurança, apresenta estimativas explicáveis e garante revisão humana.",
      },
      { property: "og:title", content: "Conheça o Sentinela" },
      { property: "og:description", content: "Padrões, previsões explicáveis e revisão humana." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const steps = [
  {
    title: "Conheça o Sentinela",
    text: "Uma plataforma para compreender padrões de segurança por meio de dados.",
  },
  {
    title: "Entenda as previsões",
    text: "O Sentinela identifica padrões e apresenta estimativas, mas previsões não são certeza.",
  },
  {
    title: "Participe com seus relatos",
    text: "Registrar uma ocorrência ajuda a plataforma a compreender melhor a realidade da sua região.",
  },
  {
    title: "Transparência e revisão humana",
    text: "Toda decisão automatizada pode ser explicada, contestada e revisada por uma pessoa responsável.",
  },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const step = steps[i]!;

  return (
    <div className="relative flex min-h-screen flex-col px-6 py-10">
      <div className="page-glow absolute inset-0" />
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Logo size={28} />
          <Link to="/acesso" className="text-xs text-muted-foreground hover:text-primary">
            Pular
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Lumia size={140} />
          <h1 className="mt-8 font-sans text-2xl font-semibold">{step.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
        </div>

        <div className="mb-6 flex justify-center gap-2">
          {steps.map((s, idx) => (
            <span
              key={s.title}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === i ? "w-8 bg-primary" : "w-2 bg-secondary",
              )}
            />
          ))}
        </div>

        <Button
          onClick={() => (i < steps.length - 1 ? setI(i + 1) : navigate({ to: "/acesso" }))}
          className="w-full"
        >
          {i < steps.length - 1 ? "Continuar" : "Começar"}
        </Button>
      </div>
    </div>
  );
}
