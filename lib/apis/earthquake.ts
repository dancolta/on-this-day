import type { EarthquakeData } from "@/lib/types";
import * as cache from "@/lib/cache";

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
  };
}

interface USGSResponse {
  features: USGSFeature[];
}

/**
 * Parse USGS place string like "122 km WSW of Merizo Village, Guam"
 * into a clean location name and a distance description.
 */
function parsePlace(place: string): { location: string; distance: string } {
  // Pattern: "XXX km DIR of Location Name"
  const match = place.match(/^(\d+\s*km\s+\w+\s+of\s+)(.+)$/i);
  if (match) {
    return {
      location: match[2].trim(),
      distance: place,
    };
  }
  // Some USGS entries are just region names like "South Sandwich Islands region"
  return { location: place, distance: place };
}

export async function fetchEarthquake(
  dateStr: string
): Promise<EarthquakeData | null> {
  const cacheKey = `usgs:${dateStr}`;
  const cached = cache.get<EarthquakeData | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const startDate = dateStr;
    const nextDay = new Date(dateStr + "T00:00:00Z");
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const endDate = nextDay.toISOString().split("T")[0];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // Use minmagnitude=5.0 for more notable events; fall back to 4.5 if empty
    let url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&endtime=${endDate}&minmagnitude=5.0&limit=5&orderby=magnitude`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    let data: USGSResponse = await res.json();

    // If no M5.0+ found, try M4.5+
    if (!data.features || data.features.length === 0) {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 5000);
      url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&endtime=${endDate}&minmagnitude=4.5&limit=5&orderby=magnitude`;
      const res2 = await fetch(url, { signal: controller2.signal });
      clearTimeout(timeout2);
      if (!res2.ok) return null;
      data = await res2.json();
    }

    if (!data.features || data.features.length === 0) {
      cache.set(cacheKey, null, 5 * 60 * 1000);
      return null;
    }

    // Verify the event time falls within the requested date (UTC)
    const dayStart = new Date(dateStr + "T00:00:00Z").getTime();
    const dayEnd = new Date(endDate + "T00:00:00Z").getTime();

    const validFeature = data.features.find((f) => {
      const t = f.properties.time;
      return t >= dayStart && t < dayEnd;
    });

    if (!validFeature) {
      cache.set(cacheKey, null, 5 * 60 * 1000);
      return null;
    }

    const { location, distance } = parsePlace(
      validFeature.properties.place || "Unknown location"
    );

    const result: EarthquakeData = {
      magnitude: validFeature.properties.mag,
      location,
      distance_description: distance,
    };

    cache.set(cacheKey, result, 24 * 60 * 60 * 1000);
    return result;
  } catch {
    return null;
  }
}
