#!/usr/bin/env node
/**
 * Visual QA: sends screenshots to the VLM and reports concrete defects.
 * Usage: node scripts/visual_check.cjs /tmp/shots/home-top.png [more.png ...]
 */
const fs = require("fs");

const PROMPT = `You are a strict UI QA reviewer for a premium dark-navy website (DEYOUNG COMMUNICATION, AI voice employees). Review this screenshot and report ONLY real, visible problems, each on one line prefixed by "ISSUE:"; if everything looks good write "ALL GOOD". Check specifically:
1. Is the logo (D monogram + DEYOUNG COMMUNICATION name) clearly visible in the header? Is anything invisible/near-invisible?
2. Any broken image placeholders (gray boxes, alt text, torn icons)?
3. Any element that looks obviously AI-generated or cheap (fake-looking phone, plastic-y icons)?
4. Any red or pink pixels (the palette is navy/cerulean/cyan only; amber accents allowed)?
5. Any overlapping text, cut-off elements, or unreadable contrast?
Then on a final line: "VERDICT: PASS" or "VERDICT: FAIL".`;

async function main() {
  const { default: ZAI } = await import("z-ai-web-dev-sdk");
  const zai = await ZAI.create();
  const files = process.argv.slice(2);
  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.log(`\n=== ${f} ===\nMISSING`);
      continue;
    }
    const b64 = fs.readFileSync(f).toString("base64");
    try {
      const res = await zai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
            ],
          },
        ],
        max_tokens: 600,
        temperature: 0.1,
      });
      console.log(`\n=== ${f} ===\n${res.choices[0]?.message?.content ?? "(no reply)"}`);
    } catch (e) {
      console.log(`\n=== ${f} ===\nERROR: ${String(e)}`);
    }
  }
}
main();
