import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import type { BriefingData } from "@/lib/types";

export const runtime = "edge";

// In-memory store for briefing data (used for card generation)
const briefingStore = new Map<string, BriefingData>();

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).replace(/\s+\S*$/, "") + "...";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  try {
    const data: BriefingData = await request.json();
    briefingStore.set(hash, data);

    const formattedDate = new Date(data.date + "T12:00:00").toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );

    // Build fact lines with category colors
    const facts: { text: string; color: string }[] = [];
    if (data.earthquake) {
      facts.push({
        text: `A ${data.earthquake.magnitude} earthquake shook ${data.earthquake.location}`,
        color: "#C4432A",
      });
    }
    if (data.asteroid) {
      facts.push({
        text: `Asteroid ${data.asteroid.name} passed at ${data.asteroid.distance_comparison}`,
        color: "#2563EB",
      });
    }
    if (data.iss) {
      facts.push({
        text: `The ISS flew over ${data.iss.location_name}`,
        color: "#2563EB",
      });
    }
    if (data.sun) {
      facts.push({
        text: `${data.sun.location_name}: sunrise ${data.sun.sunrise}, sunset ${data.sun.sunset} — ${data.sun.day_length_formatted} of light`,
        color: "#D97706",
      });
    }
    if (data.demographics) {
      facts.push({
        text: `${data.demographics.births_per_day.toLocaleString()} took their first breath`,
        color: "#059669",
      });
    }

    // Add number facts (moon phase + zodiac)
    if (data.number_fact) {
      facts.push({
        text: `${data.number_fact.moon_phase} \u2022 ${data.number_fact.zodiac} \u2022 Day ${data.number_fact.day_of_year} of ${data.number_fact.total_days}`,
        color: "#C45D20",
      });
    }

    // Fill remaining space with wikipedia events
    const selectedYear = new Date(data.date + "T12:00:00").getFullYear();
    for (const evt of data.wikipedia) {
      if (facts.length >= 7) break;
      const prefix = evt.year !== selectedYear ? `In ${evt.year}, on this day: ` : "";
      facts.push({
        text: prefix + truncate(evt.text, 200),
        color: "#7C3AED",
      });
    }

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            backgroundColor: "#0F1720",
            color: "#F8FAFC",
            display: "flex",
            flexDirection: "column",
            padding: "100px 90px",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Top gradient accent bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "6px",
              display: "flex",
              background: "linear-gradient(90deg, #C45D20, #D97706, #C45D20)",
            }}
          />

          {/* Brand header */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "18px",
                fontFamily: "monospace",
                letterSpacing: "0.3em",
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
                color: "#F8FAFC",
                lineHeight: 1.0,
              }}
            >
              DAY
              <span style={{ color: "#C45D20" }}>.</span>
            </span>
          </div>

          {/* Accent divider */}
          <div
            style={{
              width: "80px",
              height: "3px",
              backgroundColor: "#C45D20",
              marginTop: "48px",
              borderRadius: "2px",
            }}
          />

          {/* Date + label */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "48px",
            }}
          >
            <span
              style={{
                fontSize: "72px",
                fontWeight: 700,
                color: "#F8FAFC",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {formattedDate}
            </span>
            {data.label && (
              <span
                style={{
                  fontSize: "30px",
                  fontStyle: "italic",
                  color: "#C45D20",
                  marginTop: "16px",
                  opacity: 0.9,
                }}
              >
                {data.label}
              </span>
            )}
          </div>

          {/* Thin divider */}
          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(248, 250, 252, 0.08)",
              marginTop: "48px",
            }}
          />

          {/* Facts */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "28px",
              marginTop: "48px",
            }}
          >
            {facts.map((fact, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "40px",
                    backgroundColor: fact.color,
                    borderRadius: "2px",
                    marginTop: "6px",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "30px",
                    lineHeight: 1.5,
                    color: "#E2E8F0",
                  }}
                >
                  {fact.text}
                </span>
              </div>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1, display: "flex" }} />

          {/* Thin divider */}
          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(248, 250, 252, 0.12)",
            }}
          />

          {/* Closing quote */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "48px",
            }}
          >
            <span
              style={{
                fontSize: "38px",
                fontStyle: "italic",
                color: "#F8FAFC",
                lineHeight: 1.4,
                textAlign: "center",
                opacity: 0.9,
              }}
            >
              {"\u201C"}
              {data.closing_line}
              {"\u201D"}
            </span>
          </div>

          {/* Decorative accent bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "48px",
            }}
          >
            <div
              style={{
                width: "160px",
                height: "2px",
                backgroundColor: "#C45D20",
                opacity: 0.3,
                borderRadius: "1px",
              }}
            />
          </div>

          {/* Domain */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "36px",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontFamily: "monospace",
                letterSpacing: "0.15em",
                color: "#C45D20",
                opacity: 0.5,
              }}
            >
              on-this-day.nodesparks.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
      }
    );

    return new NextResponse(imageResponse.body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Card generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate card" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const data = briefingStore.get(hash);

  if (!data) {
    return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
