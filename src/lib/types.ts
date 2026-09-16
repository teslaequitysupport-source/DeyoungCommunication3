export type Role = "owner" | "admin" | "operator" | "viewer";

export type AccountRole = "user" | "admin";
export type AccountStatus = "active" | "pending" | "rejected" | "blocked";
export type Plan = "starter" | "business" | "agency";

export type SessionUser = {
  userId: string;
  email: string;
  name: string | null;
  role: Role;
  accountRole: AccountRole; // user | admin (site-wide)
  status: AccountStatus; // active | pending | rejected | blocked
  plan: Plan; // starter (free) | business | agency. Major functions are paid.
  statusReason: string;
  organizationId: string;
  organizationName: string;
  organizationType: "individual" | "business" | "agency";
};

export type SiteSettingsDTO = {
  siteName: string;
  tagline: string;
  supportEmail: string;
  bannerEnabled: boolean;
  bannerText: string;
  bannerLabel: string;
  bannerHref: string;
  flagShowPricing: boolean;
  flagShowStats: boolean;
  flagShowTestimonials: boolean;
  flagShowVoiceDemo: boolean;
  flagRequireApproval: boolean;
};

export type ContentMap = Record<string, { value: string; visible: boolean }>;

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  plan: string; // starter | business | agency (starter = free, no major functions)
  statusReason: string;
  internalNotes: string;
  createdAt: string;
  approvedAt: string | null;
  lastLoginAt: string | null;
  orgName: string | null;
};

export type CallTurnDTO = {
  id: string;
  ordinal: number;
  speaker: "human" | "ai";
  content: string;
  cues: string[];
  latencyMs: number;
  interrupted: boolean;
  source: "llm" | "operator_script" | "operator_injection";
  createdAt: string;
};

export type CallSessionDTO = {
  id: string;
  employeeName: string | null;
  userName: string | null;
  userEmail: string | null;
  status: string;
  channel: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  turnsCount: number;
  interruptions: number;
  cuesSummary: Record<string, number>;
};

export type ScriptRuleDTO = {
  id: string;
  match: string;
  matchType: "contains" | "exact";
  response: string;
  priority: number;
  enabled: boolean;
};

export type VoiceProfileDTO = {
  cloneId?: string;
  name?: string;
  voiceUri?: string;
  pitch?: number;
  rate?: number;
};

export type VoiceCloneDTO = {
  id: string;
  name: string;
  status: string;
  engine: string;
  sampleCount: number;
  totalMs: number;
  profile: {
    medianPitchHz?: number;
    rateMultiplier?: number;
    pitchMultiplier?: number;
    energy?: number;
    register?: string;
    matchedVoiceUri?: string;
  };
  consentName: string;
  consentAt: string | null;
  notes: string;
  createdAt: string;
};

export type AiEmployeeDTO = {
  id: string;
  name: string;
  role: string;
  purpose: string;
  personality: string;
  tone: string;
  instructions: string;
  escalationRule: string;
  channels: string[];
  language: string;
  scriptRules: ScriptRuleDTO[];
  voiceProfile: VoiceProfileDTO;
  status: "draft" | "deployed" | "paused";
  configVersion: number;
  createdAt: string;
  conversationCount?: number;
};

export type MessageDTO = {
  id: string;
  role: "customer" | "ai" | "system" | "human";
  content: string;
  speakerName: string | null;
  createdAt: string;
};

export type ConversationDTO = {
  id: string;
  channel: string;
  status: string;
  employeeId: string | null;
  employeeName?: string | null;
  customerName?: string | null;
  lastMessageAt: string;
  createdAt: string;
  messageCount?: number;
  lastPreview?: string | null;
};

export type CustomerDTO = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  tags: string[];
  consentStatus: string;
  conversationCount?: number;
  createdAt: string;
};

export type KnowledgeSourceDTO = {
  id: string;
  type: string;
  title: string;
  status: string;
  statusDetail: string;
  version: number;
  chunkCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type UsageSummary = {
  employees: number;
  conversations: number;
  messages: number;
  knowledgeSources: number;
  usageEvents: number;
  auditEntries: number;
  lastActivityAt: string | null;
  eventsByDay: { day: string; count: number }[];
};

export const ROLE_TEMPLATES: {
  key: string;
  label: string;
  blurb: string;
  purpose: string;
  instructions: string;
}[] = [
  {
    key: "ai_receptionist",
    label: "AI Receptionist",
    blurb: "Answers every call and chat, captures details, routes and books.",
    purpose: "Answer inbound calls and web chats for the business, capture caller details, answer FAQs, and book or route as needed.",
    instructions:
      "Greet the caller warmly. Identify what they need. Answer using only approved business knowledge. Offer to book an appointment when appropriate. If the request involves legal, medical, or payment disputes, or you are unsure, escalate to a human.",
  },
  {
    key: "sales_assistant",
    label: "Sales Assistant",
    blurb: "Qualifies leads and books qualified conversations for the team.",
    purpose: "Engage inbound leads, qualify them against criteria, and book time with the sales team.",
    instructions:
      "Ask a few targeted questions to qualify the lead: their need, timeline, budget range, and decision process. Stay conversational, never interrogate. Present the product honestly. When the lead is qualified, offer a booking. Never invent pricing that is not in approved knowledge.",
  },
  {
    key: "support_agent",
    label: "Customer Support Agent",
    blurb: "Resolves repetitive questions and escalates real problems.",
    purpose: "Resolve common support questions using approved knowledge and escalate anything unresolved.",
    instructions:
      "Acknowledge the issue, confirm you understand it, then resolve using approved knowledge. Confirm the resolution worked for the customer. If the issue needs account changes, refunds, or anything not in approved knowledge, escalate with a clear summary of the problem so far.",
  },
  {
    key: "appointment_scheduler",
    label: "Appointment Scheduler",
    blurb: "Finds times, books them, and confirms details back.",
    purpose: "Schedule, reschedule, and confirm appointments from calls and messages.",
    instructions:
      "Find out what service they need and preferred times. Check availability honestly: say when you are checking. Offer two concrete options when possible. Confirm date, time, and any details back to the customer before ending.",
  },
  {
    key: "virtual_assistant",
    label: "Virtual Assistant",
    blurb: "Personal assistant for calls, messages, and follow-ups.",
    purpose: "Handle calls and messages on the owner's behalf, capture tasks, and follow up.",
    instructions:
      "Take complete messages with name, contact, and request. Answer scheduling questions from the calendar. Never promise commitments that are not confirmed. Summarize every conversation in the note field.",
  },
  {
    key: "front_desk_agent",
    label: "Front Desk Agent",
    blurb: "Front-of-house calls: routing, directions, hours, and triage.",
    purpose: "Act as front desk for inbound calls: routing, basic info, and triage.",
    instructions:
      "Answer promptly. Give hours, location, and routing info from approved knowledge. Transfer to the right department when asked. Take messages when the person is unavailable.",
  },
  {
    key: "lead_qualification_agent",
    label: "Lead Qualification Agent",
    blurb: "Works inbound lists, scores, and hands over the good ones.",
    purpose: "Engage and score inbound leads against qualification criteria.",
    instructions:
      "Qualify against the configured criteria with natural questions. Score lead quality. Route high quality leads to sales immediately; nurture the rest with a follow-up commitment.",
  },
  {
    key: "business_info_agent",
    label: "Business Information Agent",
    blurb: "Answers questions about services, pricing, and policies.",
    purpose: "Answer accurate questions about the business's services, pricing, and policies.",
    instructions:
      "Answer strictly from approved knowledge. If information is not available, say so and offer to have someone follow up. Never estimate prices or invent policies.",
  },
  {
    key: "personal_assistant",
    label: "Personal Assistant",
    blurb: "A single assistant for a solo professional.",
    purpose: "Personal communication assistant for an individual professional.",
    instructions:
      "Handle inbound calls and messages politely. Manage scheduling requests. Screen new contacts. Keep the tone personal and warm, not corporate.",
  },
];

export const CHANNELS = [
  { key: "web_chat", label: "Web Chat", state: "connected" },
  { key: "phone", label: "Phone", state: "not_connected" },
  { key: "sms", label: "SMS", state: "not_connected" },
  { key: "whatsapp", label: "WhatsApp", state: "not_connected" },
  { key: "email", label: "Email", state: "not_connected" },
] as const;
