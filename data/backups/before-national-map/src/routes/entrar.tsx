import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginFn } from "@/lib/auth";

export const Route = createFileRoute("/entrar")({
  head: () => ({ meta: [{ title: "Entrar no Sentinela — População" }] }),
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div className="page-glow absolute inset-0" />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center"><Logo size={40} /></div>
        <form method="post" className="surface-card mt-8 space-y-4 p-6" onSubmit={async (event) => {
          event.preventDefault(); setError(""); setLoading(true);
          const form = new FormData(event.currentTarget);
          try {
            await loginFn({ data: { role: "citizen", email: String(form.get("email")), password: String(form.get("password")) } });
            await navigate({ to: "/app" });
          } catch (cause) { setFailedAttempts((value) => value + 1); setError(cause instanceof Error ? cause.message : "Não foi possível entrar."); }
          finally { setLoading(false); }
        }}>
          <div><h1 className="font-sans text-xl font-semibold">Entrar como população</h1><p className="mt-1 text-xs text-muted-foreground">Use a conta que você cadastrou.</p></div>
          <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@email.com" /></div>
          <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>
          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
          {failedAttempts >= 3 && <Link to="/esqueci-senha" className="block text-center text-xs text-primary hover:underline">Esqueceu a senha?</Link>}
          <Link to="/acesso" className="block text-center text-xs text-muted-foreground hover:text-foreground">Voltar</Link>
        </form>
        <p className="mt-5 text-center text-xs text-muted-foreground">Não possui cadastro? <Link to="/cadastro" className="text-primary hover:underline">Criar uma conta aqui</Link></p>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Seus dados são protegidos pelo Sentinela.</p>
      </div>
    </div>
  );
}
