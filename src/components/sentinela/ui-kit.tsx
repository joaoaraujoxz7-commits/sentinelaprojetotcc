import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Lumia } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-card p-5", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="font-sans text-sm font-semibold tracking-wide text-foreground">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone];
  return (
    <div className="surface-card p-4 transition-colors hover:border-primary/40">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-sans text-2xl font-semibold", toneClass)}>{value}</p>
      {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
      {hint && <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

const statusTones: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-primary/12 text-primary border-primary/30",
  success: "bg-success/12 text-success border-success/30",
  warning: "bg-warning/12 text-warning border-warning/30",
  danger: "bg-destructive/12 text-destructive border-destructive/30",
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof statusTones | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        statusTones[tone] ?? statusTones["neutral"],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ConfidenceBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label ?? "Confiabilidade estimada"}</span>
        <span className="font-medium text-primary">{value}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="brand-gradient h-full rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function LumiaCard({
  title = "LumIA explica",
  message,
  cta = "Conversar com a LumIA",
  to = "/app/lumia",
}: {
  title?: string;
  message: string;
  cta?: string;
  to?: string;
}) {
  return (
    <div className="surface-card glow-ring flex items-center gap-4 p-5">
      <Lumia size={64} />
      <div className="flex-1">
        <p className="font-sans text-sm font-semibold text-primary">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        <Button asChild size="sm" variant="secondary" className="mt-3">
          <Link to={to}>{cta}</Link>
        </Button>
      </div>
    </div>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-primary/25 bg-primary/8 p-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

export function Timeline({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 size-3 rounded-full border-2",
                  done ? "border-primary bg-primary" : "border-border bg-transparent",
                )}
              />
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "w-px flex-1",
                    i < current ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className="pb-6">
              <p
                className={cn(
                  "text-sm",
                  done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 p-10 text-center">
      <Lumia size={72} />
      <h3 className="font-sans text-base font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
