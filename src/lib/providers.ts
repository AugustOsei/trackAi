/**
 * Real brand marks, sourced from Simple Icons (MIT-licensed, the standard
 * open dataset for exactly this — nominative/editorial use to identify a
 * company, not an endorsement claim). Anthropic, Google DeepMind, and Meta
 * are included there. OpenAI and xAI are notably absent from that dataset
 * even though it covers 3,400+ brands — a signal those two are more
 * protective of their marks — so those two fall back to a designed
 * monogram instead of a scraped/reproduced logo.
 */
type ProviderStyle = {
  color: string;
  fg: string;
  logoPath?: string; // 24x24 viewBox, Simple Icons convention
  initials: string;
};

export const PROVIDER_STYLES: Record<string, ProviderStyle> = {
  Anthropic: {
    color: "#D97757",
    fg: "#ffffff",
    initials: "A",
    logoPath:
      "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z",
  },
  "Google DeepMind": {
    color: "#4285F4",
    fg: "#ffffff",
    initials: "G",
    logoPath:
      "m5.99,1.62a8.54,8.54 0 0 0 -2.54,6.83c0.35,4.4 4.51,7.99 8.28,7.99c3.5,0 4.88,-3.06 4.54,-5.14a4.32,4.32 0 0 0 -0.95,-2.07c0.63,0.34 1.24,0.77 1.81,1.3c1.52,1.41 2.44,3.23 2.58,5.1c0.33,4.13 -2.73,8.37 -7.85,8.37c-1.69,0 -3.48,-0.43 -4.98,-1.14c-4.06,-1.92 -6.88,-6.06 -6.88,-10.86c0,-4.43 2.41,-8.3 5.99,-10.38zm6.15,-1.62c1.69,0 3.48,0.43 4.98,1.14a12,12 0 0 1 6.88,10.86c0,4.43 -2.41,8.3 -5.99,10.38a8.54,8.54 0 0 0 2.54,-6.83c-0.35,-4.4 -4.51,-7.99 -8.28,-7.99c-3.5,0 -4.88,3.06 -4.54,5.14a4.3,4.3 0 0 0 0.96,2.07a8.72,8.72 0 0 1 -1.81,-1.3c-1.52,-1.41 -2.44,-3.23 -2.59,-5.1c-0.33,-4.13 2.73,-8.37 7.85,-8.37z",
  },
  Meta: {
    color: "#0467DF",
    fg: "#ffffff",
    initials: "M",
    logoPath:
      "M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z",
  },
  OpenAI: { color: "#10A37F", fg: "#ffffff", initials: "O" },
  xAI: { color: "#E8E8ED", fg: "#0a0a0b", initials: "X" },
};

const FALLBACK: ProviderStyle = { color: "#F5C518", fg: "#1a1400", initials: "?" };

export function providerStyle(provider: string): ProviderStyle {
  return PROVIDER_STYLES[provider] ?? { ...FALLBACK, initials: provider.charAt(0).toUpperCase() };
}
