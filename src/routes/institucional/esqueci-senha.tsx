import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetInstitutionalPasswordFn } from "@/lib/auth";

export const Route = createFileRoute("/institucional/esqueci-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha institucional — Sentinela" }] }), component: RecuperarSenhaInstitucional,
});

function RecuperarSenhaInstitucional() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return <div className="relative flex min-h-screen items-center justify-center px-6 py-12"><div className="grid-lines absolute inset-0 opacity-40" />
    <div className="relative w-full max-w-md"><Logo size={34} subtitle="Plataforma institucional" />
      <form className="surface-card mt-6 space-y-4 p-6" onSubmit={async (event) => {
        event.preventDefault(); setError(""); const form = new FormData(event.currentTarget);
        const newPassword = String(form.get("newPassword"));
        if (newPassword !== String(form.get("confirmPassword"))) { setError("As novas senhas não coincidem."); return; }
        setLoading(true);
        try { await resetInstitutionalPasswordFn({ data: { email: String(form.get("email")), functionalId: String(form.get("functionalId")), newPassword } }); await navigate({ to: "/institucional/entrar" }); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível redefinir a senha."); }
        finally { setLoading(false); }
      }}>
        <div><h1 className="font-sans text-xl font-semibold">Recuperar senha institucional</h1><p className="mt-1 text-xs text-muted-foreground">Confirme sua identificação funcional para definir uma nova senha.</p></div>
        <Field label="E-mail institucional" name="email" type="email" required />
        <Field label="Matrícula / identificação funcional" name="functionalId" required />
        <Field label="Nova senha" name="newPassword" type="password" minLength={8} required />
        <Field label="Confirmar nova senha" name="confirmPassword" type="password" minLength={8} required />
        {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Redefinindo..." : "Redefinir senha"}</Button>
        <Link to="/institucional/entrar" className="block text-center text-xs text-muted-foreground hover:text-foreground">Voltar para entrar</Link>
      </form>
    </div></div>;
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>;
}
