import "@tanstack/react-start/server-only";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { currentSession } from "./auth.server";

export type RecordKind = "occurrences" | "predictions" | "audits" | "contests" | "reports" | "notifications";
export type ManagedRecord = {
  id: string;
  title: string;
  region: string;
  eventDate: string;
  eventTime: string;
  source: string;
  status: string;
  confidence: number;
  details: string;
  createdBy: string;
  createdAt: string;
  priority?: string;
  evidenceName?: string;
  evidenceType?: string;
  evidenceData?: string;
  contactAuthorized?: boolean;
  anonymous?: boolean;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
};

const db = new DatabaseSync(join(process.cwd(), "data", "sentinela.db"));
const tables: Record<RecordKind, string> = {
  occurrences: "occurrences", predictions: "predictions", audits: "audits",
  contests: "contests", reports: "reports", notifications: "notifications",
};

for (const table of Object.values(tables)) {
  db.exec(`CREATE TABLE IF NOT EXISTS ${table} (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT 'Salvador',
    event_date TEXT NOT NULL,
    event_time TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'Institucional',
    status TEXT NOT NULL DEFAULT 'Pendente',
    confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
    details TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

const occurrenceColumns = new Set((db.prepare("PRAGMA table_info(occurrences)").all() as { name: string }[]).map((column) => column.name));
if (!occurrenceColumns.has("priority")) db.exec("ALTER TABLE occurrences ADD COLUMN priority TEXT NOT NULL DEFAULT 'Normal'");
if (!occurrenceColumns.has("evidence_name")) db.exec("ALTER TABLE occurrences ADD COLUMN evidence_name TEXT");
if (!occurrenceColumns.has("evidence_type")) db.exec("ALTER TABLE occurrences ADD COLUMN evidence_type TEXT");
if (!occurrenceColumns.has("evidence_data")) db.exec("ALTER TABLE occurrences ADD COLUMN evidence_data TEXT");
if (!occurrenceColumns.has("contact_authorized")) db.exec("ALTER TABLE occurrences ADD COLUMN contact_authorized INTEGER NOT NULL DEFAULT 0");
if (!occurrenceColumns.has("anonymous")) db.exec("ALTER TABLE occurrences ADD COLUMN anonymous INTEGER NOT NULL DEFAULT 0");
db.exec("UPDATE occurrences SET status = 'Em análise' WHERE source = 'População' AND status IN ('Recebida', 'Informada')");
db.exec("UPDATE occurrences SET status = 'Validação' WHERE source = 'População' AND status = 'Concluído'");

function requireInstitutional() {
  const user = currentSession();
  if (!user || user.role !== "institutional") throw new Error("Acesso institucional necessário.");
  return user;
}

function requireCitizen() {
  const user = currentSession();
  if (!user || user.role !== "citizen") throw new Error("Acesso da população necessário.");
  return user;
}

function protocol(id: string) {
  return `SNT-${new Date().getFullYear()}-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function contestProtocol(id: string) {
  return `CT-${new Date().getFullYear()}-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function createInstitutionalNotification(userId: string, title: string, region: string, eventDate: string, eventTime: string, details: string) {
  db.prepare(`INSERT INTO notifications
    (id,title,region,event_date,event_time,source,status,confidence,details,created_by)
    VALUES (?,?,?,?,?,'População','Nova',0,?,?)`)
    .run(randomUUID(), title, region, eventDate, eventTime, details, userId);
}

function mapRow(row: Record<string, unknown>): ManagedRecord {
  return {
    id: String(row.id), title: String(row.title), region: String(row.region),
    eventDate: String(row.event_date), eventTime: String(row.event_time), source: String(row.source),
    status: String(row.status), confidence: Number(row.confidence), details: String(row.details),
    createdBy: String(row.created_by), createdAt: String(row.created_at),
    priority: row.priority ? String(row.priority) : undefined,
    evidenceName: row.evidence_name ? String(row.evidence_name) : undefined,
    evidenceType: row.evidence_type ? String(row.evidence_type) : undefined,
    evidenceData: row.evidence_data ? String(row.evidence_data) : undefined,
    contactAuthorized: Boolean(row.contact_authorized), anonymous: Boolean(row.anonymous),
    reporterName: row.reporter_name ? String(row.reporter_name) : undefined,
    reporterEmail: row.reporter_email ? String(row.reporter_email) : undefined,
    reporterPhone: row.reporter_phone ? String(row.reporter_phone) : undefined,
  };
}

export function listRecords(kind: RecordKind) {
  requireInstitutional();
  const query = kind === "occurrences"
    ? `SELECT occurrences.*, users.name AS reporter_name, users.email AS reporter_email, users.phone AS reporter_phone
       FROM occurrences JOIN users ON users.id = occurrences.created_by ORDER BY event_date DESC, occurrences.created_at DESC`
    : `SELECT * FROM ${tables[kind]} ORDER BY event_date DESC, created_at DESC`;
  return (db.prepare(query).all() as Record<string, unknown>[]).map(mapRow);
}

export function addRecord(kind: RecordKind, input: Omit<ManagedRecord, "id" | "createdBy" | "createdAt">) {
  const user = requireInstitutional();
  if (!input.title.trim()) throw new Error("Informe o título ou tipo do registro.");
  const id = randomUUID();
  db.prepare(`INSERT INTO ${tables[kind]} (id,title,region,event_date,event_time,source,status,confidence,details,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, input.title.trim(), input.region.trim() || "Salvador", input.eventDate, input.eventTime, input.source.trim() || "Institucional", input.status.trim() || "Pendente", Math.max(0, Math.min(100, input.confidence || 0)), input.details.trim(), user.id);
  return { ok: true };
}

export function updateRecord(kind: RecordKind, id: string, status: string) {
  requireInstitutional();
  db.prepare(`UPDATE ${tables[kind]} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, id);
  return { ok: true };
}

export function removeRecord(kind: RecordKind, id: string) {
  requireInstitutional();
  db.prepare(`DELETE FROM ${tables[kind]} WHERE id = ?`).run(id);
  return { ok: true };
}

export function addCitizenOccurrence(input: { title: string; region: string; eventDate: string; eventTime: string; details: string; priority: string; evidenceName?: string; evidenceType?: string; evidenceData?: string; contactAuthorized: boolean; anonymous: boolean }) {
  const user = requireCitizen();
  if (!input.title.trim() || !input.region.trim() || !input.eventDate) throw new Error("Preencha o tipo, o local e a data.");
  const id = randomUUID();
  if (input.evidenceData && input.evidenceData.length > 7_000_000) throw new Error("A evidência deve ter no máximo 5 MB.");
  db.prepare(`INSERT INTO occurrences
    (id,title,region,event_date,event_time,source,status,confidence,details,created_by,priority,evidence_name,evidence_type,evidence_data,contact_authorized,anonymous)
    VALUES (?,?,?,?,?,'População','Em análise',0,?,?,?,?,?,?,?,?)`)
    .run(id, input.title.trim(), input.region.trim(), input.eventDate, input.eventTime, input.details.trim(), user.id,
      input.priority === "Urgente" ? "Urgente" : "Normal", input.evidenceName ?? null, input.evidenceType ?? null,
      input.evidenceData ?? null, input.contactAuthorized ? 1 : 0, input.anonymous ? 1 : 0);
  createInstitutionalNotification(user.id, "Nova ocorrência da população", input.region.trim(), input.eventDate, input.eventTime,
    `${protocol(id)} · ${input.title.trim()} · Prioridade ${input.priority === "Urgente" ? "urgente" : "normal"}`);
  return { ok: true, protocol: protocol(id) };
}

export function addCitizenContest(input: { reason: string; details: string }) {
  const user = requireCitizen();
  if (!input.reason.trim() || !input.details.trim()) throw new Error("Informe o motivo e explique a contestação.");
  const id = randomUUID();
  const now = new Date();
  const eventDate = now.toISOString().slice(0, 10);
  const eventTime = now.toTimeString().slice(0, 5);
  db.prepare(`INSERT INTO contests
    (id,title,region,event_date,event_time,source,status,confidence,details,created_by)
    VALUES (?,? ,?,?,?,?, 'Aguardando análise',0,?,?)`)
    .run(id, input.reason.trim(), user.city, eventDate, eventTime, "População", input.details.trim(), user.id);
  createInstitutionalNotification(user.id, "Nova contestação da população", user.city, eventDate, eventTime,
    `${contestProtocol(id)} · ${input.reason.trim()}`);
  return { ok: true, protocol: contestProtocol(id) };
}

export function myCitizenOccurrences() {
  const user = requireCitizen();
  return (db.prepare("SELECT * FROM occurrences WHERE created_by = ? ORDER BY event_date DESC, created_at DESC").all(user.id) as Record<string, unknown>[])
    .map(mapRow)
    .map((item) => ({ ...item, protocol: protocol(item.id) }));
}

export function myCitizenAlerts() {
  const user = requireCitizen();
  const occurrenceAlerts = (db.prepare("SELECT * FROM occurrences WHERE created_by = ?").all(user.id) as Record<string, unknown>[]).map(mapRow).map((item) => ({
    id: item.id,
    type: "Ocorrência atualizada",
    text: `Ocorrência “${item.title}” está com o status: ${item.status}.`,
    status: item.status,
    createdAt: item.createdAt,
  }));
  const contestAlerts = (db.prepare("SELECT * FROM contests WHERE created_by = ?").all(user.id) as Record<string, unknown>[]).map(mapRow).map((item) => ({
    id: item.id,
    type: "Contestação atualizada",
    text: `Contestação “${item.title}” está com o status: ${item.status}.`,
    status: item.status,
    createdAt: item.createdAt,
  }));
  return [...occurrenceAlerts, ...contestAlerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function citizenDashboard() {
  const user = currentSession();
  if (!user || user.role !== "citizen") throw new Error("Acesso da população necessário.");
  const allRows = (db.prepare("SELECT * FROM occurrences ORDER BY event_date DESC").all() as Record<string, unknown>[]).map(mapRow);
  const rows = user.neighborhood
    ? allRows.filter((item) => item.region.localeCompare(user.neighborhood!, "pt-BR", { sensitivity: "base" }) === 0)
    : allRows;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const recent = rows.filter((item) => new Date(`${item.eventDate}T12:00:00`) >= cutoff);
  const confirmed = recent.filter((item) => item.status.toLowerCase().includes("confirm")).length;
  const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weekdays = weekdayNames.map((day, index) => ({ day, value: recent.filter((item) => new Date(`${item.eventDate}T12:00:00`).getDay() === index).length }));
  const hourLabels = ["00h", "04h", "08h", "12h", "16h", "20h"];
  const hours = hourLabels.map((hour, index) => ({ hour, value: recent.filter((item) => item.eventTime && Math.floor(Number(item.eventTime.slice(0, 2)) / 4) === index).length }));
  const now = new Date();
  const monthly = Array.from({ length: 3 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (2 - offset), 1);
    return { month: date.toLocaleDateString("pt-BR", { month: "short" }), value: rows.filter((item) => { const event = new Date(`${item.eventDate}T12:00:00`); return event.getFullYear() === date.getFullYear() && event.getMonth() === date.getMonth(); }).length };
  });
  const maxDay = weekdays.reduce((best, item) => item.value > best.value ? item : best, weekdays[0]!);
  const maxHour = hours.reduce((best, item) => item.value > best.value ? item : best, hours[0]!);
  return {
    region: user.neighborhood ?? user.city,
    recent: recent.length,
    confirmed,
    confirmationRate: recent.length ? Math.round(confirmed / recent.length * 100) : 0,
    peakDay: maxDay.value ? maxDay.day : "Sem dados",
    peakHour: maxHour.value ? `${maxHour.hour} — ${String((Number(maxHour.hour.slice(0, 2)) + 3) % 24).padStart(2, "0")}h` : "Sem dados",
    monthly: monthly.map((item) => ({ mes: item.month, ocorrencias: item.value })),
    weekdays: weekdays.map((item) => ({ dia: item.day, ocorrencias: item.value })),
    hours: hours.map((item) => ({ hora: item.hour, ocorrencias: item.value })),
  };
}

const salvadorRegions: Record<string, [number, number]> = {
  "centro": [-38.5108, -12.9714], "barra": [-38.5270, -13.0090], "brotas": [-38.4861, -12.9901],
  "pituba": [-38.4590, -13.0005], "itapuã": [-38.3567, -12.9478], "cajazeiras": [-38.4019, -12.9016],
  "cabula": [-38.4463, -12.9567], "periperi": [-38.4784, -12.8530], "liberdade": [-38.5010, -12.9442],
  "rio vermelho": [-38.4890, -13.0102], "boca do rio": [-38.4314, -12.9792], "são cristóvão": [-38.3734, -12.9166],
  "sao cristovao": [-38.3734, -12.9166], "paripe": [-38.4723, -12.8410], "federação": [-38.5009, -13.0054],
  "federacao": [-38.5009, -13.0054], "salvador": [-38.5014, -12.9730],
};

export function heatmapData() {
  const user = currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const rows = (db.prepare("SELECT region, COUNT(*) AS total FROM occurrences GROUP BY region").all() as { region: string; total: number }[]);
  return rows.map((row) => {
    const normalized = row.region.trim().toLocaleLowerCase("pt-BR");
    const coordinates = salvadorRegions[normalized] ?? salvadorRegions.salvador;
    return { region: row.region, count: Number(row.total), longitude: coordinates[0], latitude: coordinates[1] };
  });
}
