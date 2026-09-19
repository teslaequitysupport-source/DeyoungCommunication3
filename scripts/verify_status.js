const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const clones = await p.voiceClone.findMany({ orderBy: { consentAt: 'desc' }, take: 3 });
  console.log('VOICE CLONES:', JSON.stringify(clones.map(c => ({ id: c.id, name: c.name, consent: c.consentName, at: c.consentAt, profile: c.profileJson?.slice(0,100) })), null, 1));
  const emps = await p.aiEmployee.findMany({ select: { name: true, voiceProfile: true }, take: 10 });
  console.log('EMPLOYEE VOICE PROFILES:', JSON.stringify(emps.filter(e => e.voiceProfile).map(e => ({ name: e.name, vp: e.voiceProfile?.slice(0,120) })), null, 1));
  const calls = await p.callSession.findMany({ orderBy: { startedAt: 'desc' }, take: 3, select: { id: true, startedAt: true, callDirectives: true, status: true, turnsCount: true } });
  console.log('RECENT CALLS:', JSON.stringify(calls, null, 1));
  const turns = await p.callTurn.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { createdAt: true, speaker: true, content: true, latencyMs: true, interrupted: true } });
  console.log('RECENT TURN EVIDENCE (directive obedience proof):', JSON.stringify(turns, null, 1));
  await p.$disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
