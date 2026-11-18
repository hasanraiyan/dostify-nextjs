"use client";

import * as React from "react";
import {
  CaretRightIcon,
  CaretDownIcon,
  CopyIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue };

function valueClass(value: JsonValue): string {
  if (value === null || value === undefined) return "text-muted-foreground/80 italic";
  switch (typeof value) {
    case "string":
      return "text-amber-600 dark:text-amber-400";
    case "number":
      return "text-blue-600 dark:text-blue-400";
    case "boolean":
      return "text-purple-600 dark:text-purple-400";
    default:
      return "text-foreground";
  }
}

function formatPrimitive(value: JsonValue): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

// Collapsed summary preview for objects and arrays
function collapsedPreview(value: JsonValue): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const hasComplex = value.some((v) => v !== null && typeof v === "object");
    if (hasComplex) {
      return `Array(${value.length})`;
    }
    const inner = value.map((v) => formatPrimitive(v)).join(", ");
    const text = `[${inner}]`;
    return text.length > 50 ? `[${value.length} items]` : text;
  }

  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value as object);
    if (keys.length === 0) return "{}";
    if (keys.length <= 3) {
      return `{ ${keys.join(", ")} }`;
    }
    return `{ ${keys.length} keys }`;
  }

  return formatPrimitive(value);
}

/** A string that holds a JSON object/array (tool results often do) → that value. */
export function parseJsonString(value: JsonValue): JsonValue | undefined {
  if (typeof value !== "string" || value.length < 2) return undefined;
  const t = value.trim();
  if (!((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]")))) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(t);
    return parsed !== null && typeof parsed === "object" ? (parsed as JsonValue) : undefined;
  } catch {
    // Attempt recovery for truncated JSON strings
    const clean = t.replace(/…\s*\[(?:truncated|\d+\s*more)[\s\S]*?\]$/, "").trim();
    if (clean.startsWith("{")) {
      let lastIdx = clean.lastIndexOf("}");
      while (lastIdx > 0) {
        try {
          const candidate = clean.slice(0, lastIdx + 1);
          const parsed = JSON.parse(candidate);
          if (parsed && typeof parsed === "object") return parsed as JsonValue;
        } catch {
          // continue
        }
        lastIdx = clean.lastIndexOf("}", lastIdx - 1);
      }
    } else if (clean.startsWith("[")) {
      let lastIdx = clean.lastIndexOf("}");
      while (lastIdx > 0) {
        try {
          const candidate = clean.slice(0, lastIdx + 1) + "]";
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed)) return parsed as JsonValue;
        } catch {
          // continue
        }
        lastIdx = clean.lastIndexOf("}", lastIdx - 1);
      }
    }
    return undefined;
  }
}

function CopyNodeButton({ value }: { value: unknown }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const str = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="opacity-0 group-hover/json-row:opacity-100 transition-opacity ml-1.5 p-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted"
      title="Copy value"
    >
      {copied ? <CheckIcon className="size-3 text-emerald-500" /> : <CopyIcon className="size-3" />}
    </button>
  );
}

function JsonNode({
  keyName,
  value,
  depth,
  defaultExpandedDepth = 1,
}: {
  keyName: string | number | null;
  value: JsonValue;
  depth: number;
  defaultExpandedDepth?: number;
}) {
  const parsed = React.useMemo(() => parseJsonString(value), [value]);
  if (parsed !== undefined) {
    return (
      <JsonObjectNode
        keyName={keyName}
        value={parsed}
        depth={depth}
        fromString
        defaultExpandedDepth={defaultExpandedDepth}
      />
    );
  }
  return (
    <JsonObjectNode
      keyName={keyName}
      value={value}
      depth={depth}
      defaultExpandedDepth={defaultExpandedDepth}
    />
  );
}

function JsonObjectNode({
  keyName,
  value,
  depth,
  fromString = false,
  defaultExpandedDepth = 1,
}: {
  keyName: string | number | null;
  value: JsonValue;
  depth: number;
  fromString?: boolean;
  defaultExpandedDepth?: number;
}) {
  const isObject = value !== null && typeof value === "object";
  const isArray = isObject && Array.isArray(value);
  const isEmpty =
    isObject &&
    (isArray ? (value as JsonValue[]).length === 0 : Object.keys(value as object).length === 0);

  // Depth 0 or depths less than defaultExpandedDepth start expanded
  const [open, setOpen] = React.useState(depth < defaultExpandedDepth);

  // Leaf node (primitive or empty array/object)
  if (!isObject || isEmpty) {
    return (
      <div className="group/json-row flex items-baseline gap-1.5 py-0.5 px-1 -mx-1 rounded hover:bg-muted/40 font-mono text-[11px] leading-relaxed transition-colors">
        {/* Fixed gutter spacer matching caret button so keys align vertically */}
        <span className="size-3.5 shrink-0" aria-hidden="true" />
        {keyName != null && (
          <span className="shrink-0 font-medium text-foreground/80 select-text">
            {typeof keyName === "number" ? (
              <span className="text-muted-foreground/60 font-normal">[{keyName}]</span>
            ) : (
              keyName
            )}
            :
          </span>
        )}
        <span
          className={cn(
            "break-words whitespace-pre-wrap [overflow-wrap:anywhere] select-text",
            isEmpty ? "text-muted-foreground/70" : valueClass(value)
          )}
        >
          {isEmpty ? (isArray ? "[]" : "{}") : formatPrimitive(value)}
        </span>
        <CopyNodeButton value={value} />
      </div>
    );
  }

  const entries: [string | number, JsonValue][] = isArray
    ? (value as JsonValue[]).map((v, i) => [i, v])
    : Object.entries(value as object);

  return (
    <div className="font-mono text-[11px] leading-relaxed">
      <div
        onClick={() => setOpen((v) => !v)}
        className="group/json-row flex w-full items-baseline gap-1.5 py-0.5 px-1 -mx-1 rounded hover:bg-muted/40 text-left cursor-pointer transition-colors"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="flex size-3.5 items-center justify-center shrink-0 rounded text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 transition-colors"
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? <CaretDownIcon className="size-3" /> : <CaretRightIcon className="size-3" />}
        </button>

        <span className="break-all select-text flex items-baseline gap-1.5 min-w-0">
          {keyName != null && (
            <span className="font-medium text-foreground/80 shrink-0">
              {typeof keyName === "number" ? (
                <span className="text-muted-foreground/60 font-normal">[{keyName}]</span>
              ) : (
                keyName
              )}
              :
            </span>
          )}

          {fromString && (
            <span
              className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1 py-0.2 text-[9px] font-sans font-medium uppercase select-none"
              title="This value was a JSON string, shown decoded"
            >
              JSON
            </span>
          )}

          {open ? (
            <span className="text-muted-foreground/70 font-mono">{isArray ? "[" : "{"}</span>
          ) : (
            <span className="text-muted-foreground/70 font-mono italic">
              {collapsedPreview(value)}
            </span>
          )}
        </span>

        <CopyNodeButton value={value} />
      </div>

      {open && (
        <div className="ml-1.5 border-l border-border/50 dark:border-border/40 pl-2.5 flex flex-col gap-0.5">
          {entries.map(([k, v]) => (
            <JsonNode
              key={k}
              keyName={isArray ? k : k}
              value={v}
              depth={depth + 1}
              defaultExpandedDepth={defaultExpandedDepth}
            />
          ))}
        </div>
      )}

      {open && (
        <div className="flex items-center gap-1.5 px-1 -mx-1 text-muted-foreground/70 font-mono">
          <span className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{isArray ? "]" : "}"}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Collapsible, syntax-colored JSON tree.
 * - Leaf rows and expandable rows share a consistent gutter for vertical key alignment.
 * - Top-level keys start expanded; nested structures show clean previews with item counts.
 * - JSON strings inside properties are automatically decoded and badged.
 * - Row hover allows copying individual values or JSON objects.
 */
export function JsonTreeView({
  data: raw,
  className,
  defaultExpandedDepth = 1,
}: {
  data: unknown;
  className?: string;
  defaultExpandedDepth?: number;
}) {
  const decoded = React.useMemo(() => parseJsonString(raw as JsonValue), [raw]);
  const data = decoded ?? raw;

  if (data === null || typeof data !== "object") {
    return (
      <div className={cn("font-mono text-[11px]", valueClass(data as JsonValue), className)}>
        {formatPrimitive(data as JsonValue)}
      </div>
    );
  }

  const entries: [string | number, JsonValue][] = Array.isArray(data)
    ? data.map((v, i) => [i, v])
    : Object.entries(data as object);

  if (entries.length === 0) {
    return (
      <div className={cn("font-mono text-[11px] text-muted-foreground/70", className)}>
        {Array.isArray(data) ? "[]" : "{}"}
      </div>
    );
  }

  return (
    <div className={cn("font-mono text-[11px] leading-relaxed select-text", className)}>
      {entries.map(([k, v]) => (
        <JsonNode
          key={k}
          keyName={Array.isArray(data) ? k : k}
          value={v}
          depth={0}
          defaultExpandedDepth={defaultExpandedDepth}
        />
      ))}
    </div>
  );
}