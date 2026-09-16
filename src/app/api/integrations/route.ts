import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, audit } from "@/lib/server/auth";
import { z } from "zod";

/**
 * Integration connection states. These reflect what this build actually supports.
 * web_chat is native (connected by default). WhatsApp click-to-chat is live on
 * the public site. Everything else is an honest "configuration required"
 * surface until credentials exist - nothing is labeled coming soon anymore
 * except the mobile app (which is not an integration).
 */
const INTEGRATION_CATALOG: {
  type: string;
  label: string;
  category: string;
  state: "connected" | "not_connected" | "needs_attention";
  detail: string;
}[] = [
  {
    type: "web_chat",
    label: "Web Chat",
    category: "Channel",
    state: "connected",
    detail: "Native channel. Embed the widget or use the test console in the app.",
  },
  {
    type: "whatsapp_chat",
    label: "WhatsApp Click-to-Chat",
    category: "Channel",
    state: "connected",
    detail: "Live on the public site: visitors open a WhatsApp chat with you in one tap.",
  },
  {
    type: "phone",
    label: "Phone (SIP / Twilio)",
    category: "Channel",
    state: "not_connected",
    detail: "Configuration required: connect a SIP trunk or Twilio credentials to provision numbers.",
  },
  {
    type: "sms",
    label: "SMS",
    category: "Channel",
    state: "not_connected",
    detail: "Configuration required: connect a messaging provider with an approved sender ID.",
  },
  {
    type: "whatsapp",
    label: "WhatsApp Business API",
    category: "Channel",
    state: "not_connected",
    detail: "Connect your WhatsApp Business API credentials and the AI answers WhatsApp conversations automatically.",
  },
  {
    type: "email",
    label: "Email",
    category: "Channel",
    state: "not_connected",
    detail: "Configuration required: connect an inbound mailbox (IMAP or provider webhook) to route email to employees.",
  },
  {
    type: "calendar",
    label: "Calendar (.ics)",
    category: "Tool",
    state: "connected",
    detail: "Live: appointments generate real calendar events (.ics downloads on the contact page).",
  },
  {
    type: "openai",
    label: "AI Provider (LLM)",
    category: "Provider",
    state: "connected",
    detail: "Platform-managed model access is active. Bring-your-own keys ship with the provider settings.",
  },
  {
    type: "deepgram",
    label: "Speech-to-Text",
    category: "Provider",
    state: "not_connected",
    detail: "Optional for production telephony. Browser voice and web chat need no provider.",
  },
  {
    type: "elevenlabs",
    label: "Text-to-Speech",
    category: "Provider",
    state: "not_connected",
    detail: "Optional premium voices for production. Browser voice works without it.",
  },
  {
    type: "livekit",
    label: "LiveKit Media",
    category: "Infrastructure",
    state: "not_connected",
    detail: "Optional real-time media infrastructure for scaled voice sessions.",
  },
];

const patchSchema = z.object({
  type: z.string().min(1),
  action: z.enum(["request_setup"]),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const orgConns = await db.integrationConn.findMany({
    where: { organizationId: user.organizationId },
  });
  const byType = new Map(orgConns.map((c) => [c.type, c]));
  return NextResponse.json({
    integrations: INTEGRATION_CATALOG.map((item) => {
      const conn = byType.get(item.type);
      return {
        type: item.type,
        label: item.label,
        category: item.category,
        state: conn?.status ?? item.state,
        detail: conn?.statusDetail || item.detail,
      };
    }),
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot manage integrations." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const item = INTEGRATION_CATALOG.find((i) => i.type === parsed.data.type);
  if (!item) return NextResponse.json({ error: "Unknown integration" }, { status: 404 });
  await db.integrationConn.upsert({
    where: { organizationId_type: { organizationId: user.organizationId, type: item.type } },
    create: {
      organizationId: user.organizationId,
      type: item.type,
      status: "needs_attention",
      statusDetail: `Setup requested by ${user.name ?? user.email}. Waiting for credentials configuration.`,
    },
    update: {
      status: "needs_attention",
      statusDetail: `Setup requested by ${user.name ?? user.email}. Waiting for credentials configuration.`,
    },
  });
  await audit({
    userId: user.userId,
    orgId: user.organizationId,
    actor: "user",
    action: "integration.setup_requested",
    target: item.type,
  });
  return NextResponse.json({ ok: true });
}
