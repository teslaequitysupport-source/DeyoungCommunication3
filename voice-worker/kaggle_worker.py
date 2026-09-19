# Kaggle cell: turn a free Kaggle worker (GPU or CPU) into the DEYOUNG voice
# worker, reachable from the website through a free Cloudflare quick tunnel.
#
# How to use (Kaggle, free):
#   1. Create a notebook. For cloning quality enable GPU (T4 x2); for Kokoro
#      voices plain CPU is enough and burns quota slower.
#   2. Add this file as a cell (or upload it as a utility script and run it).
#   3. Paste server.py next to it as a second cell file (or upload it as a
#      Kaggle Dataset and fix SERVER_PATH below to /kaggle/input/<name>/server.py).
#   4. Run everything. At the bottom it prints your https trycloudflare URL.
#   5. In the DEYOUNG admin panel: Settings -> Voice engine -> paste the URL
#      as the TTS URL (append /v1/audio/speech), set the same token, save.
#
# OFF SWITCH: the admin panel has a "Shut down worker" button (calls the
# worker's /shutdown endpoint), and the worker auto-sleeps after 15 idle
# minutes by itself. To fully release Kaggle quota also stop the session
# (Kaggle keeps the VM alive as long as the notebook session runs).
import os
import subprocess
import sys
import threading
import time

WORKER_TOKEN = os.environ.get("WORKER_TOKEN", "change-me-now")
ENGINE = os.environ.get("ENGINE", "kokoro")  # "xtts" on GPU for cloning
PORT = 8787
SERVER_PATH = "server.py"  # or /kaggle/input/<dataset-name>/server.py

subprocess.run([sys.executable, "-m", "pip", "install", "-q",
                "fastapi", "uvicorn", "kokoro-onnx", "soundfile", "lameenc"], check=True)

os.makedirs("models", exist_ok=True)

if ENGINE == "kokoro":
    for url, name in [
        ("https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.int8.onnx", "kokoro-v1.0.int8.onnx"),
        ("https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin", "voices-v1.0.bin"),
    ]:
        if not os.path.exists(f"models/{name}"):
            subprocess.run(["wget", "-q", "-O", f"models/{name}", url], check=True)

# Cloudflare quick tunnel: free, no account, public https URL
if not os.path.exists("cloudflared"):
    subprocess.run(["wget", "-q", "-O", "cloudflared",
                    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"], check=True)
    os.chmod("cloudflared", 0o755)

# Run the worker in-process (same cell), so /shutdown only stops the API,
# and the tunnel keeps the URL stable while the session lives.
os.environ["WORKER_TOKEN"] = WORKER_TOKEN
os.environ["ENGINE"] = ENGINE
os.environ["PORT"] = str(PORT)
os.environ["IDLE_TIMEOUT_MIN"] = "15"

tunnel = subprocess.Popen(["./cloudflared", "tunnel", "--url", f"http://127.0.0.1:{PORT}",
                           "--no-autoupdate"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)


def print_url():
    for line in tunnel.stdout:
        print(line.strip())
        if "trycloudflare.com" in line:
            print("\n=================================================")
            print("YOUR WORKER IS LIVE. In the DEYOUNG admin panel set:")
            print(f"  TTS URL:  https://<that-host>/v1/audio/speech")
            print(f"  Token:    {WORKER_TOKEN}")
            print("=================================================\n")


threading.Thread(target=print_url, daemon=True).start()
time.sleep(3)

import importlib.util  # noqa: E402
import uvicorn  # noqa: E402

spec = importlib.util.spec_from_file_location("dy_server", SERVER_PATH)
server_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server_mod)
uvicorn.run(server_mod.app, host="0.0.0.0", port=PORT, log_level="warning")
