const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  for (const m of ["contentBlock", "user", "aiEmployee", "callSession"]) {
    try { console.log(m, await p[m].count()); } catch (e) { console.log(m, "ERR", e.message.slice(0, 60)); }
  }
  await p.$disconnect();
})();
