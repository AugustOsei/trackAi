import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home-screen icon. Apple applies its own corner rounding, so this ships
 * as a full square rather than pre-rounding it — a squircle mask over an
 * already-rounded shape reads as two different curves stacked.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#f5c518",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
