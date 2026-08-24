import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "trackai — claim vs. reality, tracked";

/** Provider brand colors, echoing the site's own badges — plain dots here,
 * not logos, since a promotional share image is the wrong place to be
 * reproducing anyone's trademark. */
const DOTS = ["#D97757", "#10A37F", "#4285F4", "#FF4500", "#6E56CF", "#F0652F"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "#0a0a0b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 64, fontWeight: 900, color: "#f7f7f5" }}>
            trackai
          </span>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#f5c518",
              marginLeft: 10,
              marginBottom: 8,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 28,
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          <span style={{ color: "#f7f7f5" }}>Every release.</span>
          <span style={{ color: "#f5c518" }}>Every claim, tested.</span>
        </div>

        <div style={{ display: "flex", marginTop: 8 }}>
          <span style={{ fontSize: 26, color: "#a3a3ab", maxWidth: 780 }}>
            Providers publish the benchmark. We publish what happened when
            someone actually tried it.
          </span>
        </div>

        <div style={{ display: "flex", marginTop: 56, gap: 12 }}>
          {DOTS.map((color) => (
            <div
              key={color}
              style={{ width: 14, height: 14, borderRadius: "50%", background: color }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
