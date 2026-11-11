import logo from "@/assets/sentinela-logo.png";
import owl from "@/assets/lumia-owl.png";
import { cn } from "@/lib/utils";

export function Logo({
  size = 36,
  withName = true,
  subtitle,
  className,
}: {
  size?: number;
  withName?: boolean;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={logo}
        alt="Logotipo Sentinela: escudo com pino de localização"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="drop-shadow-[0_0_12px_oklch(0.735_0.101_179.5_/_45%)]"
      />
      {withName && (
        <div className="leading-tight">
          <span className="font-sans text-lg font-semibold tracking-[0.22em] text-foreground">
            SENTINELA
          </span>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function Lumia({
  size = 56,
  className,
  glow = true,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  return (
    <img
      src={owl}
      alt="LumIA, a coruja azul assistente de inteligência do Sentinela"
      loading="lazy"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn(
        "object-contain",
        glow && "drop-shadow-[0_0_18px_oklch(0.62_0.09_232_/_55%)]",
        className,
      )}
    />
  );
}
