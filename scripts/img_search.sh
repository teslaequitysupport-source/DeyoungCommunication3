#!/usr/bin/env bash
# Real-photography search for DEYOUNG site images (replaces AI-generated art).
# Runs z-ai image-search in small parallel batches; saves JSON per slot.
set -u
OUT=/tmp/imgsearch
mkdir -p "$OUT"

SLOTS=(
  agent-reception
  agent-sales
  agent-support
  avatar-1
  avatar-2
  blog-emotion
  blog-handoff
  industry-clinic
  industry-ecommerce
  industry-law
  industry-realestate
  network-map
  security-core
  team-studio
  abstract-signal
)

declare -A QUERIES=(
  [agent-reception]="professional female receptionist wearing headset smiling in a bright modern office"
  [agent-sales]="confident male sales consultant talking on the phone in a modern office"
  [agent-support]="friendly female customer support agent with headset working at her computer"
  [avatar-1]="professional business team having a meeting in a modern office, photography"
  [avatar-2]="young woman freelancer working on a laptop in a home office, smiling, photography"
  [blog-emotion]="close up of a woman talking on her smartphone, natural light, photography"
  [blog-handoff]="two business colleagues shaking hands in an office, photography"
  [industry-clinic]="modern medical clinic reception interior, photography"
  [industry-ecommerce]="small business owner packing parcels in a small warehouse, photography"
  [industry-law]="elegant law office interior with bookshelves, photography"
  [industry-realestate]="real estate agent showing an apartment to a young couple, photography"
  [network-map]="abstract blue glowing network of lights, technology, photography"
  [security-core]="modern data center server room with blue lights, photography"
  [team-studio]="startup team collaborating around a desk in a modern studio office, photography"
  [abstract-signal]="abstract blue light streaks long exposure, sound wave concept, photography"
)

run_slot() {
  local slot="$1"
  z-ai image-search -q "${QUERIES[$slot]}" -c 3 --gl us --no-rank -o "$OUT/$slot.json" >"$OUT/$slot.log" 2>&1
}

# batches of 3
for ((i = 0; i < ${#SLOTS[@]}; i += 3)); do
  batch=("${SLOTS[@]:i:3}")
  for slot in "${batch[@]}"; do
    [ -s "$OUT/$slot.json" ] && continue
    run_slot "$slot" &
  done
  wait
  echo "batch done: ${batch[*]}"
done
echo "done: $(ls "$OUT"/*.json 2>/dev/null | wc -l) json files"
