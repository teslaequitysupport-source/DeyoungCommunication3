/**
 * DEYOUNG COMMUNICATION: seed script
 * Creates: admin account, site settings singleton, default content blocks.
 * Run: bunx tsx scripts/seed.ts  (or bun scripts/seed.ts)
 * HONEST: seeds zero fake metrics. Only structure + real copy defaults.
 */
import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@deyoungcommunication.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "DeYoungAdmin2026!";

const CONTENT_BLOCKS: Array<{
  key: string; group: string; label: string; type: string; value: string; sortOrder: number;
}> = [
  // Home
  { key: "home.hero.eyebrow", group: "home", label: "Hero eyebrow", type: "text", value: "AI employees for real conversations", sortOrder: 1 },
  { key: "home.hero.title", group: "home", label: "Hero headline", type: "textarea", value: "Hire intelligence that\never puts a caller on hold.", sortOrder: 2 },
  { key: "home.hero.title.accent", group: "home", label: "Hero headline accent word", type: "text", value: "never", sortOrder: 3 },
  { key: "home.hero.sub", group: "home", label: "Hero subheading", type: "textarea", value: "AI employees that answer every call and chat, know your business, and hand off to humans when it matters. For companies and individuals alike: you bring nothing, we provide everything.", sortOrder: 4 },
  { key: "home.stats.honest_note", group: "home", label: "Stats honest note", type: "text", value: "These counters are live. They read from the database: zero until real work happens here.", sortOrder: 5 },
  // Banner
  { key: "banner.eyebrow", group: "banner", label: "Banner (in Settings)", type: "text", value: "Managed in Admin → Settings", sortOrder: 1 },
  // Product voice
  { key: "product.voice.title", group: "product", label: "Voice page title", type: "text", value: "A voice pipeline built for interruption.", sortOrder: 1 },
  // About
  { key: "about.intro", group: "about", label: "About intro", type: "textarea", value: "We are a communications engineering company. We build AI employees that speak, listen, remember, and act for businesses that refuse to keep people waiting on hold.", sortOrder: 1 },
  // Contact
  { key: "contact.promise", group: "contact", label: "Contact promise", type: "text", value: "A human replies within one business day. That is a promise we keep manually.", sortOrder: 1 },
];

async function main() {
  // 1. Site settings singleton
  const settings = await db.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: { id: "site" },
  });
  console.log("✓ SiteSettings:", settings.id, "| siteName:", settings.siteName);

  // 2. Content blocks (upsert each)
  for (const b of CONTENT_BLOCKS) {
    await db.contentBlock.upsert({
      where: { key: b.key },
      update: { label: b.label, group: b.group, type: b.type, sortOrder: b.sortOrder },
      create: b,
    });
  }
  console.log(`✓ ContentBlocks: ${CONTENT_BLOCKS.length} ensured`);

  // 3. Admin account + org
  let admin = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    admin = await db.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "DEYOUNG Admin",
        passwordHash: hashPassword(ADMIN_PASSWORD),
        role: "admin",
        status: "active",
        approvedAt: new Date(),
      },
    });
    console.log("✓ Admin created:", ADMIN_EMAIL);
  } else {
    admin = await db.user.update({
      where: { id: admin.id },
      data: { role: "admin", status: "active", approvedAt: admin.approvedAt ?? new Date() },
    });
    console.log("✓ Admin promoted:", ADMIN_EMAIL);
  }

  // Admin org (so admin can also exercise the product)
  let membership = await db.membership.findFirst({
    where: { userId: admin.id, role: "owner" },
    include: { organization: true },
  });
  if (!membership) {
    const org = await db.organization.create({
      data: { name: "DEYOUNG COMMUNICATION (internal)", type: "business" },
    });
    await db.membership.create({
      data: { userId: admin.id, organizationId: org.id, role: "owner" },
    });
    console.log("✓ Admin org created");
  }

  // 4. Existing legacy users → keep active, they were verified in prior E2E
  const legacy = await db.user.updateMany({
    where: { role: "user", status: "active" },
    data: { approvedAt: new Date() },
  });
  console.log(`✓ Legacy users normalized: ${legacy.count}`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
