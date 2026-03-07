import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash: _hash } = await params;

  try {
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            backgroundColor: "#FAFAF7",
            color: "#1A2332",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Brand header */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontFamily: "monospace",
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "#C45D20",
              }}
            >
              ON THIS
            </span>
            <span
              style={{
                fontSize: "64px",
                fontWeight: 700,
                color: "#0F1720",
                lineHeight: 1.1,
              }}
            >
              DAY
              <span style={{ color: "#C45D20" }}>.</span>
            </span>
          </div>

          {/* Tagline */}
          <span
            style={{
              fontSize: "24px",
              color: "#6B7280",
              textAlign: "center",
              maxWidth: "700px",
              marginTop: "24px",
            }}
          >
            Enter a date. See what the world was doing.
          </span>

          {/* Accent divider */}
          <div
            style={{
              width: "48px",
              height: "3px",
              backgroundColor: "#C45D20",
              marginTop: "32px",
              borderRadius: "2px",
            }}
          />

          {/* EXPLORE button */}
          <span
            style={{
              fontSize: "16px",
              color: "#ffffff",
              backgroundColor: "#C45D20",
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              marginTop: "36px",
              padding: "14px 36px",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            EXPLORE
          </span>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    return new NextResponse(imageResponse.body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("OG image error:", error);
    return NextResponse.json(
      { error: "Failed to generate OG image" },
      { status: 500 }
    );
  }
}
