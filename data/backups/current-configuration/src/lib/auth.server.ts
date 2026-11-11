import "@tanstack/react-start/server-only";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

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
const databaseDir = join(process.cwd(), "data");
mkdirSync(databaseDir, { recursive: true });
const db = new DatabaseSync(join(databaseDir, "sentinela.db"));

db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('citizen', 'institutional')),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    cpf TEXT UNIQUE,
    birth_date TEXT,
    phone TEXT,
    postal_code TEXT,
    state TEXT NOT NULL DEFAULT 'BA',
    city TEXT NOT NULL DEFAULT 'Salvador',
    neighborhood TEXT,
    address TEXT,
    institution TEXT,
    functional_id TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
  CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    text_scale INTEGER NOT NULL DEFAULT 100 CHECK (text_scale BETWEEN 80 AND 140),
    high_contrast INTEGER NOT NULL DEFAULT 0,
    reduce_motion INTEGER NOT NULL DEFAULT 0,
    screen_reader INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE VIEW IF NOT EXISTS citizen_users AS
    SELECT id, name, email, cpf, phone, state, city, latitude, longitude,
           location_consent, created_at
    FROM users
    WHERE role = 'citizen';
  CREATE VIEW IF NOT EXISTS institutional_users AS
    SELECT id, name, email, institution, functional_id, state, city, created_at
    FROM users
    WHERE role = 'institutional';
`);

const userColumns = new Set((db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map((column) => column.name));
if (!userColumns.has("latitude")) db.exec("ALTER TABLE users ADD COLUMN latitude REAL");
if (!userColumns.has("longitude")) db.exec("ALTER TABLE users ADD COLUMN longitude REAL");
if (!userColumns.has("location_consent")) db.exec("ALTER TABLE users ADD COLUMN location_consent INTEGER NOT NULL DEFAULT 0");
if (!userColumns.has("institutional_type")) db.exec("ALTER TABLE users ADD COLUMN institutional_type TEXT");
db.exec("UPDATE users SET institutional_type = 'auditor' WHERE role = 'institutional' AND institutional_type IS NULL");

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

function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, expires.toISOString());
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function registerAccount(input: RegisterInput) {
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
    db.prepare(`
      INSERT INTO users (
        id, role, name, email, password_hash, cpf, birth_date, phone, postal_code,
        state, city, neighborhood, address, institution, functional_id,
        latitude, longitude, location_consent, institutional_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, input.role, name, email, hashPassword(input.password), normalize(input.cpf),
      normalize(input.birthDate), normalize(input.phone), normalize(input.postalCode),
      normalize(input.state) ?? "BA", normalize(input.city) ?? "Salvador",
      normalize(input.neighborhood), normalize(input.address), normalize(input.institution),
      normalize(input.functionalId), input.locationConsent ? input.latitude ?? null : null,
      input.locationConsent ? input.longitude ?? null : null, input.locationConsent ? 1 : 0,
      input.role === "institutional" ? input.institutionalType : null,
    );
    createSession(id);
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown>;
    return publicUser(row);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new Error("Já existe uma conta com esse e-mail, CPF ou identificação funcional.");
    }
    throw error;
  }
}

export function loginAccount(input: { email: string; password: string; role: AccountRole; functionalId?: string }) {
  const row = db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(input.email.trim()) as Record<string, unknown> | undefined;
  if (!row || row.role !== input.role || !passwordMatches(input.password, String(row.password_hash))) {
    throw new Error("E-mail ou senha incorretos para este tipo de acesso.");
  }
  if (input.role === "institutional" && input.functionalId?.trim() !== String(row.functional_id)) {
    throw new Error("Identificação funcional incorreta.");
  }
  createSession(String(row.id));
  return publicUser(row);
}

export function currentSession() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const row = db.prepare(`
    SELECT users.* FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ? AND sessions.expires_at > ?
  `).get(token, new Date().toISOString()) as Record<string, unknown> | undefined;
  if (!row) {
    deleteCookie(SESSION_COOKIE, { path: "/" });
    return null;
  }
  return publicUser(row);
}

export function endSession() {
  const token = getCookie(SESSION_COOKIE);
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  const user = currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string } | undefined;
  if (!row || !passwordMatches(input.currentPassword, row.password_hash)) throw new Error("A senha atual está incorreta.");
  if (input.newPassword.length < 8) throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  if (input.currentPassword === input.newPassword) throw new Error("A nova senha deve ser diferente da senha atual.");
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(input.newPassword), user.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND token <> ?").run(user.id, getCookie(SESSION_COOKIE) ?? "");
  return { ok: true };
}

export function resetCitizenPassword(input: { email: string; cpf: string; newPassword: string }) {
  const row = db.prepare("SELECT id, cpf FROM users WHERE email = ? COLLATE NOCASE AND role = 'citizen'")
    .get(input.email.trim()) as { id: string; cpf: string | null } | undefined;
  const clean = (value: string) => value.replace(/\D/g, "");
  if (!row || !row.cpf || clean(row.cpf) !== clean(input.cpf)) throw new Error("E-mail ou CPF não conferem com a conta.");
  if (input.newPassword.length < 8) throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(input.newPassword), row.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(row.id);
  return { ok: true };
}

export function updatePhone(phoneInput: string) {
  const user = currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const phone = phoneInput.trim();
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) throw new Error("Informe um telefone válido com DDD.");
  db.prepare("UPDATE users SET phone = ? WHERE id = ?").run(phone, user.id);
  return { ok: true, phone };
}

export function resetInstitutionalPassword(input: { email: string; functionalId: string; newPassword: string }) {
  const row = db.prepare("SELECT id, functional_id FROM users WHERE email = ? COLLATE NOCASE AND role = 'institutional'")
    .get(input.email.trim()) as { id: string; functional_id: string | null } | undefined;
  if (!row || !row.functional_id || row.functional_id.toLocaleLowerCase() !== input.functionalId.trim().toLocaleLowerCase()) {
    throw new Error("E-mail ou identificação funcional não conferem com a conta.");
  }
  if (input.newPassword.length < 8) throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(input.newPassword), row.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(row.id);
  return { ok: true };
}

export function getAccessibilityPreferences(): AccessibilityPreferences {
  const user = currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const row = db.prepare("SELECT * FROM user_accessibility_preferences WHERE user_id = ?").get(user.id) as Record<string, unknown> | undefined;
  return row ? {
    textScale: Number(row.text_scale), highContrast: Boolean(row.high_contrast),
    reduceMotion: Boolean(row.reduce_motion), screenReader: Boolean(row.screen_reader),
  } : { textScale: 100, highContrast: false, reduceMotion: false, screenReader: true };
}

export function saveAccessibilityPreferences(input: AccessibilityPreferences) {
  const user = currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const scale = Math.max(80, Math.min(140, Math.round(input.textScale)));
  db.prepare(`INSERT INTO user_accessibility_preferences
    (user_id,text_scale,high_contrast,reduce_motion,screen_reader) VALUES (?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET text_scale=excluded.text_scale,
    high_contrast=excluded.high_contrast, reduce_motion=excluded.reduce_motion,
    screen_reader=excluded.screen_reader, updated_at=CURRENT_TIMESTAMP`)
    .run(user.id, scale, input.highContrast ? 1 : 0, input.reduceMotion ? 1 : 0, input.screenReader ? 1 : 0);
  return { textScale: scale, highContrast: input.highContrast, reduceMotion: input.reduceMotion, screenReader: input.screenReader };
}
