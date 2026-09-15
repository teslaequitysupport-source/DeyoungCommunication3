#!/bin/bash
# DEYOUNG brand image batch · DEEP SIGNAL: navy stage, cerulean/cyan energy, ice accents
# Art direction: deep navy backgrounds, electric blue/cyan light. All prompts forbid text.
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
gen "abstract-signal.png" "1440x720" "Abstract cinematic render of a flowing voice waveform made of glowing cerulean blue and electric cyan light ribbons on deep navy background, volumetric glow, depth of field, premium tech aesthetic, ultra detailed, no text, no words, no letters"

# 2-5. Industry shots (moody dark premium interiors, cool blue light)
gen "industry-clinic.png" "1152x864" "Modern dental clinic reception interior at night, moody premium interior photography, dark navy tones with cool cyan accent lighting, clean minimal design, cinematic, photorealistic, no people, no text"
gen "industry-law.png" "1152x864" "Elegant law firm office interior with dark wood and glass, moody cinematic lighting, night scene, deep blue ambient glow, premium professional atmosphere, photorealistic, no people, no text"
gen "industry-realestate.png" "1152x864" "Modern real estate agency office with floor to ceiling city view at night, dark cinematic premium photography, cool blue city lights, glass and concrete, photorealistic, no people, no text"
gen "industry-ecommerce.png" "1152x864" "E-commerce operations room at night with rows of glowing screens, dark cinematic premium photography, subtle cerulean blue accent lights, bokeh depth, photorealistic, no people in focus, no text"

# 6. Team / about
gen "team-studio.png" "1344x768" "Diverse creative team collaborating late in a dark modern studio office, screens glowing blue, candid energy, cinematic premium photography, cerulean and cyan light accents, photorealistic, no text"

# 7-9. AI employee personas (dark studio portraits, blue rim light)
gen "agent-reception.png" "1024x1024" "Professional female receptionist wearing a headset, warm smile, seated at modern dark front desk, cinematic studio portrait, deep navy background with subtle cyan rim light, premium, photorealistic, no text"
gen "agent-sales.png" "1024x1024" "Confident male sales consultant on a phone call in a dark modern office, cinematic portrait, deep navy background, cerulean blue rim lighting, premium, photorealistic, no text"
gen "agent-support.png" "1024x1024" "Friendly customer support agent with headset typing at a dark workstation, cinematic portrait, deep navy background, subtle cyan rim lighting, premium, photorealistic, no text"

# 10-13. Testimonial avatars (soft cool key light on dark navy)
gen "avatar-1.png" "1024x1024" "Corporate headshot portrait of a smiling black businesswoman, dark navy background, soft cool key light, professional, photorealistic, no text"
gen "avatar-2.png" "1024x1024" "Corporate headshot portrait of a smiling middle eastern businessman with glasses, dark navy background, soft cool key light, professional, photorealistic, no text"
gen "avatar-3.png" "1024x1024" "Corporate headshot portrait of a smiling latina businesswoman, dark navy background, soft cool key light, professional, photorealistic, no text"
gen "avatar-4.png" "1024x1024" "Corporate headshot portrait of a smiling asian businessman, dark navy background, soft cool key light, professional, photorealistic, no text"

# 14-15. Abstract tech
gen "network-map.png" "1344x768" "Dark world map network visualization with glowing cerulean blue connection nodes and arcing cyan lines, deep navy background, premium tech render, high detail, no text"
gen "security-core.png" "1152x864" "Abstract 3D render of a glowing shield core suspended inside a dark cube structure, electric cyan energy lines, volumetric light, deep navy palette, premium tech, no text"

# 16-17. Resource covers
gen "blog-emotion.png" "1152x864" "Abstract macro photograph of an audio speaker cone with cyan light waves rippling outward, deep navy background, cinematic, premium, no text"
gen "blog-handoff.png" "1152x864" "Abstract render of two hands made of light passing a glowing orb between them, deep navy background, cerulean and cyan light, cinematic, premium, no text"

echo "---"
echo "Generated files:"
ls -la "$OUT" 2>/dev/null
