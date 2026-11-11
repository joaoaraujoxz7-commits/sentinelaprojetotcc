import { createFileRoute, redirect } from "@tanstack/react-router";
import { logoutFn } from "@/lib/auth";

export const Route = createFileRoute("/sair")({
  beforeLoad: async () => {
    await logoutFn();
    throw redirect({ to: "/acesso" });
  },
  component: () => null,
});
