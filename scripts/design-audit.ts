/**
 * Design audit: sends screenshots to the vision model for expert critique.
 * Used iteratively during the premium redesign verification.
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.log("usage: bun scripts/design-audit.ts <screenshot.png> [...]");
  process.exit(1);
}

async function main() {
  const zai = await ZAI.create();
  for (const file of files) {
    const b64 = fs.readFileSync(file).toString("base64");
    const res = await zai.chat.completions.createVision({
      model: "glm-4.6v",
      messages: [
        {
          role: "system",
          content:
            "You are a world-class design director auditing a premium tech marketing site (brand: DEYOUNG COMMUNICATION, red #E10600 / black #090909 / white, fonts Sora+Inter+JetBrains Mono). Be specific and blunt. Judge: typography hierarchy, spacing rhythm, color discipline, layout craft, 3D/visual richness, premium feel vs generic-AI-template feel. End with VERDICT: PASS or FIX plus a numbered list of the 3 most impactful fixes (or 'none').",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Audit this screenshot (${file}). Is it premium and head-turning or generic/sloppy?` },
            { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });
    console.log(`\n===== ${file} =====`);
    console.log(res.choices[0]?.message?.content ?? "no reply");
  }
}
main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
