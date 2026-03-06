import type {
  EarthquakeData,
  AsteroidData,
  ISSData,
  CrewData,
  WikipediaEvent,
} from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE ARRAYS
// ─────────────────────────────────────────────────────────────────────────────

const OPENING_LINES = [
  "Here's what was happening on {DATE}.",
  "The world was busy on {DATE}.",
  "A lot was going on that day.",
  "Here's what the world was up to on {DATE}.",
  "You picked an interesting day. Here's what happened.",
];

const EARTHQUAKE_FRAMES: Record<string, string[]> = {
  micro: [
    "A quiet {MAGNITUDE} tremor rippled near {LOCATION}. Barely enough to rattle a cup.",
    "The ground shifted near {LOCATION} — magnitude {MAGNITUDE}. The planet stretching in its sleep.",
  ],
  minor: [
    "A {MAGNITUDE} earthquake rolled through {LOCATION}. People paused, then went back to what they were doing.",
    "The ground shook near {LOCATION} — magnitude {MAGNITUDE}. Enough to notice, not enough to stop.",
  ],
  moderate: [
    "A {MAGNITUDE} earthquake shook {LOCATION}. Strong enough to wake people up.",
    "The ground broke open near {LOCATION} — magnitude {MAGNITUDE}. The kind that makes the news briefly.",
  ],
  strong: [
    "A significant {MAGNITUDE} earthquake struck {LOCATION}. The earth made its presence known.",
    "The ground shook hard in {LOCATION}. Magnitude {MAGNITUDE}. Some days ask more of the world than others.",
  ],
};

const NO_EARTHQUAKE_LINES = [
  "The Earth was quiet that day. Just for you.",
  "No significant earthquakes that day. The ground held still.",
  "The tectonic plates took the day off.",
];

const ASTEROID_FRAMES: Record<string, string[]> = {
  standard: [
    "Asteroid {NAME} passed Earth at {DISTANCE_COMPARISON} — about the size of {SIZE_COMPARISON}, moving at {SPEED_MPH} mph.",
    "A rock called {NAME}, roughly the size of {SIZE_COMPARISON}, cleared Earth at {DISTANCE_COMPARISON}. The solar system has its own traffic.",
  ],
  close: [
    "Asteroid {NAME} passed closer than you might expect — {DISTANCE_COMPARISON}, about the size of {SIZE_COMPARISON}, moving at {SPEED_MPH} mph.",
    "{NAME} came in {DISTANCE_COMPARISON}. Close in cosmic terms. About the size of {SIZE_COMPARISON}.",
  ],
  very_close: [
    "{NAME} — about the size of {SIZE_COMPARISON}, moving at {SPEED_MPH} mph — passed {DISTANCE_COMPARISON} of Earth. Closer than you'd like to know.",
    "A rock called {NAME}, about the size of {SIZE_COMPARISON}, threaded the needle — {DISTANCE_COMPARISON}.",
  ],
};

const ISS_FRAMES = [
  "The ISS was flying over {LOCATION_NAME} at 17,500 mph, 254 miles up. Crew of {CREW_COUNT}.",
  "The International Space Station was above {LOCATION_NAME} — {CREW_COUNT} humans in a pressurized can, orbiting every 92 minutes.",
  "{CREW_COUNT} astronauts were hurtling over {LOCATION_NAME} at 17,500 mph. They'd circle the planet 15 times that day.",
];

const CLOSING_LINES = [
  "The world was busy. So were you.",
  "A lot can happen in a day.",
  "That's your day. The world remembers.",
  "Everything kept going. It always does.",
  "One day. A whole world of things happening at once.",
  "The world had its agenda. Now you know what it was.",
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

export function pickTemplate<T>(arr: T[], seed: string): T {
  const index = Math.floor(seededRandom(seed) * arr.length);
  return arr[index];
}

function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getEarthquakeTier(
  magnitude: number
): "micro" | "minor" | "moderate" | "strong" {
  if (magnitude < 3.0) return "micro";
  if (magnitude < 5.0) return "minor";
  if (magnitude < 6.0) return "moderate";
  return "strong";
}

export function getAsteroidTier(
  missMiles: number
): "standard" | "close" | "very_close" {
  if (missMiles < 1_000_000) return "very_close";
  if (missMiles <= 5_000_000) return "close";
  return "standard";
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function formatEarthquake(data: EarthquakeData, seed: string): string {
  const tier = getEarthquakeTier(data.magnitude);
  const templates = EARTHQUAKE_FRAMES[tier];
  const template = pickTemplate(templates, seed + ":eq");
  return interpolate(template, {
    MAGNITUDE: data.magnitude.toFixed(1),
    LOCATION: data.location,
    DISTANCE_DESCRIPTION: data.distance_description,
  });
}

export function getNoEarthquakeLine(seed: string): string {
  return pickTemplate(NO_EARTHQUAKE_LINES, seed + ":noeq");
}

export function formatAsteroid(data: AsteroidData, seed: string): string {
  const template = pickTemplate(
    ASTEROID_FRAMES["standard"],
    seed + ":ast"
  );
  return interpolate(template, {
    NAME: data.name,
    SIZE_COMPARISON: data.size_comparison,
    SPEED_MPH: data.speed_mph,
    DISTANCE_COMPARISON: data.distance_comparison,
  });
}

export function formatISS(
  data: ISSData,
  crew: CrewData | null,
  seed: string
): string {
  const template = pickTemplate(ISS_FRAMES, seed + ":iss");
  return interpolate(template, {
    LOCATION_NAME: data.location_name,
    LAT: data.latitude.toFixed(2),
    LONG: data.longitude.toFixed(2),
    CREW_COUNT: crew ? crew.crew_count : 6,
  });
}

export function formatHeadline(
  event: WikipediaEvent,
  dateFormatted: string,
  seed: string
): string {
  return `Also on this day in ${event.year}: ${event.text}`;
}

export function getOpeningLine(dateFormatted: string, seed: string): string {
  const template = pickTemplate(OPENING_LINES, seed + ":op");
  return interpolate(template, { DATE: dateFormatted });
}

export function getClosingLine(seed: string): string {
  return pickTemplate(CLOSING_LINES, seed + ":cl");
}

export function getMeanwhileLine(seed: string): string {
  return getOpeningLine("that day", seed);
}

export function getPerspectiveLine(
  data: {
    issOrbits?: number;
    earthquakeCount?: number;
    asteroidName?: string;
    asteroidMissMiles?: string;
  },
  seed: string
): string {
  return pickTemplate(CLOSING_LINES, seed + ":pl");
}
