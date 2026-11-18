"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { useComponent, useFrontendTool, useHumanInTheLoop } from "@personaai/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  CountdownTimer,
  MAX_TIMER_SECONDS,
  WeatherCard,
  WorldClock,
  fetchWeather,
  type ClockZone,
} from "./tool-widgets";
import { HelplineCard } from "./dostify-widgets";
import { LocationCard, fetchLocation } from "./location-tool";

/**
 * Frontend tools: tools that run in the user's browser, which the agent can
 * call like any other tool (@personaai/react ≥ 0.21). Mount once under
 * <PersonaProvider>. The agent only sees them when its **Frontend Tools**
 * setting is on (platform → Agent → Frontend Tools); otherwise they're
 * ignored and nothing changes.
 *
 * Calls render in the transcript through ToolCallTrace's useRenderToolCall().
 */

// ── navigate_to: a fixed allowlist, never a URL from the model ──────────────
// router.push must not get untrusted URLs (a `javascript:` URL would run in
// the page — see Next's useRouter docs), and tool arguments are untrusted.
const PAGES = {
  new_chat: { path: "/", label: "a new chat" },
  assistant: { path: "/assistant", label: "the assistant showcase" },
  journal: { path: "/journal", label: "the journal" },
  profile: { path: "/profile", label: "the profile" },
} as const;
type PageKey = keyof typeof PAGES;

type Theme = "light" | "dark";
const currentTheme = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

// ── show_chart ──────────────────────────────────────────────────────────────
const MAX_CHART_POINTS = 50;

interface ChartArgs {
  title: string;
  kind: "bar" | "line";
  valueLabel?: string;
  data: { label: string; value: number }[];
}

const chartConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

function ToolChart({ title, kind, valueLabel, data }: Partial<ChartArgs>) {
  // Arguments stream in while the model writes them: render what's there,
  // skipping incomplete points.
  const points = (data ?? [])
    .filter((d) => d && typeof d.label === "string" && Number.isFinite(d.value))
    .slice(0, MAX_CHART_POINTS);
  const config = { value: { ...chartConfig.value, label: valueLabel || "Value" } };

  return (
    <Card size="sm" className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{title || "Chart"}</CardTitle>
        {valueLabel && <CardDescription>{valueLabel}</CardDescription>}
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <p className="text-xs text-muted-foreground">Preparing chart…</p>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            {kind === "line" ? (
              <LineChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <BarChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" />
              </BarChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ── confirm_action ──────────────────────────────────────────────────────────
interface ConfirmArgs {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

function ConfirmCard({
  args,
  status,
  result,
  respond,
}: {
  args: Partial<ConfirmArgs>;
  status: "inProgress" | "executing" | "complete";
  result?: string;
  respond?: (value: unknown) => void;
}) {
  const answered = status === "complete";
  const confirmed = answered && !!result && /"confirmed"\s*:\s*true/.test(result);

  return (
    <Card size="sm" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{args.title || "Please confirm"}</CardTitle>
        {args.description && <CardDescription>{args.description}</CardDescription>}
      </CardHeader>
      <CardFooter className="gap-2">
        {answered ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {confirmed ? (
              <CheckCircleIcon weight="fill" className="size-4 text-primary" />
            ) : (
              <XCircleIcon weight="fill" className="size-4" />
            )}
            {confirmed ? "Confirmed" : "Declined"}
          </span>
        ) : (
          <>
            <Button
              size="sm"
              variant={args.destructive ? "destructive" : "default"}
              disabled={!respond}
              onClick={() => respond?.({ confirmed: true })}
            >
              {args.confirmLabel || "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!respond}
              onClick={() => respond?.({ confirmed: false })}
            >
              {args.cancelLabel || "Cancel"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

// ── registration ────────────────────────────────────────────────────────────
export function PersonaFrontendTools() {
  const router = useRouter();

  useFrontendTool({
    name: "get_page_context",
    description:
      "Read-only facts about the user's browser session: current page path and title, light/dark theme, viewport size, language, time zone and local time. Use it before answering anything that depends on where the user is or their local time.",
    handler: () => ({
      path: window.location.pathname,
      title: document.title,
      theme: currentTheme(),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localTime: new Date().toString(),
    }),
  });

  useFrontendTool<{ theme: Theme }>({
    name: "set_theme",
    description: "Switch the app between light and dark mode when the user asks for it.",
    parameters: {
      type: "object",
      properties: { theme: { type: "string", enum: ["light", "dark"] } },
      required: ["theme"],
    },
    handler: ({ theme }) => {
      if (theme !== "light" && theme !== "dark") throw new Error(`Unknown theme "${theme}".`);
      document.documentElement.classList.toggle("dark", theme === "dark");
      return { theme };
    },
  });

  useFrontendTool<{ page: PageKey }>({
    name: "navigate_to",
    description:
      'Open a page of this app for the user. "new_chat" starts a fresh conversation; "journal" opens the mood journal; "profile" opens the profile; "assistant" opens the assistant feature showcase.',
    parameters: {
      type: "object",
      properties: { page: { type: "string", enum: Object.keys(PAGES) } },
      required: ["page"],
    },
    handler: ({ page }) => {
      const target = PAGES[page];
      if (!target) throw new Error(`Unknown page "${page}".`);
      router.push(target.path);
      return { opened: target.label };
    },
  });

  useFrontendTool<{ text: string }>({
    name: "copy_to_clipboard",
    description:
      "Copy text to the user's clipboard (e.g. a code snippet, an email draft) when they ask you to copy something.",
    parameters: {
      type: "object",
      properties: { text: { type: "string", maxLength: 20000 } },
      required: ["text"],
    },
    handler: async ({ text }) => {
      // Browsers can refuse without recent user interaction; the thrown
      // error reaches the agent as a failed tool, so it can ask the user to
      // copy manually instead.
      await navigator.clipboard.writeText(String(text ?? ""));
      return { copied: true, characters: String(text ?? "").length };
    },
  });

  useHumanInTheLoop<ConfirmArgs>({
    name: "confirm_action",
    description:
      "Ask the user to explicitly confirm before you do something consequential (sending, deleting, submitting, spending). Wait for the answer: { confirmed: true } means go ahead, { confirmed: false } means stop and don't do it.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "The question, e.g. \"Send this email to Priya?\"" },
        description: { type: "string", description: "What will happen if they confirm." },
        confirmLabel: { type: "string" },
        cancelLabel: { type: "string" },
        destructive: { type: "boolean", description: "True for irreversible actions." },
      },
      required: ["title"],
    },
    render: ({ args, status, result, respond }) => (
      <ConfirmCard args={args} status={status} result={result} respond={respond} />
    ),
  });

  useComponent<ChartArgs>({
    name: "show_chart",
    description: `Show the user a bar or line chart in the chat instead of a table of numbers. Up to ${MAX_CHART_POINTS} points.`,
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        kind: { type: "string", enum: ["bar", "line"] },
        valueLabel: { type: "string", description: 'What the values measure, e.g. "Marks (%)".' },
        data: {
          type: "array",
          maxItems: MAX_CHART_POINTS,
          items: {
            type: "object",
            properties: { label: { type: "string" }, value: { type: "number" } },
            required: ["label", "value"],
          },
        },
      },
      required: ["title", "kind", "data"],
    },
    render: (args) => <ToolChart {...args} />,
  });

  useFrontendTool<Record<string, never>>({
    name: "get_location",
    description:
      "Get the user's current location (coordinates, accuracy and a place name) and show it to them on a map. The browser asks the user for permission first. Only call this when the user asks for something that needs where they are (nearby places, directions, local weather, \"where am I\"); never call it proactively. If it fails or they decline, ask them for their city instead. Don't repeat the exact coordinates back unless asked, a place name is enough.",
    parameters: { type: "object", properties: {} },
    handler: () => fetchLocation(),
    render: ({ status, result, isError }) => (
      <LocationCard status={status} result={result} isError={isError} />
    ),
  });

  useComponent<Record<string, never>>({
    name: "show_helpline",
    description:
      "CRISIS: show the user a card with mental-health helplines (Tele-MANAS, KIRAN, iCall, 112) with tap-to-call buttons. Call this immediately, with no arguments, whenever the user mentions suicide, self-harm, abuse or being in immediate danger, in any language. Then keep talking to them warmly.",
    parameters: { type: "object", properties: {} },
    render: () => <HelplineCard />,
  });

  useFrontendTool<{ city?: string }>({
    name: "get_weather",
    description:
      "Current weather and a 3-day forecast, shown to the user as a weather card. Pass `city` (e.g. \"Patna\", \"London\"); omit it for the user's own location (the browser asks them for permission). Temperatures are in °C.",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name. Omit for the user's current location." },
      },
    },
    // Data comes from Open-Meteo (free, no key), fetched straight from the browser.
    handler: ({ city }) => fetchWeather(city),
    render: ({ args, status, result, isError }) => (
      <WeatherCard city={args.city} status={status} result={result} isError={isError} />
    ),
  });

  useComponent<{ zones: ClockZone[] }>({
    name: "show_clock",
    description:
      "Show a live clock in the chat for up to 6 time zones (IANA names like \"Asia/Kolkata\", \"America/New_York\"). Omit `zones` for the user's local time. Use for \"what time is it in…\" or comparing time zones.",
    parameters: {
      type: "object",
      properties: {
        zones: {
          type: "array",
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              timeZone: { type: "string", description: "IANA time zone, e.g. \"Europe/London\"." },
              label: { type: "string", description: "Display name, e.g. \"Office (London)\"." },
            },
            required: ["timeZone"],
          },
        },
      },
    },
    render: (args) => <WorldClock zones={args.zones} />,
  });

  useComponent<{ seconds: number; label?: string }>({
    name: "start_timer",
    description: `Start a visible countdown timer in the chat (pause/resume/reset), e.g. for a study session, a break, or cooking. 1 second to ${MAX_TIMER_SECONDS / 3600} hours.`,
    parameters: {
      type: "object",
      properties: {
        seconds: { type: "integer", minimum: 1, maximum: MAX_TIMER_SECONDS },
        label: { type: "string", description: "What the timer is for, e.g. \"Pomodoro — focus\"." },
      },
      required: ["seconds"],
    },
    render: (args) => <CountdownTimer seconds={args.seconds} label={args.label} />,
  });

  return null;
}
