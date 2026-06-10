#!/usr/bin/env bash
# install.sh — Tự động cấu hình và cài đặt Bridge App shortcut

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_FILE="$SCRIPT_DIR/bridge-app.desktop"
START_SCRIPT="$SCRIPT_DIR/start.sh"

echo "[install] Đang cấu hình AI CLI Manager tại: $SCRIPT_DIR"

# 1. Cấp quyền thực thi
chmod +x "$START_SCRIPT"
chmod +x "$SCRIPT_DIR/bridge.py"
echo "[install] ✓ Đã cấp quyền thực thi cho các script."

# 2. Cập nhật đường dẫn trong file .desktop
if [ -f "$DESKTOP_FILE" ]; then
    # Thay thế dòng Exec và Icon bằng đường dẫn tuyệt đối
    sed -i "s|^Exec=.*|Exec=/usr/bin/bash $START_SCRIPT|g" "$DESKTOP_FILE"
    sed -i "s|^Icon=.*|Icon=$SCRIPT_DIR/manager.png|g" "$DESKTOP_FILE"
    echo "[install] ✓ Đã cập nhật đường dẫn Exec và Icon trong file .desktop."
else
    echo "[install] ⚠ Không tìm thấy file bridge-app.desktop!"
    exit 1
fi

# 3. Copy vào thư mục ứng dụng của người dùng
APP_DIR="$HOME/.local/share/applications"
mkdir -p "$APP_DIR"
cp "$DESKTOP_FILE" "$APP_DIR/"
echo "[install] ✓ Đã cài đặt shortcut vào $APP_DIR."

echo ""
echo "🎉 Cài đặt hoàn tất!"
echo "Giờ bạn có thể tìm 'Bridge App' trong menu ứng dụng (nhấn phím Windows/Super và gõ tìm kiếm)."
echo "Lưu ý: Đảm bảo bạn đã cài đặt python3 và zenity trước khi chạy."
