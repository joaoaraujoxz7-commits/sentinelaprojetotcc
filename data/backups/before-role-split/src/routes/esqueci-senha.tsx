import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetCitizenPasswordFn } from "@/lib/auth";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — Sentinela" }] }),
  component: EsqueciSenha,
});

function EsqueciSenha() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
    <div className="page-glow absolute inset-0" />
    <div className="relative w-full max-w-sm">
      <div className="flex justify-center"><Logo size={40} /></div>
      <form className="surface-card mt-8 space-y-4 p-6" onSubmit={async (event) => {
        event.preventDefault(); setError("");
        const form = new FormData(event.currentTarget);
        const newPassword = String(form.get("newPassword"));
        if (newPassword !== String(form.get("confirmPassword"))) { setError("As novas senhas não coincidem."); return; }
        setLoading(true);
        try {
          await resetCitizenPasswordFn({ data: { email: String(form.get("email")), cpf: String(form.get("cpf")), newPassword } });
          await navigate({ to: "/entrar" });
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível redefinir a senha."); }
        finally { setLoading(false); }
      }}>
        <div><h1 className="font-sans text-xl font-semibold">Recuperar senha</h1><p className="mt-1 text-xs text-muted-foreground">Confirme os dados cadastrados para definir uma nova senha.</p></div>
        <Field label="E-mail" name="email" type="email" autoComplete="email" required />
        <Field label="CPF" name="cpf" placeholder="000.000.000-00" required />
        <Field label="Nova senha" name="newPassword" type="password" minLength={8} autoComplete="new-password" required />
        <Field label="Confirmar nova senha" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required />
        {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
        <Button className="w-full" type="submit" disabled={loading}>{loading ? "Redefinindo..." : "Redefinir senha"}</Button>
        <Link to="/entrar" className="block text-center text-xs text-muted-foreground hover:text-foreground">Voltar para entrar</Link>
      </form>
    </div>
  </div>;
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>;
}
