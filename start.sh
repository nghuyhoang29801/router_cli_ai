#!/usr/bin/env bash
# start.sh — Khởi động bridge server và mở index.html trong trình duyệt

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Dọn dẹp các tiến trình cũ nếu có
echo "[start] Cleaning up existing bridge processes..."
pkill -f bridge.py 2>/dev/null || true

echo "[start] Starting bridge.py on port 7700..."
python3 "$SCRIPT_DIR/bridge.py" &
BRIDGE_PID=$!

sleep 0.5

echo "[start] Opening index.html..."
if command -v xdg-open &>/dev/null; then
  xdg-open "$SCRIPT_DIR/index.html"
elif command -v open &>/dev/null; then
  open "$SCRIPT_DIR/index.html"
fi

echo "[start] Bridge PID: $BRIDGE_PID — Press Ctrl+C to stop."
wait $BRIDGE_PID
