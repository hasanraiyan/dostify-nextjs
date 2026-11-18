"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MessageCircle,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Loader2,
} from "lucide-react";

interface ChannelConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChannelConnectDialog({ open, onOpenChange }: ChannelConnectDialogProps) {
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [triggering, setTriggering] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [twilioInfo, setTwilioInfo] = React.useState<{
    phoneNumber: string | null;
    whatsappNumber: string | null;
  }>({
    phoneNumber: null,
    whatsappNumber: null,
  });

  const fetchPhone = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/phone");
      if (res.ok) {
        const data = await res.json();
        if (data.phoneNumber) {
          setPhoneNumber(data.phoneNumber);
        }
        if (data.twilioConfigured) {
          setTwilioInfo({
            phoneNumber: data.twilioConfigured.phoneNumber,
            whatsappNumber: data.twilioConfigured.whatsappNumber,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load user phone number:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchPhone();
      setStatusMessage(null);
    }
  }, [open, fetchPhone]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    try {
      setSaving(true);
      setStatusMessage(null);
      const res = await fetch("/api/user/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhoneNumber(data.phoneNumber);
        setStatusMessage({
          type: "success",
          text: "Phone number registered successfully! Calls, WhatsApp messages, and SMS from this number will automatically sync to your chat.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to register phone number.",
        });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error saving phone number." });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerOutbound = async (type: "call" | "sms" | "whatsapp") => {
    try {
      setTriggering(type);
      setStatusMessage(null);
      const res = await fetch("/api/channels/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          to: phoneNumber.trim(),
          message:
            type === "whatsapp"
              ? "👋 Hi! This is your Persona AI Assistant on WhatsApp."
              : "👋 Hi! This is your Persona AI Assistant via SMS.",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const prefix = data.simulated ? "[Simulated] " : "";
        setStatusMessage({
          type: "success",
          text:
            data.message ||
            `${prefix}Outbound ${type === "call" ? "voice call initiated" : type.toUpperCase() + " sent"} to ${phoneNumber}!`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || `Failed to trigger outbound ${type}.`,
        });
      }
    } catch {
      setStatusMessage({ type: "error", text: `Failed to trigger outbound ${type}.` });
    } finally {
      setTriggering(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatusMessage({ type: "success", text: "Copied webhook URL to clipboard!" });
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const voiceWebhook = `${origin}/api/persona/channels/twilio/voice`;
  const messageWebhook = `${origin}/api/persona/channels/twilio/message`;
  const cleanWaNumber = twilioInfo.whatsappNumber
    ? twilioInfo.whatsappNumber.replace(/[^0-9]/g, "")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-6">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Phone className="size-4 text-emerald-500" />
            Connect Phone, WhatsApp & SMS
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Connect your phone number to converse with your AI agent via normal phone calls,
            WhatsApp messages, and SMS.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-5">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Phone Registration Section */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <h4 className="text-xs font-semibold text-foreground mb-1">
              Register Your Phone Number
            </h4>
            <p className="text-[11px] text-muted-foreground mb-3">
              Incoming calls and messages from this number will automatically sync into your active chat
              thread with channel badges.
            </p>

            <form onSubmit={handleSavePhone} className="flex gap-2">
              <Input
                type="tel"
                placeholder="+1 555 123 4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading || saving}
                className="h-8 text-xs font-mono"
              />
              <Button type="submit" size="sm" disabled={loading || saving} className="h-8 text-xs shrink-0">
                {saving ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                Save Number
              </Button>
            </form>
          </div>

          {/* Outbound Actions */}
          {phoneNumber && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground">
                Trigger Outbound Action
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs flex items-center justify-center gap-1.5"
                  onClick={() => handleTriggerOutbound("call")}
                  disabled={!!triggering}
                >
                  {triggering === "call" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Phone className="size-3.5 text-emerald-500" />
                  )}
                  Call Me
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs flex items-center justify-center gap-1.5"
                  onClick={() => handleTriggerOutbound("whatsapp")}
                  disabled={!!triggering}
                >
                  {triggering === "whatsapp" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <MessageCircle className="size-3.5 text-emerald-500" />
                  )}
                  Send WhatsApp
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs flex items-center justify-center gap-1.5"
                  onClick={() => handleTriggerOutbound("sms")}
                  disabled={!!triggering}
                >
                  {triggering === "sms" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="size-3.5 text-blue-500" />
                  )}
                  Send SMS
                </Button>
              </div>
            </div>
          )}

          {/* WhatsApp Direct Link */}
          {cleanWaNumber && (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 p-3">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <MessageCircle className="size-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-medium">WhatsApp AI Assistant</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {twilioInfo.whatsappNumber}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() =>
                  window.open(
                    `https://wa.me/${cleanWaNumber}?text=Hi`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Open WhatsApp
                <ExternalLink className="size-3 ml-1" />
              </Button>
            </div>
          )}

          {/* Twilio Webhook Endpoints */}
          <div className="rounded-lg border border-border/40 bg-muted/20 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Twilio Webhooks
              </span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                BYO-Twilio
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] font-mono bg-background/50 p-1.5 rounded border border-border/40">
              <span className="truncate text-muted-foreground">Voice: {voiceWebhook}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(voiceWebhook)}
                className="hover:text-foreground shrink-0 text-muted-foreground"
                title="Copy Voice Webhook"
              >
                <Copy className="size-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] font-mono bg-background/50 p-1.5 rounded border border-border/40">
              <span className="truncate text-muted-foreground">Messaging: {messageWebhook}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(messageWebhook)}
                className="hover:text-foreground shrink-0 text-muted-foreground"
                title="Copy Messaging Webhook"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
