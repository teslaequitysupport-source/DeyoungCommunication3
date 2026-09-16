const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.contentBlock.findMany({ select: { key: true, value: true } }).then((rs) => {
  for (const r of rs) console.log(r.key, "|", String(r.value).slice(0, 60).replace(/\n/g, " "));
  return p.$disconnect();
}).catch((e) => { console.error(e.message); process.exit(1); });
