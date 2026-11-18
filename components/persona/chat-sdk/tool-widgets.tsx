"use client";

import * as React from "react";
import {
  ArrowCounterClockwiseIcon,
  ClockIcon,
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  DropIcon,
  MapPinIcon,
  PauseIcon,
  PlayIcon,
  SunIcon,
  TimerIcon,
  WindIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Widgets rendered by the frontend tools in frontend-tools.tsx — weather,
 * world clock and countdown timer — plus the weather data fetcher.
 */

// ── Weather (Open-Meteo: free, no API key, CORS-enabled) ────────────────────

export interface WeatherReport {
  place: string;
  current: {
    temperatureC: number;
    feelsLikeC: number;
    humidity: number;
    windKmh: number;
    condition: string;
    code: number;
  };
  daily: { date: string; minC: number; maxC: number; condition: string; code: number }[];
}

// WMO weather interpretation codes (Open-Meteo docs).
function describeWeather(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snow";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
}

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  const Icon =
    code === 0
      ? SunIcon
      : code <= 2
        ? CloudSunIcon
        : code === 3
          ? CloudIcon
          : code === 45 || code === 48
            ? CloudFogIcon
            : (code >= 71 && code <= 77) || code === 85 || code === 86
              ? CloudSnowIcon
              : code >= 95
                ? CloudLightningIcon
                : CloudRainIcon;
  return <Icon weight="duotone" className={className} />;
}

const NETWORK_TIMEOUT_MS = 10_000;
/** Hard cap on the whole location lookup, including the permission prompt. */
const LOCATION_TIMEOUT_MS = 20_000;

async function getJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS) });
  } catch {
    throw new Error("The weather service didn't respond in time. Try again in a moment.");
  }
  if (!res.ok) throw new Error(`Weather service error (${res.status}).`);
  return res.json();
}

export interface BrowserPosition {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

/**
 * The browser's location. `getCurrentPosition`'s own `timeout` only starts
 * once the user has answered the permission prompt, so an ignored or hidden
 * prompt would wait forever. The outer timer bounds the whole thing.
 */
export function browserPosition(): Promise<BrowserPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This browser can't share its location — ask the user for a city."));
      return;
    }
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            "No location was shared (the permission prompt wasn't answered) — ask the user for a city instead.",
          ),
        ),
      LOCATION_TIMEOUT_MS,
    );
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy),
        });
      },
      () => {
        clearTimeout(timer);
        reject(new Error("The user didn't share their location — ask them for a city."));
      },
      { timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  });
}

/** Weather for `city`, or for the browser's location when no city is given. */
export async function fetchWeather(city?: string): Promise<WeatherReport> {
  let latitude: number;
  let longitude: number;
  let place: string;

  const name = city?.trim();
  if (name) {
    const geo = (await getJson(
      `https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=${encodeURIComponent(name)}`,
    )) as { results?: { latitude: number; longitude: number; name: string; admin1?: string; country?: string }[] };
    const hit = geo.results?.[0];
    if (!hit) throw new Error(`Couldn't find a place called "${name}".`);
    ({ latitude, longitude } = hit);
    place = [hit.name, hit.admin1, hit.country].filter(Boolean).join(", ");
  } else {
    ({ latitude, longitude } = await browserPosition());
    place = "Your location";
  }

  const data = (await getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto",
  )) as {
    current: {
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      weather_code: number;
    };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };

  const round = (n: number) => Math.round(n);
  return {
    place,
    current: {
      temperatureC: round(data.current.temperature_2m),
      feelsLikeC: round(data.current.apparent_temperature),
      humidity: round(data.current.relative_humidity_2m),
      windKmh: round(data.current.wind_speed_10m),
      condition: describeWeather(data.current.weather_code),
      code: data.current.weather_code,
    },
    daily: data.daily.time.map((date, i) => ({
      date,
      minC: round(data.daily.temperature_2m_min[i]),
      maxC: round(data.daily.temperature_2m_max[i]),
      condition: describeWeather(data.daily.weather_code[i]),
      code: data.daily.weather_code[i],
    })),
  };
}

function dayName(date: string, index: number): string {
  if (index === 0) return "Today";
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}

export function WeatherCard({
  city,
  status,
  result,
  isError,
}: {
  city?: string;
  status: "inProgress" | "executing" | "complete";
  result?: string;
  isError: boolean;
}) {
  if (status !== "complete") {
    return (
      <Card size="sm" className="w-full max-w-sm">
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <CloudSunIcon className="size-4 animate-pulse" />
          Checking the weather{city ? ` in ${city}` : ""}…
        </CardContent>
      </Card>
    );
  }

  let report: WeatherReport | null = null;
  if (!isError && result) {
    try {
      report = JSON.parse(result) as WeatherReport;
    } catch {
      report = null;
    }
  }
  if (!report?.current) {
    return (
      <Card size="sm" className="w-full max-w-sm">
        <CardContent className="text-muted-foreground">Couldn&apos;t load the weather.</CardContent>
      </Card>
    );
  }

  const { current, daily, place } = report;
  return (
    <Card size="sm" className="w-full max-w-sm">
      <CardHeader>
        <CardDescription className="flex items-center gap-1">
          <MapPinIcon className="size-3.5" />
          {place}
        </CardDescription>
        <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
          <WeatherIcon code={current.code} className="size-9 text-primary" />
          {current.temperatureC}°C
          <span className="text-xs font-normal text-muted-foreground">{current.condition}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-4 text-muted-foreground">
          <span>Feels {current.feelsLikeC}°</span>
          <span className="flex items-center gap-1">
            <DropIcon className="size-3.5" />
            {current.humidity}%
          </span>
          <span className="flex items-center gap-1">
            <WindIcon className="size-3.5" />
            {current.windKmh} km/h
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          {daily.map((d, i) => (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <span className="text-muted-foreground">{dayName(d.date, i)}</span>
              <WeatherIcon code={d.code} className="size-5" />
              <span>
                {d.maxC}° <span className="text-muted-foreground">{d.minC}°</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── World clock ─────────────────────────────────────────────────────────────

export interface ClockZone {
  timeZone: string;
  label?: string;
}

const isValidTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

function useNow(intervalMs: number): Date {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function WorldClock({ zones }: { zones?: Partial<ClockZone>[] }) {
  const now = useNow(1000);
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const list = (zones?.length ? zones : [{ timeZone: localZone, label: "Local" }])
    .filter((z): z is ClockZone => typeof z?.timeZone === "string" && isValidTimeZone(z.timeZone))
    .slice(0, 6);

  return (
    <Card size="sm" className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <ClockIcon className="size-4" />
          World clock
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((z) => (
          <div key={z.timeZone} className="flex flex-col">
            <span className="truncate text-muted-foreground">
              {z.label || z.timeZone.split("/").pop()?.replace(/_/g, " ")}
            </span>
            <span className="font-mono text-lg tabular-nums">
              {now.toLocaleTimeString(undefined, {
                timeZone: z.timeZone,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {now.toLocaleDateString(undefined, { timeZone: z.timeZone, weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
        ))}
        {list.length === 0 && <span className="text-muted-foreground">No valid time zones.</span>}
      </CardContent>
    </Card>
  );
}

// ── Countdown timer ─────────────────────────────────────────────────────────

const MAX_TIMER_SECONDS = 24 * 60 * 60;

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function CountdownTimer({ seconds, label }: { seconds?: number; label?: string }) {
  const total = Math.min(MAX_TIMER_SECONDS, Math.max(1, Math.round(Number(seconds) || 0)));
  // Remaining time is derived from an end timestamp, so it stays correct even
  // when the tab is throttled in the background.
  const [endsAt, setEndsAt] = React.useState<number | null>(() => Date.now() + total * 1000);
  const [pausedLeft, setPausedLeft] = React.useState<number | null>(null);
  const now = useNow(250);

  const left = pausedLeft ?? (endsAt ? (endsAt - now.getTime()) / 1000 : 0);
  const done = pausedLeft === null && left <= 0;
  const progress = Math.min(1, Math.max(0, 1 - left / total));

  return (
    <Card size="sm" className="w-full max-w-xs">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <TimerIcon className="size-4" />
          {label || "Timer"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <span className={`font-mono text-3xl tabular-nums ${done ? "text-primary" : ""}`}>
          {done ? "Time's up!" : formatDuration(left)}
        </span>
        <div className="h-1 w-full bg-muted">
          <div className="h-1 bg-primary transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex gap-2">
          {!done &&
            (pausedLeft === null ? (
              <Button size="sm" variant="outline" onClick={() => setPausedLeft(Math.max(0, left))}>
                <PauseIcon /> Pause
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEndsAt(Date.now() + pausedLeft * 1000);
                  setPausedLeft(null);
                }}
              >
                <PlayIcon /> Resume
              </Button>
            ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setPausedLeft(null);
              setEndsAt(Date.now() + total * 1000);
            }}
          >
            <ArrowCounterClockwiseIcon /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { MAX_TIMER_SECONDS };
