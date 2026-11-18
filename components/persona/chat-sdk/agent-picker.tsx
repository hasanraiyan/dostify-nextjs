"use client";

import * as React from "react";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PersonaAgentOption {
  agentId: string;
  voiceAgentId?: string;
  name: string;
  avatarUrl?: string;
}

interface AgentPickerProps {
  agents: PersonaAgentOption[];
  value?: string;
  onChange: (agentId: string) => void;
  className?: string;
}

/**
 * Top-left chat header control for switching between Agents. Picking a new
 * Agent starts a fresh conversation with it — the previous chat stays in the
 * thread list (see PersonaChatView's switch handler).
 */
export function AgentPicker({ agents, value, onChange, className }: AgentPickerProps) {
  const current = agents.find((a) => a.agentId === value) ?? agents[0];
  if (!current) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium outline-none transition-colors hover:bg-accent focus-visible:bg-accent",
          className
        )}
        aria-label="Switch agent"
      >
        <AgentAvatar name={current.name} avatarUrl={current.avatarUrl} className="size-6 text-[10px]" />
        <span className="max-w-40 truncate">{current.name}</span>
        <CaretDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="min-w-56">
        {agents.map((agent) => (
          <DropdownMenuItem
            key={agent.agentId}
            onClick={() => onChange(agent.agentId)}
            className={cn(agent.agentId === value && "bg-accent/60")}
          >
            <AgentAvatar name={agent.name} avatarUrl={agent.avatarUrl} className="size-6 text-[10px]" />
            <span className="min-w-0 flex-1 truncate">{agent.name}</span>
            {agent.agentId === value && <CheckIcon className="ml-1 size-4 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AgentAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl?: string;
  className?: string;
}) {
  return avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className={cn("shrink-0 rounded-full object-cover", className)} />
  ) : (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
