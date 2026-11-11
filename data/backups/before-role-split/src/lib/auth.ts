import { createServerFn } from "@tanstack/react-start";
import type { AccessibilityPreferences, AccountRole, RegisterInput, SessionUser } from "./auth.server";

export type { AccessibilityPreferences, AccountRole, RegisterInput, SessionUser };

export const registerFn = createServerFn({ method: "POST" })
  .validator((input: RegisterInput) => input)
  .handler(async ({ data }) => {
    const { registerAccount } = await import("./auth.server");
    return registerAccount(data);
  });

export const loginFn = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string; role: AccountRole; functionalId?: string }) => input)
  .handler(async ({ data }) => {
    const { loginAccount } = await import("./auth.server");
    return loginAccount(data);
  });

export const sessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const { currentSession } = await import("./auth.server");
  return currentSession();
});

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { endSession } = await import("./auth.server");
  endSession();
  return { ok: true };
});
export const accessibilityPreferencesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getAccessibilityPreferences } = await import("./auth.server"); return getAccessibilityPreferences();
});
export const saveAccessibilityPreferencesFn = createServerFn({ method: "POST" })
  .validator((input: AccessibilityPreferences) => input)
  .handler(async ({ data }) => { const { saveAccessibilityPreferences } = await import("./auth.server"); return saveAccessibilityPreferences(data); });
export const changePasswordFn = createServerFn({ method: "POST" })
  .validator((input: { currentPassword: string; newPassword: string }) => input)
  .handler(async ({ data }) => { const { changePassword } = await import("./auth.server"); return changePassword(data); });
export const resetCitizenPasswordFn = createServerFn({ method: "POST" })
  .validator((input: { email: string; cpf: string; newPassword: string }) => input)
  .handler(async ({ data }) => { const { resetCitizenPassword } = await import("./auth.server"); return resetCitizenPassword(data); });
export const updatePhoneFn = createServerFn({ method: "POST" })
  .validator((input: { phone: string }) => input)
  .handler(async ({ data }) => { const { updatePhone } = await import("./auth.server"); return updatePhone(data.phone); });
export const resetInstitutionalPasswordFn = createServerFn({ method: "POST" })
  .validator((input: { email: string; functionalId: string; newPassword: string }) => input)
  .handler(async ({ data }) => { const { resetInstitutionalPassword } = await import("./auth.server"); return resetInstitutionalPassword(data); });
