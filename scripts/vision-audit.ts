/** Vision audit of design screenshots via z-ai-web-dev-sdk (backend only). */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

const FILES = process.argv.slice(2);
const PROMPT = `You are a strict design QA reviewer for a premium dark website (brand: DEYOUNG COMMUNICATION, red #E10600 on near-black, gold accents).
For this screenshot, answer concisely:
1. VISUAL: Are photos rendering (not broken)? Is there too much empty dark space or white?
2. BUTTONS: Do primary buttons look premium (gradient, glow) rather than flat?
3. PHONE: If this is a hero, is a phone/device mockup visible?
4. TEXT: Does the copy look short and punchy, or dense/paragraph-heavy?
5. Any visual bugs (overlap, cut-off, misalignment)?
End with VERDICT: PASS or FAIL plus one line reason.`;

async function main() {
  const zai = await ZAI.create();
  for (const f of FILES) {
    if (!fs.existsSync(f)) { console.log(`SKIP ${f} (missing)`); continue; }
    const b64 = fs.readFileSync(f).toString("base64");
    try {
      const res = await zai.chat.completions.create({
        messages: [
          { role: "user", content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
          ] as any },
        ],
        max_tokens: 500,
        temperature: 0.2,
      });
      console.log(`\n=== ${f} ===\n${res.choices[0]?.message?.content ?? "(no reply)"}`);
    } catch (e) {
      console.log(`\n=== ${f} ===\nERROR: ${String(e)}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
