import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PersonaClient } from "@personaai/sdk";
import { prisma } from "@/lib/prisma";

/**
 * Dispatches outbound messages (WhatsApp, SMS) directly through the
 * Persona Developer Platform using the Project's stored Twilio secrets.
 * No local TWILIO_* environment variables required!
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const type = String(body.type ?? "").toLowerCase(); // "call" | "sms" | "whatsapp"
  let to = String(body.to ?? "").trim();
  const message = String(body.message ?? "").trim() || "Hello from Persona AI Assistant!";

  // If no target number is passed, lookup registered user phone
  if (!to) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { phoneNumber: true },
    });
    if (user?.phoneNumber) {
      to = user.phoneNumber;
    }
  }

  if (!to) {
    return NextResponse.json(
      { error: "No destination phone number provided or registered." },
      { status: 400 }
    );
  }

  const cleanPhone = to.replace(/^whatsapp:/i, "").trim();
  const baseUrl = process.env.PERSONA_BASE_URL;
  const credential = process.env.PERSONA_CREDENTIAL;
  const agentId = process.env.NEXT_PUBLIC_PERSONA_AGENT_ID;

  if (!baseUrl || !credential) {
    return NextResponse.json(
      { error: "PERSONA_BASE_URL and PERSONA_CREDENTIAL are required." },
      { status: 500 }
    );
  }

  const client = new PersonaClient({
    baseUrl,
    credential,
  });

  try {
    if (type === "whatsapp" || type === "sms") {
      const delivery = await client.messages.send({
        to: cleanPhone,
        channel: type,
        body: message,
      });

      return NextResponse.json({
        success: true,
        type,
        to: delivery.to,
        from: delivery.from,
        messageSids: delivery.messageSids,
        status: delivery.status,
      });
    }

    if (type === "call") {
      // Direct call via platform backend if outbound telephony is configured
      const callRes = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/v1/twilio/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credential}`,
          "x-persona-credential": credential,
        },
        body: JSON.stringify({
          to: cleanPhone,
          agentId,
        }),
      });

      const callData = await callRes.json().catch(() => ({}));
      if (callRes.ok) {
        return NextResponse.json({
          success: true,
          type: "call",
          to: cleanPhone,
          data: callData,
        });
      }

      // If backend call endpoint returned an error, return it cleanly
      return NextResponse.json(
        {
          error:
            callData.message ||
            callData.error ||
            "Outbound call request failed on platform.",
          details: callData,
        },
        { status: callRes.status || 500 }
      );
    }

    return NextResponse.json({ error: `Unknown channel type: ${type}` }, { status: 400 });
  } catch (err: any) {
    console.error("Outbound dispatch failed via platform:", err);
    return NextResponse.json(
      {
        error: err.message || "Failed to dispatch outbound action via platform",
      },
      { status: 500 }
    );
  }
}
