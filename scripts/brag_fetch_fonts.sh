#!/bin/bash
# Download brand fonts (latin subset) for the brag composition
set -e
DIR=/home/z/my-project/brag-output/composition/assets/fonts
mkdir -p "$DIR"
cd "$DIR"

fetch() { # family_css_name, weight, outname
  local css
  css=$(curl -s "https://fonts.googleapis.com/css2?family=${1}:wght@${2}&display=swap" -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120")
  # latin block is the last url() before "}" that follows a "/* latin */" comment
  local url
  url=$(echo "$css" | awk '/\/\* latin \*\//{f=1} f && match($0, /url\(([^)]+)\)/, m){print m[1]; exit}')
  if [ -z "$url" ]; then url=$(echo "$css" | grep -o 'https://[^)]*\.woff2' | tail -1); fi
  curl -s -o "${3}.woff2" "$url"
  echo "${3}.woff2  <-  $(basename "$url")"
}

fetch "Sora" "600" "sora-600"
fetch "Sora" "700" "sora-700"
fetch "Sora" "800" "sora-800"
fetch "Inter" "400" "inter-400"
fetch "Inter" "500" "inter-500"
fetch "JetBrains+Mono" "500" "jbmono-500"
fetch "JetBrains+Mono" "700" "jbmono-700"
ls -la
