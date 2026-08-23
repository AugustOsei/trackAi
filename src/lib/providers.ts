/**
 * Real brand colors, used only as small monogram badges (never reproduced
 * logos) — the per-row color anchor that a plain gold-only accent couldn't
 * provide. Falls back to trackai's own gold for anything unrecognized.
 */
export const PROVIDER_STYLES: Record<string, { initials: string; color: string; fg: string }> = {
  Anthropic: { initials: "A", color: "#D97757", fg: "#1a0f0a" },
  OpenAI: { initials: "O", color: "#10A37F", fg: "#04120d" },
  "Google DeepMind": { initials: "G", color: "#4285F4", fg: "#06122b" },
  xAI: { initials: "X", color: "#E8E8ED", fg: "#0a0a0b" },
  Meta: { initials: "M", color: "#0866FF", fg: "#04102b" },
};

const FALLBACK = { initials: "?", color: "#F5C518", fg: "#1a1400" };

export function providerStyle(provider: string) {
  return PROVIDER_STYLES[provider] ?? { ...FALLBACK, initials: provider.charAt(0).toUpperCase() };
}
