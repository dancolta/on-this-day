import { NextRequest, NextResponse } from "next/server";
import type { BriefingRequest, BriefingData, DatePrecision } from "@/lib/types";
import { sanitizeDecision, sanitizeReason, stripHtml } from "@/lib/sanitize";
import { fetchWikipediaEvents } from "@/lib/apis/wikipedia";
import { fetchEarthquake } from "@/lib/apis/earthquake";
import { fetchAsteroid } from "@/lib/apis/asteroid";
import { fetchISS } from "@/lib/apis/iss";
import { fetchSunData } from "@/lib/apis/sun";
import { fetchNumberFact } from "@/lib/apis/numberfact";
import { fetchNasaApod } from "@/lib/apis/nasa";
import { getCrewForDate } from "@/lib/crew-data";
import { getDemographics } from "@/lib/demographics";
import {
  getMeanwhileLine,
  getClosingLine,
  getPerspectiveLine,
  seededRandom,
} from "@/lib/copy";

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting
// ─────────────────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
let requestCounter = 0;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  requestCounter++;

  // Clean up every 100 requests
  if (requestCounter % 100 === 0) {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function computeBriefingNumber(date: string, extra: string): number {
  const input = `${date}:${extra}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash % 900000) + 100000;
}

function isValidPrecision(p: unknown): p is DatePrecision {
  return p === "exact" || p === "month" || p === "year";
}

function sanitizeLabel(text: string): string {
  return stripHtml(text).trim().slice(0, 50);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: BriefingRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // Validate
  const { date, precision, decision, label, reason } = body;
  // Optional geolocation (not in BriefingRequest type, extracted separately)
  const raw = body as unknown as Record<string, unknown>;
  const latitude = typeof raw.latitude === "number" ? raw.latitude : undefined;
  const longitude = typeof raw.longitude === "number" ? raw.longitude : undefined;
  const timezone = typeof raw.timezone === "string" ? raw.timezone : undefined;

  if (!date) {
    return NextResponse.json(
      { error: "Date is required." },
      { status: 400 }
    );
  }

  if (!isValidPrecision(precision)) {
    return NextResponse.json(
      { error: "Precision must be 'exact', 'month', or 'year'." },
      { status: 400 }
    );
  }

  const parsedDate = new Date(date + "T12:00:00Z");
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const now = new Date();
  // Compare date-only (ignore time) to avoid timezone edge cases
  const parsedDay = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (parsedDay > today) {
    return NextResponse.json(
      { error: "Date cannot be in the future." },
      { status: 400 }
    );
  }

  if (parsedDate.getFullYear() < 1950) {
    return NextResponse.json(
      { error: "Date must be after 1950." },
      { status: 400 }
    );
  }

  // Sanitize
  const cleanDecision = decision ? sanitizeDecision(decision) : undefined;
  const cleanLabel = label ? sanitizeLabel(label) : undefined;
  const cleanReason = reason ? sanitizeReason(reason) : undefined;

  // Extract date parts
  const month = parsedDate.getUTCMonth() + 1;
  const day = parsedDate.getUTCDate();
  const year = parsedDate.getUTCFullYear();
  const dateStr = date;

  // Fetch all APIs in parallel
  const [wikiResult, earthquakeResult, asteroidResult, issResult, sunResult, numberFactResult, nasaApodResult] =
    await Promise.allSettled([
      fetchWikipediaEvents(month, day, year),
      fetchEarthquake(dateStr),
      fetchAsteroid(dateStr),
      fetchISS(),
      fetchSunData(dateStr, latitude, longitude, timezone),
      fetchNumberFact(dateStr),
      fetchNasaApod(dateStr),
    ]);

  const wikipedia =
    wikiResult.status === "fulfilled" ? wikiResult.value : [];
  const earthquake =
    earthquakeResult.status === "fulfilled"
      ? earthquakeResult.value
      : null;
  const asteroid =
    asteroidResult.status === "fulfilled" ? asteroidResult.value : null;
  const iss = issResult.status === "fulfilled" ? issResult.value : null;
  const sun = sunResult.status === "fulfilled" ? sunResult.value : null;
  const number_fact =
    numberFactResult.status === "fulfilled" ? numberFactResult.value : null;
  const nasa_apod =
    nasaApodResult.status === "fulfilled" ? nasaApodResult.value : null;

  // Crew and demographics
  const crew = getCrewForDate(dateStr);
  const demographics = getDemographics(dateStr);

  // Generate copy
  const seed = dateStr;
  const meanwhile_line = getMeanwhileLine(seed);
  const closing_line = getClosingLine(seed);

  const perspective_line = getPerspectiveLine(
    {
      issOrbits: 15,
      earthquakeCount: earthquake ? Math.round(earthquake.magnitude * 3) : 17,
      asteroidName: asteroid?.name,
      asteroidMissMiles: asteroid?.distance_comparison,
    },
    seed
  );

  const briefing_number = computeBriefingNumber(dateStr, cleanDecision || cleanLabel || "");

  const briefingData: BriefingData = {
    date: dateStr,
    precision,
    decision: cleanDecision,
    label: cleanLabel,
    reason: cleanReason,
    wikipedia,
    earthquake,
    asteroid,
    iss,
    crew,
    demographics,
    sun,
    number_fact,
    nasa_apod,
    closing_line,
    meanwhile_line,
    perspective_line,
    briefing_number,
  };

  return NextResponse.json(briefingData);
}
