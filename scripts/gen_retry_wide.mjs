/** Retry the two wide-format images at a 32-multiple size, then 2x upscale. */
import ZAI from "z-ai-web-dev-sdk";
import sharp from "sharp";
import fs from "fs";

const OUT = "/home/z/my-project/public/img";
const PHOTO = "ultra realistic professional photography, shot on Canon EOS R5, 85mm f/1.8 lens, natural light, photorealistic texture, film grain, high dynamic range, 4K UHD quality, sharp focus, no illustration, no render, no CGI look";

const JOBS = [
  { f: "team-studio.png", p: `Wide cinematic photo of a small modern creative studio team collaborating around a desk with laptops and a large screen showing an audio waveform, dark room with cyan and navy lighting, candid documentary style, ${PHOTO}` },
  { f: "abstract-signal.png", p: `Abstract long-exposure photograph of light trails forming a flowing audio waveform across a dark navy void, cerulean and electric cyan streaks on near-black background, elegant, cinematic, ${PHOTO}` },
];

(async () => {
  const zai = await ZAI.create();
  for (const j of JOBS) {
    try {
      const res = await zai.images.generations.create({ prompt: j.p, size: "1344x768" });
      const b64 = res?.data?.[0]?.base64;
      if (!b64) throw new Error("no image");
      const p = `${OUT}/${j.f}`;
      fs.writeFileSync(p, Buffer.from(b64, "base64"));
      const buf = fs.readFileSync(p);
      const out = await sharp(buf)
        .resize(2688, 1536, { kernel: "lanczos3" })
        .sharpen({ sigma: 0.6, m1: 0.4, m2: 2.2 })
        .modulate({ saturation: 1.04 })
        .png({ quality: 95, compressionLevel: 8 })
        .toBuffer();
      fs.writeFileSync(p, out);
      console.log(`OK ${j.f} -> 2688x1536`);
    } catch (e) {
      console.error(`FAIL ${j.f}: ${e.message}`);
    }
  }
})();
