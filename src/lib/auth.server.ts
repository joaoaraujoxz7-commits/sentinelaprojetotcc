import "@tanstack/react-start/server-only";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { db, isUniqueViolation, NOW_TEXT } from "./db.server";

export type AccountRole = "citizen" | "institutional";
export type InstitutionalType = "agent" | "auditor";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AccountRole;
  city: string;
  state: string;
  neighborhood: string | null;
  institution: string | null;
  functionalId: string | null;
  institutionalType: InstitutionalType | null;
};

export type RegisterInput = {
  role: AccountRole;
  name: string;
  email: string;
  password: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  postalCode?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  institution?: string;
  functionalId?: string;
  institutionalType?: InstitutionalType;
  latitude?: number;
  longitude?: number;
  locationConsent?: boolean;
};

export type AccessibilityPreferences = {
  textScale: number;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
};

const SESSION_COOKIE = "sentinela_session";
function normalize(value?: string) {
  return value?.trim() || null;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function passwordMatches(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function publicUser(row: Record<string, unknown>): SessionUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : null,
    role: row.role as AccountRole,
    city: String(row.city),
    state: String(row.state),
    neighborhood: row.neighborhood ? String(row.neighborhood) : null,
    institution: row.institution ? String(row.institution) : null,
    functionalId: row.functional_id ? String(row.functional_id) : null,
    institutionalType: row.institutional_type ? row.institutional_type as InstitutionalType : null,
  };
}

async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", token, userId, expires.toISOString());
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function registerAccount(input: RegisterInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 3) throw new Error("Informe o nome completo.");
  if (!email.includes("@")) throw new Error("Informe um e-mail válido.");
  if (input.password.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");
  if (input.role === "citizen" && !normalize(input.cpf)) throw new Error("Informe o CPF.");
  if (input.role === "institutional" && (!normalize(input.institution) || !normalize(input.functionalId))) {
    throw new Error("Informe o órgão e a identificação funcional.");
  }
  if (input.role === "institutional" && !input.institutionalType) throw new Error("Selecione o perfil institucional.");

  try {
    const id = randomUUID();
    await db.run(`
      INSERT INTO users (
        id, role, name, email, password_hash, cpf, birth_date, phone, postal_code,
        state, city, neighborhood, address, institution, functional_id,
        latitude, longitude, location_consent, institutional_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      id, input.role, name, email, hashPassword(input.password), normalize(input.cpf),
      normalize(input.birthDate), normalize(input.phone), normalize(input.postalCode),
      normalize(input.state) ?? "BA", normalize(input.city) ?? "Salvador",
      normalize(input.neighborhood), normalize(input.address), normalize(input.institution),
      normalize(input.functionalId), input.locationConsent ? input.latitude ?? null : null,
      input.locationConsent ? input.longitude ?? null : null, input.locationConsent ? 1 : 0,
      input.role === "institutional" ? input.institutionalType : null,
    );
    await createSession(id);
    const row = await db.get("SELECT * FROM users WHERE id = ?", id) as Record<string, unknown>;
    return publicUser(row);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Já existe uma conta com esse e-mail, CPF ou identificação funcional.");
    }
    throw error;
  }
}

export async function loginAccount(input: { email: string; password: string; role: AccountRole; functionalId?: string }) {
  const row = await db.get("SELECT * FROM users WHERE lower(email) = lower(?)", input.email.trim()) as Record<string, unknown> | undefined;
  if (!row || row.role !== input.role || !passwordMatches(input.password, String(row.password_hash))) {
    throw new Error("E-mail ou senha incorretos para este tipo de acesso.");
  }
  if (input.role === "institutional" && input.functionalId?.trim() !== String(row.functional_id)) {
    throw new Error("Identificação funcional incorreta.");
  }
  await createSession(String(row.id));
  return publicUser(row);
}

export async function currentSession() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const row = await db.get(`
    SELECT users.* FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ? AND sessions.expires_at > ?
  `, token, new Date().toISOString()) as Record<string, unknown> | undefined;
  if (!row) {
    deleteCookie(SESSION_COOKIE, { path: "/" });
    return null;
  }
  return publicUser(row);
}

export async function endSession() {
  const token = getCookie(SESSION_COOKIE);
  if (token) await db.run("DELETE FROM sessions WHERE token = ?", token);
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const user = await currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const row = await db.get("SELECT password_hash FROM users WHERE id = ?", user.id) as { password_hash: string } | undefined;
  if (!row || !passwordMatches(input.currentPassword, row.password_hash)) throw new Error("A senha atual está incorreta.");
  if (input.newPassword.length < 8) throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  if (input.currentPassword === input.newPassword) throw new Error("A nova senha deve ser diferente da senha atual.");
  await db.run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(input.newPassword), user.id);
  await db.run("DELETE FROM sessions WHERE user_id = ? AND token <> ?", user.id, getCookie(SESSION_COOKIE) ?? "");
  return { ok: true };
}

export async function resetCitizenPassword(input: { email: string; cpf: string; newPassword: string }) {
  const row = await db.get("SELECT id, cpf FROM users WHERE lower(email) = lower(?) AND role = 'citizen'", input.email.trim()) as { id: string; cpf: string | null } | undefined;
  const clean = (value: string) => value.replace(/\D/g, "");
  if (!row || !row.cpf || clean(row.cpf) !== clean(input.cpf)) throw new Error("E-mail ou CPF não conferem com a conta.");
  if (input.newPassword.length < 8) throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  await db.run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(input.newPassword), row.id);
  await db.run("DELETE FROM sessions WHERE user_id = ?", row.id);
  return { ok: true };
}

export async function updatePhone(phoneInput: string) {
  const user = await currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const phone = phoneInput.trim();
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) throw new Error("Informe um telefone válido com DDD.");
  await db.run("UPDATE users SET phone = ? WHERE id = ?", phone, user.id);
  return { ok: true, phone };
}

export async function resetInstitutionalPassword(input: { email: string; functionalId: string; newPassword: string }) {
  const row = await db.get("SELECT id, functional_id FROM users WHERE lower(email) = lower(?) AND role = 'institutional'", input.email.trim()) as { id: string; functional_id: string | null } | undefined;
  if (!row || !row.functional_id || row.functional_id.toLocaleLowerCase() !== input.functionalId.trim().toLocaleLowerCase()) {
    throw new Error("E-mail ou identificação funcional não conferem com a conta.");
  }
  if (input.newPassword.length < 8) throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  await db.run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(input.newPassword), row.id);
  await db.run("DELETE FROM sessions WHERE user_id = ?", row.id);
  return { ok: true };
}

export async function getAccessibilityPreferences(): Promise<AccessibilityPreferences> {
  const user = await currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const row = await db.get("SELECT * FROM user_accessibility_preferences WHERE user_id = ?", user.id) as Record<string, unknown> | undefined;
  return row ? {
    textScale: Number(row.text_scale), highContrast: Boolean(row.high_contrast),
    reduceMotion: Boolean(row.reduce_motion), screenReader: Boolean(row.screen_reader),
  } : { textScale: 100, highContrast: false, reduceMotion: false, screenReader: true };
}

export async function saveAccessibilityPreferences(input: AccessibilityPreferences) {
  const user = await currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const scale = Math.max(80, Math.min(140, Math.round(input.textScale)));
  await db.run(`INSERT INTO user_accessibility_preferences
    (user_id,text_scale,high_contrast,reduce_motion,screen_reader) VALUES (?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET text_scale=excluded.text_scale,
    high_contrast=excluded.high_contrast, reduce_motion=excluded.reduce_motion,
    screen_reader=excluded.screen_reader, updated_at=${NOW_TEXT}`, user.id, scale, input.highContrast ? 1 : 0, input.reduceMotion ? 1 : 0, input.screenReader ? 1 : 0);
  return { textScale: scale, highContrast: input.highContrast, reduceMotion: input.reduceMotion, screenReader: input.screenReader };
}
