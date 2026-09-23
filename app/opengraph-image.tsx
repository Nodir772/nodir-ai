import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #050816 0%, #121c34 52%, #1a1440 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #4f7cff 0%, #8b5cf6 100%)",
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          N
        </div>
        <div style={{ marginTop: 28, fontSize: 64, fontWeight: 700 }}>Nodir AI</div>
        <div style={{ marginTop: 16, fontSize: 28, color: "#93a0bf", maxWidth: 820 }}>
          AI assistant for chat, coding, writing, documents and more.
        </div>
      </div>
    ),
    size,
  );
}
