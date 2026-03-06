"use client";

import type { BriefingData } from "@/lib/types";
import SeismographLine from "@/components/svg/SeismographLine";
import WorldMapOutline from "@/components/svg/WorldMapOutline";
import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";
import {
  formatEarthquake,
  getNoEarthquakeLine,
  formatAsteroid,
  formatISS,
} from "@/lib/copy";

interface ResultsPageProps {
  data: BriefingData;
  onShare: () => void;
}

/* ─── Scroll-reveal wrapper ─── */
function RevealSection({
  children,
  animation,
  className = "",
  style,
}: {
  children: React.ReactNode;
  animation: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useInView(0.12);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${animation} ${inView ? "in-view" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export default function ResultsPage({ data, onShare }: ResultsPageProps) {
  const formattedDate = new Date(data.date + "T12:00:00").toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const seed = data.date;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <RevealSection
        animation="reveal-scale-blur"
        className="rounded-xl py-12 px-8 -mx-6 text-center"
        style={{ backgroundColor: "var(--accent-light)" }}
      >
        <h1
          className="text-5xl md:text-5xl font-semibold mb-2"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--fg-heading)",
            fontSize: "clamp(2rem, 6vw, 3rem)",
          }}
        >
          {formattedDate}
        </h1>
        {data.label && (
          <p
            className="text-sm"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--fg-muted)",
            }}
          >
            {data.label}
          </p>
        )}
      </RevealSection>

      {/* Earth */}
      <RevealSection
        animation="reveal-slide-left"
        className="rounded-xl p-6 md:p-8"
        style={{
          background: "rgba(196, 67, 42, 0.04)",
          borderLeft: "3px solid var(--quake)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--quake)" }}
          />
          <span
            className="font-mono text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--fg-muted)" }}
          >
            THE EARTH
          </span>
        </div>

        {data.earthquake ? (
          <>
            <SeismographLine
              magnitude={data.earthquake.magnitude}
              animate={true}
            />
            <p
              className="mt-4"
              style={{
                fontSize: "1.25rem",
                lineHeight: 1.6,
                color: "var(--fg)",
              }}
            >
              {formatEarthquake(data.earthquake, seed)}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span
                className="font-mono text-xs px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--fg-muted)",
                }}
              >
                M{data.earthquake.magnitude.toFixed(1)}
              </span>
              <span
                className="font-mono text-xs px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--fg-muted)",
                }}
              >
                {data.earthquake.location}
              </span>
            </div>
          </>
        ) : (
          <p
            className="italic"
            style={{
              fontSize: "1.25rem",
              lineHeight: 1.6,
              color: "var(--fg)",
            }}
          >
            {getNoEarthquakeLine(seed)}
          </p>
        )}
      </RevealSection>

      {/* Space */}
      <RevealSection
        animation="reveal-slide-right"
        className="rounded-xl p-6 md:p-8"
        style={{
          background: "rgba(37, 99, 235, 0.04)",
          borderLeft: "3px solid var(--orbital)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--orbital)" }}
          />
          <span
            className="font-mono text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--fg-muted)" }}
          >
            BEYOND
          </span>
        </div>

        {data.iss && (
          <>
            <WorldMapOutline
              issLat={data.iss.latitude}
              issLon={data.iss.longitude}
              animate={true}
            />
            <p
              className="mt-4"
              style={{
                fontSize: "1.25rem",
                lineHeight: 1.6,
                color: "var(--fg)",
              }}
            >
              {formatISS(data.iss, data.crew, seed)}
            </p>
          </>
        )}

        {data.asteroid && (
          <p
            className="mt-4"
            style={{
              fontSize: "1.25rem",
              lineHeight: 1.6,
              color: "var(--fg)",
            }}
          >
            {formatAsteroid(data.asteroid, seed)}
          </p>
        )}

        {!data.iss && !data.asteroid && (
          <p
            className="italic"
            style={{
              fontSize: "1.25rem",
              lineHeight: 1.6,
              color: "var(--fg)",
            }}
          >
            No nearby asteroids or ISS data for this date.
          </p>
        )}

        {(data.iss || data.asteroid) && (
          <div className="flex flex-wrap gap-2 mt-4">
            <span
              className="font-mono text-xs px-3 py-1 rounded-full"
              style={{
                backgroundColor: "var(--bg-surface)",
                color: "var(--fg-muted)",
              }}
            >
              17,500 mph
            </span>
            {data.crew && (
              <span
                className="font-mono text-xs px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--fg-muted)",
                }}
              >
                Crew of {data.crew.crew_count}
              </span>
            )}
          </div>
        )}
      </RevealSection>

      {/* World */}
      <RevealSection
        animation="reveal-fade-up"
        className="rounded-xl p-6 md:p-8"
        style={{
          background: "rgba(124, 58, 237, 0.04)",
          borderLeft: "3px solid var(--timeline)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--timeline)" }}
          />
          <span
            className="font-mono text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--fg-muted)" }}
          >
            {data.wikipedia.length > 0 &&
            data.wikipedia[0].year === new Date(data.date + "T12:00:00").getFullYear()
              ? "THAT DAY"
              : "ALSO ON THIS DAY"}
          </span>
        </div>

        <div className="space-y-4">
          {data.wikipedia.slice(0, 3).map((event, i) => {
            const selectedYear = new Date(data.date + "T12:00:00").getFullYear();
            const isHistorical = event.year !== selectedYear;
            return (
              <p
                key={i}
                style={{
                  fontSize: "1.125rem",
                  lineHeight: 1.6,
                  color: "var(--fg)",
                }}
              >
                {isHistorical && (
                  <span
                    className="font-mono text-xs inline-flex items-center justify-center rounded-full px-2 py-0.5 mr-2 align-middle"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "#ffffff",
                    }}
                  >
                    {event.year}
                  </span>
                )}
                {event.text}
              </p>
            );
          })}
        </div>
      </RevealSection>

      {/* Numbers */}
      <NumbersSection
        birthsPerDay={data.demographics.births_per_day}
        deathsPerDay={data.demographics.deaths_per_day}
      />

      {/* Sun */}
      {data.sun && (
        <RevealSection
          animation="reveal-slide-left"
          className="rounded-xl p-6 md:p-8"
          style={{
            background: "rgba(234, 179, 8, 0.06)",
            borderLeft: "3px solid #D97706",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#D97706" }}
            />
            <span
              className="font-mono text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: "var(--fg-muted)" }}
            >
              THE SUN {data.sun?.location_name ? `\u2022 ${data.sun.location_name}` : ""}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div
                className="text-lg font-semibold"
                style={{ color: "#D97706" }}
              >
                {data.sun.sunrise}
              </div>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                Sunrise
              </p>
            </div>
            <div className="space-y-1">
              <div
                className="text-lg font-semibold"
                style={{ color: "#D97706" }}
              >
                {data.sun.day_length_formatted}
              </div>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                Daylight
              </p>
            </div>
            <div className="space-y-1">
              <div
                className="text-lg font-semibold"
                style={{ color: "#D97706" }}
              >
                {data.sun.sunset}
              </div>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                Sunset
              </p>
            </div>
          </div>
        </RevealSection>
      )}

      {/* Fun Facts */}
      {(data.number_fact || data.nasa_apod) && (
        <RevealSection
          animation="reveal-slide-right"
          className="rounded-xl p-6 md:p-8"
          style={{
            background: "rgba(196, 93, 32, 0.04)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
            />
            <span
              className="font-mono text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: "var(--fg-muted)" }}
            >
              FUN FACTS
            </span>
          </div>

          {data.number_fact && (
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="space-y-1">
                <div
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}
                >
                  {data.number_fact.day_of_year}
                </div>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Day {data.number_fact.day_of_year} of {data.number_fact.total_days}
                </p>
              </div>
              <div className="space-y-1">
                <div className="text-2xl">
                  {data.number_fact.moon_emoji}
                </div>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  {data.number_fact.moon_phase}
                </p>
              </div>
              <div className="space-y-1">
                <div
                  className="text-lg font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}
                >
                  {data.number_fact.zodiac}
                </div>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Zodiac
                </p>
              </div>
            </div>
          )}

          {data.nasa_apod && (
            <div
              className="rounded-lg overflow-hidden mt-2"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              {data.nasa_apod.url && (
                <a
                  href={data.nasa_apod.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.nasa_apod.url}
                    alt={data.nasa_apod.title}
                    className="w-full object-cover"
                    style={{ maxHeight: "200px" }}
                  />
                </a>
              )}
              <div className="p-4">
                <p
                  className="font-mono text-xs font-semibold uppercase tracking-[0.1em] mb-2"
                  style={{ color: "var(--fg-muted)" }}
                >
                  NASA&apos;s Photo of the Day
                </p>
                <p
                  className="text-base font-semibold"
                  style={{ color: "var(--fg-heading)" }}
                >
                  &ldquo;{data.nasa_apod.title}&rdquo;
                </p>
                {data.nasa_apod.url && (
                  <a
                    href={data.nasa_apod.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs font-medium underline underline-offset-2"
                    style={{ color: "var(--accent)" }}
                  >
                    View full image
                  </a>
                )}
              </div>
            </div>
          )}
        </RevealSection>
      )}

      {/* Closing */}
      <RevealSection animation="reveal-slow-fade" className="text-center py-16 space-y-8">
        <p
          className="text-2xl md:text-3xl italic"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--fg-heading)",
          }}
        >
          {data.closing_line.includes(". ") ? (
            <>
              {data.closing_line.split(". ")[0]}.
              <br />
              {data.closing_line.split(". ").slice(1).join(". ")}
            </>
          ) : (
            data.closing_line
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onShare}
            className="px-6 py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--accent)",
              color: "#ffffff",
            }}
          >
            Save your card
          </button>
          <button
            onClick={onShare}
            className="px-6 py-3 rounded-lg font-medium text-sm border transition-opacity hover:opacity-90"
            style={{
              borderColor: "var(--accent)",
              color: "var(--accent)",
              backgroundColor: "transparent",
            }}
          >
            Share
          </button>
        </div>

        <a
          href="/"
          className="inline-block text-sm underline underline-offset-4"
          style={{ color: "var(--fg-muted)" }}
        >
          Try another date
        </a>

        <p
          className="text-xs"
          style={{ color: "var(--fg-muted)", opacity: 0.7 }}
        >
          No account needed. Nothing is stored.
        </p>
      </RevealSection>
    </div>
  );
}

/* ─── Numbers sub-component (counter starts when scrolled into view) ─── */

function NumbersSection({
  birthsPerDay,
  deathsPerDay,
}: {
  birthsPerDay: number;
  deathsPerDay: number;
}) {
  const { ref, inView } = useInView(0.2);
  const births = useCountUp(birthsPerDay, 2000, inView);
  const deaths = useCountUp(deathsPerDay, 2000, inView);

  return (
    <div
      ref={ref}
      className={`scroll-reveal reveal-fade-up ${inView ? "in-view" : ""}`}
    >
      <section
        className="rounded-xl p-6 md:p-8"
        style={{
          background: "rgba(5, 150, 105, 0.04)",
          borderLeft: "3px solid var(--life)",
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--life)" }}
          />
          <span
            className="font-mono text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--fg-muted)" }}
          >
            THE NUMBERS
          </span>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2 text-center">
            <div
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--life)",
                fontSize: "clamp(2rem, 8vw, 3.5rem)",
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              {births.toLocaleString()}
            </div>
            <p
              className="text-sm"
              style={{ color: "var(--fg-muted)" }}
            >
              took their first breath
            </p>
          </div>
          <div className="space-y-2 text-center">
            <div
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--death)",
                fontSize: "clamp(2rem, 8vw, 3.5rem)",
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              {deaths.toLocaleString()}
            </div>
            <p
              className="text-sm"
              style={{ color: "var(--fg-muted)" }}
            >
              took their last
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
