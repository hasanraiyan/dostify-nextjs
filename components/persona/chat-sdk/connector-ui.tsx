"use client";

import * as React from "react";
import { ArrowsClockwiseIcon, PlugsIcon } from "@phosphor-icons/react";
import type { PersonaMcpConnection } from "@personaai/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** How a connector is shown: our own name, description and icon over Persona's raw data. */
export type ConnectorDisplay = { name: string; description: string; icon?: string };

/** Square logo for a connector; falls back to its first letter if there is no icon or it fails to load. */
export function ConnectorTile({
  name,
  icon,
  className,
}: {
  name: string;
  icon?: string;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const [broken, setBroken] = React.useState(false);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 text-xs font-semibold text-muted-foreground",
        className
      )}
    >
      {icon && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
      ) : (
        initial
      )}
    </span>
  );
}

/**
 * Connect / Reconnect pill. Connecting is a full-page redirect, so it shows
 * progress until the browser leaves.
 */
export function ConnectButton({
  connection,
  onConnect,
  className,
}: {
  connection: PersonaMcpConnection;
  onConnect: (connection: PersonaMcpConnection) => void;
  className?: string;
}) {
  const [connecting, setConnecting] = React.useState(false);
  const needsReconnect = connection.status === "needs_auth" || connection.status === "expired";

  // Coming back with the Back button restores this page from the browser's
  // cache, "Connecting…" included, so clear it then.
  React.useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) setConnecting(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <Button
      type="button"
      className={cn("h-8 rounded-full px-4", className)}
      disabled={!connection.authorizeUrl || connecting}
      onClick={() => {
        setConnecting(true);
        onConnect(connection);
      }}
    >
      {connecting ? <Spinner className="size-3.5" /> : needsReconnect ? <ArrowsClockwiseIcon /> : <PlugsIcon />}
      {connecting ? "Connecting…" : needsReconnect ? "Reconnect" : "Connect"}
    </Button>
  );
}
