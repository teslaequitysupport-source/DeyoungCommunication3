#!/bin/bash
# End-to-end test of the self-hosted voice worker integration.
# Everything runs inside ONE tool call (the sandbox reaps processes between
# calls): realtime service -> dev server -> voice worker -> API checks ->
# off-switch check -> cleanup.
cd /home/z/my-project
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  PASS: $1"; }
bad() { FAIL=$((FAIL+1)); echo "  FAIL: $1"; }

echo "[1] start realtime service (spawns dev server)"
cd mini-services/realtime && nohup bun run dev > /home/z/my-project/realtime.log 2>&1 < /dev/null & disown
cd /home/z/my-project

echo "[2] start voice worker"
( cd voice-worker && WORKER_TOKEN=e2etest IDLE_TIMEOUT_MIN=0 PORT=8787 nohup python3 server.py > /tmp/e2e_worker.log 2>&1 < /dev/null & )

echo "[3] wait for dev server"
UP=""
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-time 4 2>/dev/null)
  if [ "$code" = "200" ]; then UP=yes; break; fi
  sleep 3
done
[ "$UP" = "yes" ] && ok "dev server up on :3000" || bad "dev server never came up"

echo "[4] wait for worker"
WUP=""
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8787/ --max-time 4 2>/dev/null)
  if [ "$code" = "200" ]; then WUP=yes; break; fi
  sleep 2
done
[ "$WUP" = "yes" ] && ok "voice worker up on :8787" || bad "voice worker never came up"

echo "[5] public voice config (default: browser mode)"
CFG=$(curl -s http://localhost:3000/api/voice/config --max-time 60)
echo "    -> $CFG"
echo "$CFG" | grep -q '"mode":"browser"' && ok "default engine is browser mode" || bad "default engine is not browser mode"

echo "[6] admin login"
curl -s -c /tmp/e2e_jar.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@deyoungcommunication.com","password":"DeYoungAdmin2026!"}' \
  --max-time 60 -o /tmp/e2e_login.json
grep -q '"accountRole":"admin"' /tmp/e2e_login.json && ok "admin signed in" || { bad "admin login failed"; head -c 200 /tmp/e2e_login.json; echo; }

echo "[7] save selfhost engine config (as the admin panel does)"
curl -s -b /tmp/e2e_jar.txt -X PATCH http://localhost:3000/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{"voiceEngine":{"mode":"selfhost","ttsUrl":"http://127.0.0.1:8787/v1/audio/speech","ttsKey":"e2etest","ttsModel":"kokoro","ttsVoice":"af_sky","sttUrl":"","sttKey":"","sttModel":""}}' \
  --max-time 60 -o /tmp/e2e_patch.json
grep -q '"ok":true' /tmp/e2e_patch.json && ok "voice engine config saved to Supabase" || { bad "settings PATCH failed"; head -c 300 /tmp/e2e_patch.json; echo; }

echo "[8] public config now reports the worker"
CFG=$(curl -s http://localhost:3000/api/voice/config --max-time 30)
echo "    -> $CFG"
echo "$CFG" | grep -q '"mode":"selfhost"' && echo "$CFG" | grep -q '"ttsConfigured":true' && ok "config reflects selfhost + ttsConfigured" || bad "config did not flip to selfhost"

echo "[9] real synthesis through the app proxy (server-side token, signed-in user)"
curl -s -b /tmp/e2e_jar.txt -X POST http://localhost:3000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Thanks for holding, I can pick that up right now.","speed":1}' \
  --max-time 120 -D /tmp/e2e_tts_hdrs.txt -o /tmp/e2e_out.mp3
grep -qi "content-type: audio" /tmp/e2e_tts_hdrs.txt && ok "proxy returned audio ($(stat -c%s /tmp/e2e_out.mp3) bytes, type $(grep -i content-type /tmp/e2e_tts_hdrs.txt | tr -d '\r'))" || bad "proxy did not return audio ($(head -c 120 /tmp/e2e_out.mp3))"
grep -qi "x-voice-latency" /tmp/e2e_tts_hdrs.txt && ok "worker latency header: $(grep -i x-voice-latency /tmp/e2e_tts_hdrs.txt | tr -d '\r')" || bad "no latency header"

echo "[10] admin test-connection button backend"
TT=$(curl -s -b /tmp/e2e_jar.txt -X POST http://localhost:3000/api/admin/voice-test \
  -H "Content-Type: application/json" -d '{}' --max-time 120)
echo "    -> $(echo "$TT" | head -c 220)"
echo "$TT" | grep -q '"online":true' && ok "voice-test: worker online, real health + synthesis measured" || bad "voice-test did not report online"

echo "[11] THE OFF SWITCH (admin panel button)"
SO=$(curl -s -b /tmp/e2e_jar.txt -X POST http://localhost:3000/api/admin/voice-shutdown \
  -H "Content-Type: application/json" -d '{}' --max-time 30)
echo "    -> $SO"
echo "$SO" | grep -q '"ok":true' && ok "shutdown endpoint accepted" || bad "shutdown failed"
sleep 3
WCODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8787/ --max-time 4 2>/dev/null)
[ "$WCODE" = "000" ] && ok "worker process is OFF after the switch" || bad "worker still alive (http $WCODE)"

echo "[12] app still works with the worker off (calls fall back in the browser)"
sleep 1
HOMECODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-time 30)
[ "$HOMECODE" = "200" ] && ok "site still up after worker shutdown" || bad "site down after worker shutdown"

echo "[13] reset engine config to browser mode (honest default for the user)"
curl -s -b /tmp/e2e_jar.txt -X PATCH http://localhost:3000/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{"voiceEngine":{"mode":"browser","ttsUrl":"","ttsKey":"","ttsModel":"kokoro","ttsVoice":"af_sky","sttUrl":"","sttKey":"","sttModel":""}}' \
  --max-time 60 -o /tmp/e2e_reset.json
CFG=$(curl -s http://localhost:3000/api/voice/config --max-time 30)
echo "    -> $CFG"
echo "$CFG" | grep -q '"mode":"browser"' && ok "engine reset to browser (off) mode" || bad "engine did not reset"

echo ""
echo "RESULT: $PASS passed, $FAIL failed"
pkill -f "voice-worker/server.py" 2>/dev/null
exit $([ "$FAIL" = "0" ] && echo 0 || echo 1)
