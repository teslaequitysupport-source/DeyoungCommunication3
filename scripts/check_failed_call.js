const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const c = await p.callSession.findUnique({ where: { id: 'cmu1vb02s001csuhp9sdqxijj' }, include: { turns: true } });
  console.log('status:', c.status, '| turns:', c.turns.length, '| endedAt:', c.endedAt, '| duration:', c.durationSec);
  console.log('transcript tail:', (c.transcript || '').slice(-300));
  await p.$disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
