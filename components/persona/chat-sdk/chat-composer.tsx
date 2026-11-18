"use client";

import * as React from "react";
import {
  ArrowUpIcon,
  SquareIcon,
  PhoneXIcon,
  PaperclipIcon,
  XIcon,
  UploadSimpleIcon,
  FileIcon,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/ui/spinner";
import type { PersonaAttachment } from "@personaai/react";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupTextarea, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Same "start voice mode" glyph NotebookChat.js's ComposerForm uses (a
// waveform, not a generic microphone) — inlined to match it exactly rather
// than substituting a similar-but-different icon from phosphor's set.
// VoiceTab's "Start voice call" button renders this; the composer itself no
// longer shows a voice-mode toggle (nothing in the Playground wires it, so
// it was a dead button), so VoiceModeIcon lives here only as a shared glyph.
function VoiceModeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      {...props}
    >
      <path d="M2 10v3" />
      <path d="M6 6v11" />
      <path d="M10 3v18" />
      <path d="M14 8v8" />
      <path d="M18 5v14" />
      <path d="M22 10v3" />
    </svg>
  );
}

/**
 * Auto-resizing composer. The trailing action row is ALWAYS present, so the
 * composer keeps one steady height whether it is idle, streaming text, or
 * mid-voice-call — dropping the row when a surface has no voice button used
 * to shrink the idle composer into a short stub, so it is never conditionally
 * unmounted. Which action the row shows is computed by the caller:
 *
 *   streaming   → stop generating
 *   voice live  → stop the call, or send the typed text into the call
 *   default     → send message (dimmed until there is text to send)
 *
 * The idle send slot doubles as the voice-mode toggle when `onStartVoice` is
 * passed: with no text typed there is nothing to send, so that same slot
 * shows the waveform glyph instead of a permanently-dimmed arrow — one
 * control, not a separate always-on button bolted above the composer.
 *

 * The empty-state send is dimmed with `pointer-events-none` + reduced opacity
 * rather than a native `disabled` attribute — InputGroup greys out its WHOLE
 * contents via `has-disabled` when any child is disabled, which would wash
 * out the text field too.
 *
 * Deliberately no custom rounding/background overrides here — `InputGroup`/
 * `InputGroupButton` already carry this app's actual look (sharp
 * `rounded-lg` everywhere, `Button`'s own variant colors), stacking a
 * borrowed rounded-pill/rounded-full treatment on top of them is exactly
 * what looked inconsistent and over-padded before.
 */
function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  onStartVoice,
  onStopVoice,
  onSendToVoice,
  onSendImageToVoice,
  isStreaming = false,
  isVoiceActive = false,
  disabled = false,
  placeholder,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  isUploadingAttachments = false,
  attachmentError,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  /** Shown in the send slot instead of a dimmed arrow whenever the field is empty and idle. */
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  onSendToVoice?: (text: string) => void;
  /** During a live call, picked/pasted/dropped images go straight into the call (no upload step). */
  onSendImageToVoice?: (file: File) => void;
  isStreaming?: boolean;
  isVoiceActive?: boolean;
  disabled?: boolean;
  placeholder?: string;
  attachments?: PersonaAttachment[];
  onAddAttachments?: (files: FileList | File[] | null) => void;
  onRemoveAttachment?: (id: string) => void;
  isUploadingAttachments?: boolean;
  attachmentError?: string | null;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounter = React.useRef(0);
  const trimmed = value.trim();
  const hasReadyAttachments =
    (attachments?.filter((a) => a.status === "ready").length ?? 0) > 0;
  const canSend =
    (trimmed || hasReadyAttachments) && !isUploadingAttachments && !isStreaming;

  const submit = () => {
    if (!canSend) return;
    if (isVoiceActive) {
      if (trimmed) onSendToVoice?.(trimmed);
    } else if (!isStreaming) {
      onSend();
    }
  };

  const voiceImages = isVoiceActive && !!onSendImageToVoice;
  const addImages = (files: File[]) => {
    if (files.length === 0) return;
    if (voiceImages) {
      files.forEach((file) => onSendImageToVoice?.(file));
    } else if (!isVoiceActive) {
      onAddAttachments?.(files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const files = Array.from(e.clipboardData.files);
      if (files.length > 0) {
        e.preventDefault();
        addImages(files);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      addImages(files);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onPaste={handlePaste}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            addImages(Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary bg-background/95 backdrop-blur-xs animate-in fade-in-0 zoom-in-95 duration-100 pointer-events-none">
          <UploadSimpleIcon className="size-6 text-primary animate-bounce mb-1" />
          <span className="text-xs font-semibold text-primary">Drop images or files to attach</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            PNG, JPG, WEBP, GIF (up to 5 MB each)
          </span>
        </div>
      )}

      <InputGroup className="rounded-2xl">
        {!isVoiceActive && attachments && attachments.length > 0 && (
          <InputGroupAddon align="block-start" className="flex-wrap gap-2 pb-2 pt-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex items-center gap-2 rounded-md border border-border/70 bg-card/60 hover:bg-card/90 p-1.5 pr-2 transition-all shadow-2xs max-w-[200px]"
              >
                {/* Thumbnail / Icon */}
                <div className="relative size-7 shrink-0 rounded overflow-hidden border border-border/40 bg-muted flex items-center justify-center">
                  {att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <FileIcon className="size-3.5 text-muted-foreground" />
                  )}
                  {att.status === "uploading" && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <Spinner className="size-3 text-primary" />
                    </div>
                  )}
                </div>

                {/* Name & Size badge */}
                <div className="flex flex-col min-w-0 pr-1 leading-tight">
                  <span
                    className="truncate text-[11px] font-medium text-foreground max-w-[110px]"
                    title={att.name}
                  >
                    {att.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatFileSize(att.size)}
                  </span>
                </div>

                {att.status === "error" && (
                  <span className="text-[9px] font-semibold text-destructive shrink-0">
                    Failed
                  </span>
                )}

                {/* Remove button */}
                {onRemoveAttachment && (
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(att.id)}
                    className="size-4 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                    aria-label={`Remove ${att.name}`}
                  >
                    <XIcon className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </InputGroupAddon>
        )}

        <InputGroupTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder ?? (isVoiceActive ? "Type to voice…" : "Ask anything…")}
          rows={1}
          disabled={disabled}
          className="max-h-40"
        />

        <InputGroupAddon align="block-end" className="justify-between">
          <div className="flex items-center gap-1.5">
            {(!isVoiceActive || voiceImages) && (
              <InputGroupButton
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={voiceImages ? "Show an image in the call" : "Attach images"}
                title={voiceImages ? "Show an image in the call" : undefined}
                disabled={
                  disabled ||
                  (!voiceImages && (isStreaming || (attachments?.length ?? 0) >= 4))
                }
                onClick={() => fileInputRef.current?.click()}
              >
                <PaperclipIcon className="size-4" />
              </InputGroupButton>
            )}
            {attachmentError && (
              <span className="text-[11px] text-destructive truncate max-w-[200px]" title={attachmentError}>
                {attachmentError}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isStreaming ? (
              <InputGroupButton
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label="Stop generating"
                onClick={onStop}
              >
                <SquareIcon weight="fill" />
              </InputGroupButton>
            ) : isVoiceActive ? (
              <div className="flex items-center gap-1.5">
                {trimmed ? (
                  <InputGroupButton
                    type="submit"
                    variant="default"
                    size="icon-sm"
                    aria-label="Send to voice"
                    className="rounded-full"
                  >
                    <ArrowUpIcon />
                  </InputGroupButton>
                ) : null}
                <InputGroupButton
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  aria-label="Stop voice"
                  onClick={onStopVoice}
                >
                  <PhoneXIcon />
                </InputGroupButton>
              </div>
            ) : !trimmed && !hasReadyAttachments && onStartVoice ? (
              <InputGroupButton
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Start voice call"
                onClick={onStartVoice}
              >
                <VoiceModeIcon className="size-4" />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                aria-label="Send message"
                // Dim but not natively disabled (see note above): pointer-events
                // off so an empty click no-ops and focuses the field instead.
                className={cn("rounded-full", !canSend && "pointer-events-none opacity-40")}
              >
                {isUploadingAttachments ? <Spinner className="size-3.5" /> : <ArrowUpIcon />}
              </InputGroupButton>
            )}
          </div>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

export { ChatComposer, VoiceModeIcon };
