import { createServerFn } from "@tanstack/react-start";
import type { ManagedRecord, RecordKind } from "./records.server";
export type { ManagedRecord, RecordKind };

export const listRecordsFn = createServerFn({ method: "GET" }).validator((input: { kind: RecordKind }) => input).handler(async ({ data }) => {
  const { listRecords } = await import("./records.server"); return listRecords(data.kind);
});
export const addRecordFn = createServerFn({ method: "POST" }).validator((input: { kind: RecordKind; record: Omit<ManagedRecord, "id" | "createdBy" | "createdAt"> }) => input).handler(async ({ data }) => {
  const { addRecord } = await import("./records.server"); return addRecord(data.kind, data.record);
});
export const updateRecordFn = createServerFn({ method: "POST" }).validator((input: { kind: RecordKind; id: string; status: string }) => input).handler(async ({ data }) => {
  const { updateRecord } = await import("./records.server"); return updateRecord(data.kind, data.id, data.status);
});
export const removeRecordFn = createServerFn({ method: "POST" }).validator((input: { kind: RecordKind; id: string }) => input).handler(async ({ data }) => {
  const { removeRecord } = await import("./records.server"); return removeRecord(data.kind, data.id);
});
export const citizenDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  const { citizenDashboard } = await import("./records.server"); return citizenDashboard();
});
export const heatmapDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const { heatmapData } = await import("./records.server"); return heatmapData();
});
export const filteredHeatmapDataFn = createServerFn({ method: "GET" })
  .validator((input: { period?: string; type?: string; time?: string; weekday?: string; source?: string; status?: string; confidence?: string }) => input)
  .handler(async ({ data }) => { const { heatmapData } = await import("./records.server"); return heatmapData(data); });
export const addCitizenOccurrenceFn = createServerFn({ method: "POST" })
  .validator((input: { title: string; region: string; eventDate: string; eventTime: string; details: string; priority: string; evidenceName?: string; evidenceType?: string; evidenceData?: string; contactAuthorized: boolean; anonymous: boolean; latitude?: number; longitude?: number; city?: string; state?: string }) => input)
  .handler(async ({ data }) => { const { addCitizenOccurrence } = await import("./records.server"); return addCitizenOccurrence(data); });
export const myCitizenOccurrencesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { myCitizenOccurrences } = await import("./records.server"); return myCitizenOccurrences();
});
export const myCitizenAlertsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { myCitizenAlerts } = await import("./records.server"); return myCitizenAlerts();
});
export const addCitizenContestFn = createServerFn({ method: "POST" })
  .validator((input: { targetType: "occurrence" | "prediction"; reason: string; details: string; targetId?: string; evidenceName?: string; evidenceType?: string; evidenceData?: string }) => input)
  .handler(async ({ data }) => { const { addCitizenContest } = await import("./records.server"); return addCitizenContest(data); });
export const citizenDecisionRecordsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { citizenDecisionRecords } = await import("./records.server"); return citizenDecisionRecords();
});
export const myCitizenContestsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { myCitizenContests } = await import("./records.server"); return myCitizenContests();
});
export const publicTransparencyFn = createServerFn({ method: "GET" }).handler(async () => {
  const { publicTransparency } = await import("./records.server"); return publicTransparency();
});
export const reviewContestFn = createServerFn({ method: "POST" })
  .validator((input: { id: string; decision: "Manter decisão" | "Alterar decisão" | "Cancelar decisão" | "Solicitar mais informações"; justification: string }) => input)
  .handler(async ({ data }) => { const { reviewContest } = await import("./records.server"); return reviewContest(data); });
