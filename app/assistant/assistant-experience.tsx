"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  ChatCircleDotsIcon,
  CheckSquareIcon,
  FileTextIcon,
  MicrophoneIcon,
  PlugsConnectedIcon,
  SparkleIcon,
  TerminalIcon,
  TreeStructureIcon,
} from "@phosphor-icons/react";
import { PersonaProvider } from "@personaai/react";
import { UserButton } from "@clerk/nextjs";
import { PersonaChatFab, PersonaFrontendTools } from "@/components/persona/chat-sdk";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { AGENTS, DEFAULT_VOICE_AGENT_ID } from "@/app/agents";

const FEATURES = [
  {
    icon: MicrophoneIcon,
    title: "Voice conversations",
    description: "Start a live call from the composer and type into it mid-call.",
  },
  {
    icon: FileTextIcon,
    title: "Memory & workspace",
    description: "Browse, edit, and create the agent's memory and workspace files.",
  },
  {
    icon: PlugsConnectedIcon,
    title: "Connected accounts",
    description: "Link MCP services so the agent can use their tools as you.",
  },
  {
    icon: TerminalIcon,
    title: "Live sandbox",
    description: "Replay every shell command the agent runs in its isolated VM.",
  },
  {
    icon: CheckSquareIcon,
    title: "Approvals & plans",
    description: "Approve sensitive actions and follow the task checklist as it runs.",
  },
  {
    icon: TreeStructureIcon,
    title: "Subagent traces",
    description: "Open the full conversation of any helper the agent delegates to.",
  },
];

export function AssistantExperience() {
  const [open, setOpen] = React.useState(false);

  return (
    <PersonaProvider
      baseUrl="/api/persona"
      defaultAgentId={process.env.NEXT_PUBLIC_PERSONA_AGENT_ID}
      logLevel="debug"
    >
      <PersonaFrontendTools />
      <main className="relative flex min-h-dvh flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-none bg-primary text-primary-foreground">
              <SparkleIcon weight="fill" className="size-4" />
            </span>
            <span className="font-heading text-sm font-semibold tracking-tight">
              AI Assistant
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Full chat
              <ArrowRightIcon />
            </Link>
            <UserButton />
          </div>
        </header>

        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-14 sm:px-6 sm:py-20">
          <Badge
            variant="outline"
            className="w-fit gap-1.5 border-border bg-muted/40"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Floating assistant
          </Badge>

          <h1 className="mt-5 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Your AI copilot,{" "}
            <span className="text-primary">one tap away.</span>
          </h1>

          <p className="mt-5 max-w-xl text-sm/relaxed text-muted-foreground sm:text-base/relaxed">
            Ask by text or voice, let the agent work in its sandbox, connect your
            own accounts, and pick any past conversation back up — without
            leaving the page.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Button size="lg" onClick={() => setOpen(true)}>
              <ChatCircleDotsIcon />
              Open the assistant
            </Button>
            <Link
              href="/"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Open full chat
              <ArrowRightIcon />
            </Link>
          </div>

          <ul className="mt-14 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: FeatureIcon, title, description }) => (
              <li key={title} className="flex flex-col gap-2 bg-background p-5">
                <span className="flex size-8 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
                  <FeatureIcon className="size-4" />
                </span>
                <span className="mt-1 text-sm font-semibold">{title}</span>
                <span className="text-xs/relaxed text-muted-foreground">
                  {description}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t border-border px-4 py-4 text-[11px] text-muted-foreground sm:px-6">
          Look for the chat bubble in the bottom-left corner.
        </footer>
      </main>

      <PersonaChatFab
        open={open}
        onOpenChange={setOpen}
        agentId={AGENTS[0].agentId}
        voiceAgentId={process.env.NEXT_PUBLIC_PERSONA_VOICE_AGENT_ID || DEFAULT_VOICE_AGENT_ID}
        voiceEnvironment="production"
        agents={AGENTS}
        title="AI Assistant"
        emptyTitle="How can I help you today?"
        emptyDescription="Ask a question, start a voice call, or pick up an earlier thread."
        placeholder="Ask anything…"
        starterPrompts={[
          {
            label: "What can you do?",
            icon: ChatCircleDotsIcon,
            template: "What can you do?",
          },
          {
            label: "Talk by voice",
            icon: MicrophoneIcon,
            template: "I'd like to talk by voice.",
          },
        ]}
      />
    </PersonaProvider>
  );
}
