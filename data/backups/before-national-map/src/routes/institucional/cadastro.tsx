import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerFn } from "@/lib/auth";

export const Route = createFileRoute("/institucional/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro Institucional — Sentinela" }] }),
  component: CadastroInstitucional,
});

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>;
}

function CadastroInstitucional() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid-lines absolute inset-0 opacity-40" />
      <div className="relative w-full max-w-xl">
        <Logo size={34} subtitle="Cadastro institucional" />
        <form method="post" className="surface-card mt-6 space-y-5 p-6" onSubmit={async (event) => {
          event.preventDefault(); setError(""); setLoading(true);
          const form = new FormData(event.currentTarget);
          const password = String(form.get("password"));
          if (password !== String(form.get("confirmPassword"))) { setError("As senhas não coincidem."); setLoading(false); return; }
          try {
            await registerFn({ data: {
              role: "institutional", name: String(form.get("name")), email: String(form.get("email")), password,
              institution: String(form.get("institution")), functionalId: String(form.get("functionalId")),
              institutionalType: String(form.get("institutionalType")) as "agent" | "auditor",
              phone: String(form.get("phone")), state: "BA", city: "Salvador",
            }});
            await navigate({ to: "/org" });
          } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar a conta."); }
          finally { setLoading(false); }
        }}>
          <div><h1 className="font-sans text-2xl font-semibold">Cadastrar usuário institucional</h1><p className="mt-1 text-sm text-muted-foreground">Dados do profissional e do órgão de Salvador.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Nome completo" name="name" required /></div>
            <Field label="E-mail institucional" name="email" type="email" required />
            <Field label="Telefone funcional" name="phone" type="tel" />
            <div className="sm:col-span-2"><Field label="Órgão / instituição" name="institution" required placeholder="Secretaria de Segurança Pública da Bahia" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="institutionalType">Perfil institucional</Label><select id="institutionalType" name="institutionalType" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Selecione o perfil</option><option value="agent">Agente policial</option><option value="auditor">Auditor</option></select></div>
            <Field label="Matrícula / identificação funcional" name="functionalId" required />
            <Field label="Localidade" name="location" value="Salvador — BA" readOnly />
            <Field label="Senha" name="password" type="password" minLength={8} required />
            <Field label="Confirmar senha" name="confirmPassword" type="password" minLength={8} required />
          </div>
          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando conta..." : "Criar conta institucional"}</Button>
        </form>
        <p className="mt-5 text-center text-xs text-muted-foreground">Já possui cadastro? <Link to="/institucional/entrar" className="text-primary hover:underline">Entrar</Link></p>
      </div>
    </div>
  );
}
