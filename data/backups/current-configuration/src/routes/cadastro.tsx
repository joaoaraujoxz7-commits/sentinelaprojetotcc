import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerFn } from "@/lib/auth";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — População | Sentinela" }] }),
  component: Cadastro,
});

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>;
}

function Cadastro() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState("");

  function requestLocation() {
    setLocationMessage("Solicitando permissão...");
    if (!navigator.geolocation) { setLocationMessage("Este navegador não oferece localização."); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationMessage("Localização atual autorizada.");
      },
      () => setLocationMessage("Permissão não concedida. Você ainda pode criar sua conta."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }
  return (
    <div className="relative min-h-screen px-6 py-10">
      <div className="page-glow absolute inset-0" />
      <div className="relative mx-auto w-full max-w-2xl">
        <Logo size={32} />
        <form method="post" className="surface-card mt-8 space-y-6 p-6" onSubmit={async (event) => {
          event.preventDefault(); setError(""); setLoading(true);
          const form = new FormData(event.currentTarget);
          const password = String(form.get("password"));
          if (password !== String(form.get("confirmPassword"))) { setError("As senhas não coincidem."); setLoading(false); return; }
          try {
            await registerFn({ data: {
              role: "citizen", name: String(form.get("name")), email: String(form.get("email")), password,
              cpf: String(form.get("cpf")), phone: String(form.get("phone")),
              state: String(form.get("state")), city: String(form.get("city")),
              latitude: location?.latitude, longitude: location?.longitude, locationConsent: Boolean(location),
            }});
            await navigate({ to: "/app" });
          } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar a conta."); }
          finally { setLoading(false); }
        }}>
          <div><h1 className="font-sans text-2xl font-semibold">Criar conta da população</h1><p className="mt-1 text-sm text-muted-foreground">Seus dados ficarão vinculados somente à sua conta.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Nome completo" name="name" required autoComplete="name" /></div>
            <Field label="E-mail" name="email" type="email" required autoComplete="email" />
            <Field label="CPF" name="cpf" required placeholder="000.000.000-00" />
            <Field label="Telefone" name="phone" type="tel" placeholder="(71) 00000-0000" />
            <Field label="Cidade" name="city" defaultValue="Salvador" required autoComplete="address-level2" />
            <Field label="Estado" name="state" defaultValue="BA" required maxLength={2} autoComplete="address-level1" />
            <div className="sm:col-span-2 rounded-lg border border-border bg-background/40 p-4">
              <p className="text-sm font-medium">Localização atual</p>
              <p className="mt-1 text-xs text-muted-foreground">O navegador solicitará sua autorização. Você pode negar e continuar o cadastro.</p>
              <Button type="button" variant="secondary" className="mt-3" onClick={requestLocation}>Permitir uso da localização atual</Button>
              {locationMessage && <p className="mt-2 text-xs text-muted-foreground" role="status">{locationMessage}</p>}
            </div>
            <Field label="Senha" name="password" type="password" minLength={8} required autoComplete="new-password" />
            <Field label="Confirmar senha" name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" />
          </div>
          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando conta..." : "Criar minha conta"}</Button>
        </form>
        <p className="mt-5 text-center text-xs text-muted-foreground">Já tem conta? <Link to="/entrar" className="text-primary hover:underline">Entrar</Link></p>
      </div>
    </div>
  );
}
