interface LogoProps {
  /** Height of the mark in px. */
  size?: number;
  /** Show the "ShadowGuard" wordmark next to the mark. */
  showWordmark?: boolean;
  /** Show the "by Micro SaaS" sub-label under the wordmark. */
  showSub?: boolean;
  /** Tailwind classes for the wordmark text (color/size). */
  wordmarkClassName?: string;
  /** Tailwind classes for the "by Micro SaaS" sub-label. */
  subClassName?: string;
  className?: string;
}

/**
 * ShadowGuard logo — the Micro SaaS network mark + product wordmark.
 * The mark lives in /public/logo-icon.png (shared Micro SaaS brand asset).
 */
export function Logo({
  size = 36,
  showWordmark = true,
  showSub = true,
  wordmarkClassName = "text-lg text-white",
  subClassName = "text-slate-400",
  className = "",
}: LogoProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo-icon.png"
        alt="Micro SaaS"
        style={{ height: size, width: size }}
        className="object-contain shrink-0"
      />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight ${wordmarkClassName}`}>ShadowGuard</span>
          {showSub && (
            <span className={`text-[10px] font-semibold uppercase tracking-widest ${subClassName}`}>
              by Micro SaaS
            </span>
          )}
        </span>
      )}
    </span>
  );
}
