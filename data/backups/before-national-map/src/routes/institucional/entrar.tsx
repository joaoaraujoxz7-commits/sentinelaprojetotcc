import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginFn } from "@/lib/auth";

export const Route = createFileRoute("/institucional/entrar")({
  head: () => ({ meta: [{ title: "Acesso Institucional — Sentinela" }] }),
  component: LoginOrgao,
});

function LoginOrgao() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div className="grid-lines absolute inset-0 opacity-40" />
      <div className="relative w-full max-w-md">
        <Logo size={34} subtitle="Plataforma institucional" />
        <form method="post" className="surface-card mt-6 space-y-4 p-6" onSubmit={async (event) => {
          event.preventDefault(); setError(""); setLoading(true);
          const form = new FormData(event.currentTarget);
          try {
            await loginFn({ data: { role: "institutional", email: String(form.get("email")), functionalId: String(form.get("functionalId")), password: String(form.get("password")) } });
            await navigate({ to: "/org" });
          } catch (cause) { setFailedAttempts((value) => value + 1); setError(cause instanceof Error ? cause.message : "Não foi possível entrar."); }
          finally { setLoading(false); }
        }}>
          <div><h1 className="font-sans text-xl font-semibold">Acesso Institucional</h1><p className="mt-1 text-xs text-muted-foreground">Acesso exclusivo para contas institucionais cadastradas.</p></div>
          <div className="space-y-2"><Label htmlFor="email">E-mail institucional</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="space-y-2"><Label htmlFor="functionalId">Matrícula / identificação funcional</Label><Input id="functionalId" name="functionalId" required /></div>
          <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>
          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
          {failedAttempts >= 3 && <Link to="/institucional/esqueci-senha" className="block text-center text-xs text-primary hover:underline">Esqueceu a senha?</Link>}
          <Button type="button" variant="secondary" className="w-full" asChild><Link to="/institucional/cadastro">Cadastrar usuário institucional</Link></Button>
          <Link to="/acesso" className="block text-center text-xs text-muted-foreground hover:text-foreground">Voltar</Link>
        </form>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-warning"><ShieldAlert className="size-4" /> Acesso restrito a usuários cadastrados.</p>
      </div>
    </div>
  );
}
