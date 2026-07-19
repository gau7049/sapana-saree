import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/constants";

// ImageResponse (Satori) requires the edge runtime, not Node.
export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? SITE_NAME;
  const description = searchParams.get("description") ?? "Exquisite Indian Sarees";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #1a1a2e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #16213e 0%, transparent 50%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 80px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              marginBottom: 16,
              letterSpacing: "0.1em",
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#fafafa",
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              marginTop: 20,
              maxWidth: 700,
            }}
          >
            {description}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
