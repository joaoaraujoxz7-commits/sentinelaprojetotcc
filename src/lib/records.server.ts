import "@tanstack/react-start/server-only";
import { randomUUID } from "node:crypto";
import { currentSession } from "./auth.server";
import { db, NOW_TEXT } from "./db.server";

export type RecordKind = "occurrences" | "predictions" | "audits" | "contests" | "reports" | "notifications" | "patrols" | "recommendations" | "ai_decisions" | "bias_alerts" | "mitigations" | "models" | "data_quality";
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
  result?: string;
  recommendationFollowed?: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  protocol?: string;
};

const tables: Record<RecordKind, string> = {
  occurrences: "occurrences", predictions: "predictions", audits: "audits",
  contests: "contests", reports: "reports", notifications: "notifications",
  patrols: "patrols", recommendations: "recommendations", ai_decisions: "ai_decisions",
  bias_alerts: "bias_alerts", mitigations: "mitigations", models: "models", data_quality: "data_quality",
};

async function requireInstitutional() {
  const user = await currentSession();
  if (!user || user.role !== "institutional") throw new Error("Acesso institucional necessário.");
  return user;
}

async function requireRecordPermission(kind: RecordKind, mutation = false) {
  const user = await requireInstitutional();
  if (!mutation) return user;
  const agentKinds: RecordKind[] = ["occurrences", "predictions", "patrols", "recommendations", "ai_decisions"];
  const auditorKinds: RecordKind[] = ["predictions", "audits", "contests", "reports", "bias_alerts", "mitigations", "models", "data_quality"];
  const allowed = user.institutionalType === "agent" ? agentKinds : auditorKinds;
  if (!allowed.includes(kind)) throw new Error("Seu perfil institucional não pode alterar este tipo de registro.");
  return user;
}

async function requireCitizen() {
  const user = await currentSession();
  if (!user || user.role !== "citizen") throw new Error("Acesso da população necessário.");
  return user;
}

function protocol(id: string) {
  return `SNT-${new Date().getFullYear()}-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function contestProtocol(id: string) {
  return `CT-${new Date().getFullYear()}-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

async function createInstitutionalNotification(userId: string, title: string, region: string, eventDate: string, eventTime: string, details: string) {
  await db.run(`INSERT INTO notifications
    (id,title,region,event_date,event_time,source,status,confidence,details,created_by)
    VALUES (?,?,?,?,?,'População','Nova',0,?,?)`, randomUUID(), title, region, eventDate, eventTime, details, userId);
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
    result: row.result ? String(row.result) : undefined,
    recommendationFollowed: Boolean(row.recommendation_followed),
    latitude: row.latitude == null ? undefined : Number(row.latitude), longitude: row.longitude == null ? undefined : Number(row.longitude),
    city: row.city ? String(row.city) : undefined, state: row.state ? String(row.state) : undefined,
  };
}

export async function listRecords(kind: RecordKind) {
  await requireRecordPermission(kind);
  const query = kind === "occurrences"
    ? `SELECT occurrences.*, users.name AS reporter_name, users.email AS reporter_email, users.phone AS reporter_phone
       FROM occurrences JOIN users ON users.id = occurrences.created_by ORDER BY event_date DESC, occurrences.created_at DESC`
    : kind === "contests"
      ? `SELECT contests.*, users.name AS reporter_name, users.email AS reporter_email, users.phone AS reporter_phone
         FROM contests JOIN users ON users.id = contests.created_by ORDER BY event_date DESC, contests.created_at DESC`
      : `SELECT * FROM ${tables[kind]} ORDER BY event_date DESC, created_at DESC`;
  return (await db.all(query) as Record<string, unknown>[]).map(mapRow).map((item) => kind === "contests" ? { ...item, protocol: contestProtocol(item.id) } : item);
}

export async function reviewContest(input: { id: string; decision: "Manter decisão" | "Alterar decisão" | "Cancelar decisão" | "Solicitar mais informações"; justification: string }) {
  const user = await requireInstitutional();
  if (user.institutionalType !== "auditor") throw new Error("Somente auditores podem concluir revisões humanas.");
  const justification = input.justification.trim();
  if (!justification) throw new Error("Informe a justificativa da decisão humana.");
  const current = await db.get("SELECT details FROM contests WHERE id = ?", input.id) as { details: string } | undefined;
  if (!current) throw new Error("Contestação não encontrada.");
  const status = input.decision === "Solicitar mais informações" ? "Aguardando informações" : "Revisão concluída";
  const auditText = `${current.details}\n\nDecisão humana: ${input.decision}. Justificativa: ${justification}. Auditor responsável: ${user.name}.`;
  await db.run(`UPDATE contests SET status = ?, details = ?, updated_at = ${NOW_TEXT} WHERE id = ?`, status, auditText, input.id);
  await db.run(`INSERT INTO audits (id,title,region,event_date,event_time,source,status,confidence,details,created_by)
    SELECT ?, ?, region, to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD'), to_char(now() AT TIME ZONE 'UTC', 'HH24:MI'), 'Revisão humana', 'Registrado', 100, ?, ? FROM contests WHERE id = ?`, randomUUID(), `Revisão ${contestProtocol(input.id)}`, `${input.decision}. ${justification}`, user.id, input.id);
  return { ok: true, status };
}

export async function addRecord(kind: RecordKind, input: Omit<ManagedRecord, "id" | "createdBy" | "createdAt">) {
  const user = await requireRecordPermission(kind, true);
  if (!input.title.trim()) throw new Error("Informe o título ou tipo do registro.");
  const id = randomUUID();
  if (kind === "patrols") {
    await db.run(`INSERT INTO patrols (id,title,region,event_date,event_time,source,status,confidence,details,created_by,result,recommendation_followed) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, id, input.title.trim(), input.region.trim() || user.city, input.eventDate, input.eventTime, "Agente policial", input.status.trim() || "Realizado", 0, input.details.trim(), user.id, input.result?.trim() ?? "", input.recommendationFollowed ? 1 : 0);
  } else {
    await db.run(`INSERT INTO ${tables[kind]} (id,title,region,event_date,event_time,source,status,confidence,details,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`, id, input.title.trim(), input.region.trim() || "Salvador", input.eventDate, input.eventTime, input.source.trim() || "Institucional", input.status.trim() || "Pendente", Math.max(0, Math.min(100, input.confidence || 0)), input.details.trim(), user.id);
  }
  return { ok: true };
}

export async function updateRecord(kind: RecordKind, id: string, status: string) {
  await requireRecordPermission(kind, true);
  await db.run(`UPDATE ${tables[kind]} SET status = ?, updated_at = ${NOW_TEXT} WHERE id = ?`, status, id);
  return { ok: true };
}

export async function removeRecord(kind: RecordKind, id: string) {
  await requireRecordPermission(kind, true);
  await db.run(`DELETE FROM ${tables[kind]} WHERE id = ?`, id);
  return { ok: true };
}

export async function addCitizenOccurrence(input: { title: string; region: string; eventDate: string; eventTime: string; details: string; priority: string; evidenceName?: string; evidenceType?: string; evidenceData?: string; contactAuthorized: boolean; anonymous: boolean; latitude?: number; longitude?: number; city?: string; state?: string }) {
  const user = await requireCitizen();
  if (!input.title.trim() || !input.region.trim() || !input.eventDate) throw new Error("Preencha o tipo, o local e a data.");
  const id = randomUUID();
  if (input.evidenceData && input.evidenceData.length > 7_000_000) throw new Error("A evidência deve ter no máximo 5 MB.");
  await db.run(`INSERT INTO occurrences
    (id,title,region,event_date,event_time,source,status,confidence,details,created_by,priority,evidence_name,evidence_type,evidence_data,contact_authorized,anonymous,latitude,longitude,city,state)
    VALUES (?,?,?,?,?,'População','Em análise',0,?,?,?,?,?,?,?,?,?,?,?,?)`, id, input.title.trim(), input.region.trim(), input.eventDate, input.eventTime, input.details.trim(), user.id,
      input.priority === "Urgente" ? "Urgente" : "Normal", input.evidenceName ?? null, input.evidenceType ?? null,
      input.evidenceData ?? null, input.contactAuthorized ? 1 : 0, input.anonymous ? 1 : 0,
      Number.isFinite(input.latitude) ? input.latitude : null, Number.isFinite(input.longitude) ? input.longitude : null,
      input.city?.trim() || user.city, input.state?.trim() || user.state);
  await createInstitutionalNotification(user.id, "Nova ocorrência da população", input.region.trim(), input.eventDate, input.eventTime,
    `${protocol(id)} · ${input.title.trim()} · Prioridade ${input.priority === "Urgente" ? "urgente" : "normal"}`);
  return { ok: true, protocol: protocol(id) };
}

export async function addCitizenContest(input: { targetType: "occurrence" | "prediction"; reason: string; details: string; targetId?: string; evidenceName?: string; evidenceType?: string; evidenceData?: string }) {
  const user = await requireCitizen();
  if (!input.reason.trim() || !input.details.trim()) throw new Error("Informe o motivo e explique a contestação.");
  const id = randomUUID();
  const now = new Date();
  const eventDate = now.toISOString().slice(0, 10);
  const eventTime = now.toTimeString().slice(0, 5);
  const targetLabel = input.targetType === "prediction" ? "Previsão da IA" : "Decisão sobre ocorrência";
  if (input.evidenceData && input.evidenceData.length > 7_000_000) throw new Error("A evidência deve ter no máximo 5 MB.");
  await db.run(`INSERT INTO contests
    (id,title,region,event_date,event_time,source,status,confidence,details,created_by,evidence_name,evidence_type,evidence_data)
    VALUES (?,? ,?,?,?,?, 'Aguardando análise',0,?,?,?,?,?)`, id, `${targetLabel}: ${input.reason.trim()}`, user.city, eventDate, eventTime, "População", `${input.targetId ? `Registro contestado: ${input.targetId}. ` : ""}${input.details.trim()}`, user.id, input.evidenceName ?? null, input.evidenceType ?? null, input.evidenceData ?? null);
  await createInstitutionalNotification(user.id, "Nova contestação da população", user.city, eventDate, eventTime,
    `${contestProtocol(id)} · ${targetLabel} · ${input.reason.trim()}`);
  return { ok: true, protocol: contestProtocol(id) };
}

export async function citizenDecisionRecords() {
  const user = await requireCitizen();
  const ownOccurrences = (await db.all("SELECT * FROM occurrences WHERE created_by = ? ORDER BY event_date DESC", user.id) as Record<string, unknown>[]).map(mapRow).map((item) => ({ ...item, kind: "occurrence" as const, protocol: protocol(item.id) }));
  const predictions = (await db.all("SELECT * FROM predictions ORDER BY event_date DESC") as Record<string, unknown>[]).map(mapRow).map((item) => ({ ...item, kind: "prediction" as const, protocol: `PR-${new Date().getFullYear()}-${item.id.replaceAll("-", "").slice(0, 8).toUpperCase()}` }));
  return [...ownOccurrences, ...predictions].sort((a, b) => `${b.eventDate}${b.eventTime}`.localeCompare(`${a.eventDate}${a.eventTime}`));
}

export async function myCitizenContests() {
  const user = await requireCitizen();
  return (await db.all("SELECT * FROM contests WHERE created_by = ? ORDER BY event_date DESC, created_at DESC", user.id) as Record<string, unknown>[]).map(mapRow).map((item) => ({ ...item, protocol: contestProtocol(item.id) }));
}

export async function publicTransparency() {
  const count = async (table: string) => Number((await db.get(`SELECT COUNT(*) AS total FROM ${table}`) as { total: number }).total);
  const corrections = Number((await db.get("SELECT COUNT(*) AS total FROM contests WHERE status ILIKE '%conclu%' OR details LIKE '%Alterar decisão%' OR details LIKE '%Cancelar decisão%'") as { total: number }).total);
  const limitations = (await db.all("SELECT title, details, status FROM data_quality ORDER BY event_date DESC LIMIT 6") as Array<{ title: string; details: string; status: string }>);
  return { analyses: await count("predictions"), humanReviews: await count("audits"), contests: await count("contests"), corrections, biasAlerts: await count("bias_alerts"), mitigations: await count("mitigations"), limitations };
}

export async function myCitizenOccurrences() {
  const user = await requireCitizen();
  return (await db.all("SELECT * FROM occurrences WHERE created_by = ? ORDER BY event_date DESC, created_at DESC", user.id) as Record<string, unknown>[])
    .map(mapRow)
    .map((item) => ({ ...item, protocol: protocol(item.id) }));
}

export async function myCitizenAlerts() {
  const user = await requireCitizen();
  const occurrenceAlerts = (await db.all("SELECT * FROM occurrences WHERE created_by = ?", user.id) as Record<string, unknown>[]).map(mapRow).map((item) => ({
    id: item.id,
    type: "Ocorrência atualizada",
    text: `Ocorrência “${item.title}” está com o status: ${item.status}.`,
    status: item.status,
    createdAt: item.createdAt,
    details: item.details,
    title: item.title,
    kind: "occurrence" as const,
    protocol: protocol(item.id),
  }));
  const contestAlerts = (await db.all("SELECT * FROM contests WHERE created_by = ?", user.id) as Record<string, unknown>[]).map(mapRow).map((item) => ({
    id: item.id,
    type: "Contestação atualizada",
    text: `Contestação “${item.title}” está com o status: ${item.status}.`,
    status: item.status,
    createdAt: item.createdAt,
    details: item.details,
    title: item.title,
    kind: "contest" as const,
    protocol: contestProtocol(item.id),
  }));
  return [...occurrenceAlerts, ...contestAlerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function citizenDashboard() {
  const user = await currentSession();
  if (!user || user.role !== "citizen") throw new Error("Acesso da população necessário.");
  const allRows = (await db.all("SELECT * FROM occurrences ORDER BY event_date DESC") as Record<string, unknown>[]).map(mapRow);
  const rows = user.neighborhood
    ? allRows.filter((item) => item.region.localeCompare(user.neighborhood!, "pt-BR", { sensitivity: "base" }) === 0)
    : allRows;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const recent = rows.filter((item) => new Date(`${item.eventDate}T12:00:00`) >= cutoff);
  const confirmed = recent.filter((item) => {
    const status = item.status.toLocaleLowerCase("pt-BR");
    return status.includes("confirm") || status === "validação" || status === "validacao";
  }).length;
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

export type MapFilterInput = { period?: string; type?: string; time?: string; weekday?: string; source?: string; status?: string; confidence?: string };
export async function heatmapData(filters: MapFilterInput = {}) {
  const user = await currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const allRows = (await db.all("SELECT * FROM occurrences ORDER BY event_date DESC") as Record<string, unknown>[]).map(mapRow);
  const cutoffDays = filters.period === "Últimos 7 dias" ? 7 : filters.period === "3 meses" ? 90 : filters.period === "12 meses" ? 365 : 30;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - cutoffDays);
  const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const filtered = allRows.filter((item) => {
    if (item.eventDate && new Date(`${item.eventDate}T12:00:00`) < cutoff) return false;
    if (filters.type && filters.type !== "Todos os tipos" && item.title !== filters.type) return false;
    if (filters.source && filters.source !== "Todas" && item.source !== filters.source) return false;
    if (filters.status && filters.status !== "Todos" && item.status !== filters.status) return false;
    if (filters.confidence === "Acima de 50%" && item.confidence < 50) return false;
    if (filters.confidence === "Acima de 70%" && item.confidence < 70) return false;
    if (filters.confidence === "Acima de 85%" && item.confidence < 85) return false;
    if (filters.weekday && filters.weekday !== "Todos" && weekdayNames[new Date(`${item.eventDate}T12:00:00`).getDay()] !== filters.weekday) return false;
    if (filters.time && filters.time !== "Todos" && item.eventTime) { const hour = Number(item.eventTime.slice(0, 2)); const ranges: Record<string, [number, number]> = { "00h-06h": [0, 6], "06h-12h": [6, 12], "12h-18h": [12, 18], "18h-00h": [18, 24] }; const range = ranges[filters.time]; if (range && (hour < range[0] || hour >= range[1])) return false; }
    return true;
  });
  const grouped = new Map<string, { region: string; count: number; longitude: number; latitude: number }>();
  for (const item of filtered) {
    const normalized = item.region.trim().toLocaleLowerCase("pt-BR");
    const fallback = salvadorRegions[normalized] ?? salvadorRegions.salvador;
    const longitude = item.longitude ?? fallback[0]; const latitude = item.latitude ?? fallback[1];
    const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`; const current = grouped.get(key);
    grouped.set(key, current ? { ...current, count: current.count + 1 } : { region: item.region, count: 1, longitude, latitude });
  }
  return [...grouped.values()];
}
