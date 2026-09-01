import { providerStyle } from "@/lib/providers";

const SIZES = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-sm" },
  md: { box: "h-11 w-11", icon: "h-5 w-5", text: "text-base" },
  lg: { box: "h-16 w-16", icon: "h-8 w-8", text: "text-2xl" },
};

export function ProviderBadge({
  provider,
  size = "md",
  muted = false,
}: {
  provider: string;
  size?: keyof typeof SIZES;
  /** Not shipped yet — rumored *or* merely announced. The badge desaturates
   *  rather than carrying a brand color it hasn't earned yet; full color is
   *  reserved for models that actually exist. The rumored/announced
   *  distinction is carried by `StatusDot`, not by this. */
  muted?: boolean;
}) {
  const style = providerStyle(provider);
  const s = SIZES[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${s.box} ${
        muted ? "grayscale opacity-60" : ""
      }`}
      style={{ backgroundColor: style.color }}
      title={provider}
      aria-hidden="true"
    >
      {style.logoPath ? (
        <svg viewBox="0 0 24 24" className={s.icon} fill={style.fg} aria-hidden="true">
          <path d={style.logoPath} />
        </svg>
      ) : (
        <span className={`font-display font-bold ${s.text}`} style={{ color: style.fg }}>
          {style.initials}
        </span>
      )}
    </span>
  );
}
