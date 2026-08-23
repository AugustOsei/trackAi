import { providerStyle } from "@/lib/providers";

const SIZES = {
  sm: "h-8 w-8 text-sm",
  md: "h-11 w-11 text-base",
  lg: "h-16 w-16 text-2xl",
};

export function ProviderBadge({
  provider,
  size = "md",
}: {
  provider: string;
  size?: keyof typeof SIZES;
}) {
  const style = providerStyle(provider);
  return (
    <span
      className={`font-display inline-flex shrink-0 items-center justify-center rounded-xl font-bold ${SIZES[size]}`}
      style={{ backgroundColor: style.color, color: style.fg }}
      title={provider}
      aria-hidden="true"
    >
      {style.initials}
    </span>
  );
}
