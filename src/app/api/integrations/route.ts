import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, audit } from "@/lib/server/auth";
import { z } from "zod";

/**
 * Integration connection states. These reflect what this build actually supports.
 * web_chat is native (connected by default). Telephony and messaging providers
 * are honest "configuration required" surfaces until credentials exist.
 */
const INTEGRATION_CATALOG: {
  type: string;
  label: string;
  category: string;
  state: "connected" | "not_connected" | "coming_soon";
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
    label: "WhatsApp Business",
    category: "Channel",
    state: "coming_soon",
    detail: "WhatsApp Business Platform integration ships in Phase 2 with per-conversation cost display.",
  },
  {
    type: "email",
    label: "Email",
    category: "Channel",
    state: "coming_soon",
    detail: "Inbound email routing ships in Phase 2.",
  },
  {
    type: "openai",
    label: "AI Provider (LLM)",
    category: "Provider",
    state: "connected",
    detail: "Platform-managed model access is active. Bring-your-own keys ship with the provider settings in Phase 1.",
  },
  {
    type: "deepgram",
    label: "Speech-to-Text",
    category: "Provider",
    state: "not_connected",
    detail: "Configuration required for live calls. Not needed for web chat.",
  },
  {
    type: "elevenlabs",
    label: "Text-to-Speech",
    category: "Provider",
    state: "not_connected",
    detail: "Configuration required for voice. Practice mode in Voice Studio needs no provider.",
  },
  {
    type: "livekit",
    label: "LiveKit Media",
    category: "Infrastructure",
    state: "not_connected",
    detail: "Configuration required for real-time voice sessions.",
  },
  {
    type: "calendar",
    label: "Calendar (booking)",
    category: "Tool",
    state: "coming_soon",
    detail: "Appointment tool actions ship in Phase 1 with the tool worker.",
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
  if (item.state === "coming_soon") {
    return NextResponse.json(
      { error: `${item.label} is coming soon and cannot be configured yet.` },
      { status: 400 },
    );
  }
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
