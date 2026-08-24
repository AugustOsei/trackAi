import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * The browser-tab icon: the same gold dot that follows "trackai" in the
 * header, at a scale where a wordmark would be illegible anyway. Replaces
 * Next's default favicon, which was still the framework placeholder.
 */
export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div
          style={{
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: "#f5c518",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
