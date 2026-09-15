#!/bin/bash
# Sweep all marketing/app routes: every URL must return 200.
ROUTES="/ /product /product/ai-employees /product/voice /product/conversations /product/channels /product/knowledge /product/automations /product/integrations /solutions /solutions/individuals /solutions/business /solutions/agencies /voice-studio /developers /resources /resources/guides /resources/documentation /resources/changelog /pricing /security /about /contact /login /signup /legal/privacy /legal/terms /app /admin"
pass=0; fail=0
for r in $ROUTES; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$r" --max-time 15)
  if [ "$code" = "200" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL $r -> $code"; fi
done
echo "HTTP: $pass pass / $fail fail of $((pass+fail)) pages"
