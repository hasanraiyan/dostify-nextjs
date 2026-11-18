"use client";

import { MapPinIcon } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { browserPosition } from "./tool-widgets";

/**
 * `get_location` frontend tool: asks the browser for the user's location
 * (the browser shows its own permission prompt), looks up a place name, and
 * returns it to the agent as context. The chat shows it on a map.
 */

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  /** Best-effort place name, e.g. "Kankarbagh, Patna, Bihar, India". */
  place?: string;
}

/** Best-effort reverse geocoding via OpenStreetMap Nominatim; never throws. */
async function lookupPlace(lat: number, lon: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&lat=${lat}&lon=${lon}`,
      { signal: AbortSignal.timeout(6_000), headers: { Accept: "application/json" } },
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name;
  } catch {
    return undefined;
  }
}

export async function fetchLocation(): Promise<LocationResult> {
  const pos = await browserPosition();
  const place = await lookupPlace(pos.latitude, pos.longitude);
  return { ...pos, place };
}

function mapUrl({ latitude, longitude }: LocationResult) {
  // Zoom is set by the bounding box (~1.5 km across).
  const d = 0.007;
  const bbox = [longitude - d, latitude - d, longitude + d, latitude + d].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
}

export function LocationCard({
  status,
  result,
  isError,
}: {
  status: "inProgress" | "executing" | "complete";
  result?: string;
  isError: boolean;
}) {
  if (status !== "complete") {
    return (
      <Card size="sm" className="w-full max-w-sm">
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <MapPinIcon className="size-4 animate-pulse" />
          Allow location access in your browser…
        </CardContent>
      </Card>
    );
  }

  let loc: LocationResult | null = null;
  if (!isError && result) {
    try {
      const parsed = JSON.parse(result) as LocationResult;
      if (Number.isFinite(parsed.latitude) && Number.isFinite(parsed.longitude)) loc = parsed;
    } catch {
      loc = null;
    }
  }
  if (!loc) {
    return (
      <Card size="sm" className="w-full max-w-sm">
        <CardContent className="text-muted-foreground">
          Couldn&apos;t get your location. Check that location is allowed for this site.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MapPinIcon weight="fill" className="size-4 text-primary" />
          Your location
        </CardTitle>
        {loc.place && <CardDescription>{loc.place}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <iframe
          title="Map of your location"
          src={mapUrl(loc)}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-48 w-full rounded-xl border-0"
        />
        <a
          href={`https://www.openstreetmap.org/?mlat=${loc.latitude}&mlon=${loc.longitude}#map=16/${loc.latitude}/${loc.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          Open in OpenStreetMap · accurate to about {loc.accuracyMeters} m
        </a>
      </CardContent>
    </Card>
  );
}
