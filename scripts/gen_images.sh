#!/bin/bash
# DEYOUNG brand image batch · dark cinematic + crimson/gold light, no text
# Art direction: black stage, red energy, gold whisper. All prompts forbid text.
set -u
OUT="/home/z/my-project/public/img"
mkdir -p "$OUT"

gen() {
  local file="$1"; local size="$2"; local prompt="$3"
  if [ -s "$OUT/$file" ]; then echo "SKIP $file (exists)"; return 0; fi
  for attempt in 1 2; do
    echo ">> $file (attempt $attempt)"
    z-ai image -p "$prompt" -o "$OUT/$file" -s "$size" && [ -s "$OUT/$file" ] && return 0
    sleep 2
  done
  echo "FAIL $file"; return 1
}

# 1. Abstract hero texture
gen "abstract-signal.png" "1440x720" "Abstract cinematic render of a flowing voice waveform made of glowing crimson red light ribbons on pure black background, volumetric glow, depth of field, premium tech aesthetic, ultra detailed, no text, no words, no letters"

# 2-5. Industry shots (moody dark premium interiors)
gen "industry-clinic.png" "1152x864" "Modern dental clinic reception interior at night, moody premium interior photography, dark tones with warm accent lighting, clean minimal design, cinematic, photorealistic, no people, no text"
gen "industry-law.png" "1152x864" "Elegant law firm office interior with dark wood and glass, moody cinematic lighting, night scene, premium professional atmosphere, photorealistic, no people, no text"
gen "industry-realestate.png" "1152x864" "Modern real estate agency office with floor to ceiling city view at night, dark cinematic premium photography, warm desk lamps, glass and concrete, photorealistic, no people, no text"
gen "industry-ecommerce.png" "1152x864" "E-commerce operations room at night with rows of glowing screens, dark cinematic premium photography, subtle red accent lights, bokeh depth, photorealistic, no people in focus, no text"

# 6. Team / about
gen "team-studio.png" "1344x768" "Diverse creative team collaborating late in a dark modern studio office, screens glowing, candid energy, cinematic premium photography, red and warm gold light accents, photorealistic, no text"

# 7-9. AI employee personas (dark studio portraits)
gen "agent-reception.png" "1024x1024" "Professional female receptionist wearing a headset, warm smile, seated at modern dark front desk, cinematic studio portrait, black background with subtle red rim light, premium, photorealistic, no text"
gen "agent-sales.png" "1024x1024" "Confident male sales consultant on a phone call in a dark modern office, cinematic portrait, black background, warm gold rim lighting, premium, photorealistic, no text"
gen "agent-support.png" "1024x1024" "Friendly customer support agent with headset typing at a dark workstation, cinematic portrait, black background, subtle red rim lighting, premium, photorealistic, no text"

# 10-13. Testimonial avatars (warm key light on dark)
gen "avatar-1.png" "1024x1024" "Corporate headshot portrait of a smiling black businesswoman, dark background, warm key light, professional, photorealistic, no text"
gen "avatar-2.png" "1024x1024" "Corporate headshot portrait of a smiling middle eastern businessman with glasses, dark background, warm key light, professional, photorealistic, no text"
gen "avatar-3.png" "1024x1024" "Corporate headshot portrait of a smiling latina businesswoman, dark background, warm key light, professional, photorealistic, no text"
gen "avatar-4.png" "1024x1024" "Corporate headshot portrait of a smiling asian businessman, dark background, warm key light, professional, photorealistic, no text"

# 14-15. Abstract tech
gen "network-map.png" "1344x768" "Dark world map network visualization with glowing crimson red connection nodes and arcing lines, black background, premium tech render, high detail, no text"
gen "security-core.png" "1152x864" "Abstract 3D render of a glowing shield core suspended inside a black cube structure, crimson red energy lines, volumetric light, premium tech, no text"

# 16-17. Resource covers
gen "blog-emotion.png" "1152x864" "Abstract macro photograph of an audio speaker cone with red light waves rippling outward, black background, cinematic, premium, no text"
gen "blog-handoff.png" "1152x864" "Abstract render of two hands made of light passing a glowing orb between them, black background, red and gold light, cinematic, premium, no text"

echo "---"
echo "Generated files:"
ls -la "$OUT" 2>/dev/null
