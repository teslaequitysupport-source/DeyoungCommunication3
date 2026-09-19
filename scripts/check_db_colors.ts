import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const blocks = await db.contentBlock.findMany();
  for (const b of blocks) {
    if (/red|gold|crimson|scarlet/i.test(b.value)) {
      console.log(`[COLORWORD] ${b.key}: ${b.value.slice(0, 120)}`);
    }
  }
  const s = await db.siteSettings.findFirst();
  console.log('banner:', JSON.stringify(s?.bannerText), JSON.stringify(s?.bannerLabel));
  const count = await db.mediaAsset.count();
  console.log('media assets:', count);
}
main().finally(() => db.$disconnect());
