/**
 * Ultra-realistic image regeneration for DEYOUNG COMMUNICATION.
 * Generates photoreal imagery via z-ai-web-dev-sdk, then upscales 2x (Lanczos3 + sharpen)
 * for 4K-class crispness. Deep Signal ambience: navy, cerulean, cyan on dark.
 */
import ZAI from "z-ai-web-dev-sdk";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const OUT = "/home/z/my-project/public/img";
const PHOTO = "ultra realistic professional photography, shot on Canon EOS R5, 85mm f/1.8 lens, natural light, photorealistic skin texture, film grain, high dynamic range, 4K UHD quality, sharp focus, no illustration, no render, no CGI look";

const JOBS = [
  // Agent gallery (3/4 portrait)
  { f: "agent-reception.png", s: "864x1152", p: `Professional female receptionist in her 30s at a sleek modern front desk, warm confident smile, wearing a slim headset, deep navy office with soft cerulean accent lighting behind her, shallow depth of field, ${PHOTO}` },
  { f: "agent-sales.png", s: "864x1152", p: `Confident male sales professional in his 30s holding a tablet, smart blazer, modern dark office with blue rim light, genuine approachable expression, shallow depth of field, ${PHOTO}` },
  { f: "agent-support.png", s: "864x1152", p: `Friendly female customer support specialist in her late 20s wearing a modern headset, subtle smile, dark contemporary office with cyan screen glow on her face, shallow depth of field, ${PHOTO}` },

  // Avatars (square headshots)
  { f: "avatar-1.png", s: "1024x1024", p: `Corporate headshot portrait of a businesswoman in her 40s, natural confident expression, soft studio light, dark neutral background with faint blue key light, ${PHOTO}` },
  { f: "avatar-2.png", s: "1024x1024", p: `Headshot portrait of a young man in his late 20s, solo founder energy, casual shirt, natural window light, dark background, ${PHOTO}` },
  { f: "avatar-3.png", s: "1024x1024", p: `Headshot portrait of a woman in her mid 30s, agency professional, subtle smile, soft rim light with cyan tint, dark background, ${PHOTO}` },
  { f: "avatar-4.png", s: "1024x1024", p: `Headshot portrait of a distinguished man in his 50s, grey beard, tailored suit, warm authoritative look, dark studio background, ${PHOTO}` },

  // Blog / resource cards (4/3 landscape)
  { f: "blog-emotion.png", s: "1152x864", p: `Close-up of a professional studio condenser microphone in a dark recording booth, glowing cerulean waveform on an out-of-focus screen behind, moody blue lighting, ${PHOTO}` },
  { f: "blog-handoff.png", s: "1152x864", p: `Business handshake over a wooden desk with a smartphone and documents, dark modern office, warm hand light against navy ambience, ${PHOTO}` },

  // Industries (4/3 landscape)
  { f: "industry-clinic.png", s: "1152x864", p: `Modern private medical clinic reception, clean minimalist interior, soft daylight, empty elegant waiting chairs, navy and white palette, architectural photography, ${PHOTO}` },
  { f: "industry-ecommerce.png", s: "1152x864", p: `Modern e-commerce fulfillment shelves with neat parcels, shallow depth of field, cool blue warehouse light, cinematic, ${PHOTO}` },
  { f: "industry-law.png", s: "1152x864", p: `Elegant law firm library, leather-bound books, warm desk lamp against deep navy shadows, brass details, cinematic architectural photography, ${PHOTO}` },
  { f: "industry-realestate.png", s: "1152x864", p: `Luxury modern home interior at dusk, floor to ceiling windows, city lights bokeh, deep blue evening tones with warm interior accents, architectural photography, ${PHOTO}` },

  // Wide formats
  { f: "network-map.png", s: "1344x768", p: `Dark data center aisle with rows of server racks, glowing cerulean status lights converging into distance, long exposure light trails, cinematic, ${PHOTO}` },
  { f: "security-core.png", s: "1152x864", p: `Macro shot of a server rack lock panel with blue verification light, dark vault-like server room, cinematic depth, ${PHOTO}` },
  { f: "team-studio.png", s: "1440x720", p: `Wide cinematic photo of a small modern creative studio team collaborating around a desk with laptops and a large screen showing an audio waveform, dark room with cyan and navy lighting, candid documentary style, ${PHOTO}` },
  { f: "abstract-signal.png", s: "1440x720", p: `Abstract long-exposure photograph of light trails forming a flowing audio waveform across a dark navy void, cerulean and electric cyan streaks on near-black background, elegant, cinematic, ${PHOTO}` },
];

async function upscale(file) {
  const src = path.join(OUT, file);
  const buf = fs.readFileSync(src);
  const img = sharp(buf);
  const meta = await img.metadata();
  const w = meta.width, h = meta.height;
  const outBuf = await sharp(buf)
    .resize(Math.round(w * 2), Math.round(h * 2), { kernel: "lanczos3" })
    .sharpen({ sigma: 0.6, m1: 0.4, m2: 2.2 })
    .modulate({ saturation: 1.04 })
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();
  fs.writeFileSync(src, outBuf);
  return `${w * 2}x${h * 2}`;
}

(async () => {
  const zai = await ZAI.create();
  const done = [], failed = [];
  for (const j of JOBS) {
    try {
      const res = await zai.images.generations.create({ prompt: j.p, size: j.s });
      const b64 = res?.data?.[0]?.base64;
      if (!b64) throw new Error("no image in response");
      fs.writeFileSync(path.join(OUT, j.f), Buffer.from(b64, "base64"));
      const size = await upscale(j.f);
      done.push(`${j.f} (${size})`);
      console.log(`OK ${j.f} -> ${size}`);
    } catch (e) {
      failed.push(j.f);
      console.error(`FAIL ${j.f}: ${e.message}`);
    }
  }
  console.log(`\nDONE: ${done.length}/${JOBS.length}`);
  if (failed.length) console.log("FAILED:", failed.join(", "));
})();
