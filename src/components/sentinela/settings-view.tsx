import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "./ui-kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { StatusPill } from "./ui-kit";
import { accessibilityPreferencesFn, changePasswordFn, saveAccessibilityPreferencesFn, updatePhoneFn, type AccessibilityPreferences, type SessionUser } from "@/lib/auth";
import { applyAccessibilityPreferences } from "@/lib/accessibility";

function Toggle({ label, hint, on = false, checked, onCheckedChange }: { label: string; hint?: string; on?: boolean; checked?: boolean; onCheckedChange?: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <div>
        <p className="text-sm">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} defaultChecked={checked === undefined ? on : undefined} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

export function SettingsView({ institutional = false, user }: { institutional?: boolean; user: SessionUser }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({ textScale: 100, highContrast: false, reduceMotion: false, screenReader: true });
  const [saved, setSaved] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [phoneStatus, setPhoneStatus] = useState("");
  useEffect(() => { accessibilityPreferencesFn().then((value) => { setPreferences(value); applyAccessibilityPreferences(value); }); }, []);

  async function changePreferences(next: AccessibilityPreferences) {
    setPreferences(next); applyAccessibilityPreferences(next); setSaved("Salvando...");
    try { const stored = await saveAccessibilityPreferencesFn({ data: next }); setPreferences(stored); setSaved("Preferências salvas para esta conta."); }
    catch { setSaved("Não foi possível salvar as preferências."); }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Configurações"
        description={
          institutional
            ? "Preferências do usuário institucional, segurança e acessibilidade."
            : "Sua conta, notificações, privacidade, acessibilidade e segurança."
        }
      />

      <Panel title="Conta">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (event) => {
          event.preventDefault(); setPasswordStatus("");
          const formElement = event.currentTarget;
          const form = new FormData(formElement);
          const newPassword = String(form.get("newPassword"));
          if (newPassword !== String(form.get("confirmPassword"))) { setPasswordStatus("As novas senhas não coincidem."); return; }
          try { await changePasswordFn({ data: { currentPassword: String(form.get("currentPassword")), newPassword } }); setPasswordStatus("Senha alterada com sucesso."); formElement.reset(); }
          catch (cause) { setPasswordStatus(cause instanceof Error ? cause.message : "Não foi possível alterar a senha."); }
        }}>
          <div className="space-y-2">
            <Label htmlFor="n">Nome</Label>
            <Input id="n" defaultValue={user.name} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e">E-mail</Label>
            <Input id="e" type="email" defaultValue={user.email} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t">Telefone</Label>
            <div className="flex gap-2"><Input id="t" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(71) 99999-0000" /><Button type="button" variant="secondary" onClick={async () => {
              setPhoneStatus("Salvando...");
              try { const result = await updatePhoneFn({ data: { phone } }); setPhone(result.phone); setPhoneStatus("Telefone atualizado no banco."); }
              catch (cause) { setPhoneStatus(cause instanceof Error ? cause.message : "Não foi possível atualizar o telefone."); }
            }}>Salvar</Button></div>
            {phoneStatus && <p className="text-xs text-muted-foreground" role="status">{phoneStatus}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
          </div>
          <div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" name="newPassword" type="password" minLength={8} autoComplete="new-password" required /></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Confirmar nova senha</Label><Input id="confirm-password" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required /></div>
          {passwordStatus && <p className="text-sm text-muted-foreground sm:col-span-2" role="status">{passwordStatus}</p>}
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2"><Button type="submit" size="sm">Alterar senha</Button>{!institutional && <Link to="/esqueci-senha" className="text-xs text-primary hover:underline">Esqueceu a senha?</Link>}</div>
        </form>
      </Panel>

      <Panel title="Notificações">
        <Toggle label="Alertas de segurança" hint="Mudanças no nível da região" on />
        <Toggle label="Atualizações de ocorrências" on />
        <Toggle label="Mensagens" />
        <Toggle label="Revisões e contestações" on />
      </Panel>

      <Panel title="Privacidade">
        <Toggle label="Permitir uso de localização" hint="Localização aproximada" on />
        <Toggle label="Compartilhar dados agregados com órgãos autorizados" on />
        <Toggle label="Permitir contato posterior sobre meus registros" />
        <Toggle label="Manter histórico de consultas" />
      </Panel>

      <Panel title="Acessibilidade">
        <div className="space-y-5 py-2">
          <div>
            <p className="mb-2 text-sm">Tamanho do texto</p>
            <Slider value={[preferences.textScale]} min={80} max={140} step={10} onValueChange={([textScale]) => changePreferences({ ...preferences, textScale: textScale ?? 100 })} aria-label="Tamanho do texto" />
            <p className="mt-2 text-xs text-muted-foreground">{preferences.textScale}%</p>
          </div>
          <Toggle label="Alto contraste" checked={preferences.highContrast} onCheckedChange={(highContrast) => changePreferences({ ...preferences, highContrast })} />
          <Toggle label="Reduzir animações" checked={preferences.reduceMotion} onCheckedChange={(reduceMotion) => changePreferences({ ...preferences, reduceMotion })} />
          <Toggle label="Otimizar para leitor de tela" checked={preferences.screenReader} onCheckedChange={(screenReader) => changePreferences({ ...preferences, screenReader })} />
          {saved && <p className="text-xs text-muted-foreground" role="status" aria-live="polite">{saved}</p>}
        </div>
      </Panel>

      <Panel title="Segurança">
        <Toggle label="Autenticação em dois fatores" on={institutional} />
        <div className="space-y-3 pt-3">
          <p className="text-sm">Sessões ativas</p>
          {[
            ["Chrome · Salvador — BA", "Agora"],
            ["Aplicativo móvel · Salvador — BA", "há 3 h"],
          ].map(([d, w]) => (
            <div key={d} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{d}</span>
              <span className="flex items-center gap-2">
                {w}
                <StatusPill tone="success">Ativa</StatusPill>
              </span>
            </div>
          ))}
          <Button variant="secondary" size="sm">
            Ver histórico de acessos
          </Button>
        </div>
      </Panel>
    </div>
  );
}
