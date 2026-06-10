#!/usr/bin/env python3
"""
bridge.py — Local HTTP bridge server (Cross-platform)
Nhận lệnh từ web app (fetch) và mở terminal mới với CLI + prompt.

Usage: python3 bridge.py [--port 7700]
"""

import json
import os
import platform
import shlex
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 7700
IS_WINDOWS = platform.system() == "Windows"

# Danh sách terminal emulator ưu tiên (Linux)
TERMINALS_LINUX = [
    ["gnome-terminal", "--"],
    ["xterm", "-e"],
    ["konsole", "-e"],
    ["xfce4-terminal", "-e"],
    ["tilix", "-e"],
    ["alacritty", "-e"],
]


def get_display_env():
    """Lấy DISPLAY/WAYLAND từ session đang chạy (Linux)."""
    env = dict(os.environ)
    if IS_WINDOWS:
        return env
    
    if env.get('DISPLAY') or env.get('WAYLAND_DISPLAY'):
        return env
    
    try:
        uid = str(os.getuid())
        for pid_dir in os.listdir('/proc'):
            if not pid_dir.isdigit():
                continue
            try:
                environ_path = f'/proc/{pid_dir}/environ'
                if oct(os.stat(environ_path).st_uid) and str(os.stat(environ_path).st_uid) == uid:
                    with open(environ_path, 'rb') as f:
                        proc_env = dict(e.split('=', 1) for e in f.read().decode('utf-8', errors='ignore').split('\x00') if '=' in e)
                    if proc_env.get('DISPLAY') or proc_env.get('WAYLAND_DISPLAY'):
                        env.update({k: proc_env[k] for k in ('DISPLAY', 'WAYLAND_DISPLAY', 'DBUS_SESSION_BUS_ADDRESS', 'XDG_RUNTIME_DIR') if k in proc_env})
                        return env
            except Exception:
                continue
    except Exception:
        pass
    return env


def find_terminal():
    """Tìm terminal emulator có sẵn trên hệ thống."""
    import shutil
    if IS_WINDOWS:
        # Trên Windows dùng lệnh start của cmd
        return ["cmd", "/c", "start", "cmd", "/k"]
    
    for term in TERMINALS_LINUX:
        if shutil.which(term[0]):
            return term
    return None


def open_terminal(command: str, work_dir: str):
    """Mở terminal mới, cd workDir, chạy CLI command."""
    terminal = find_terminal()
    if not terminal:
        raise RuntimeError("No supported terminal emulator found.")
    
    env = get_display_env()
    env['GEMINI_CLI_TRUST_WORKSPACE'] = 'true'
    
    if IS_WINDOWS:
        # Windows: cd /d path && command
        cd_cmd = f'cd /d "{work_dir}" && ' if work_dir else ""
        # Bọc lệnh để giữ terminal nếu lỗi (Exit code != 0)
        wrapped_cmd = f'{cd_cmd}{command} || (echo. & echo --- & echo [X] Lenh ket thuc voi loi. & pause)'
        # Sử dụng shell=True để lệnh 'start' hoạt động
        subprocess.Popen(wrapped_cmd, env=env, shell=True)
    else:
        # Linux
        term_name = terminal[0]
        cd_cmd = f"cd {shlex.quote(work_dir)} && " if work_dir else ""
        wrapped_cmd = f"{cd_cmd}{command} || {{ echo; echo '---'; echo '❌ Lệnh kết thúc với lỗi (Exit code: $?).'; read -p 'Nhấn Enter để đóng terminal...'; }}"
        
        if term_name == "gnome-terminal":
            cmd = ["gnome-terminal", "--", "bash", "-ic", wrapped_cmd]
        elif term_name == "tilix":
            cmd = ["tilix", "-e", f"bash -ic {shlex.quote(wrapped_cmd)}"]
        else:
            cmd = terminal + ["bash", "-ic", wrapped_cmd]
        
        subprocess.Popen(cmd, env=env)


def pick_directory():
    """Mở folder dialog dùng tkinter (cross-platform)."""
    try:
        import tkinter as tk
        from tkinter import filedialog
        
        root = tk.Tk()
        root.withdraw()  # Ẩn cửa sổ chính
        root.attributes('-topmost', True)
        
        path = filedialog.askdirectory(title="Select working directory")
        root.destroy()
        return path
    except Exception as e:
        print(f"[bridge] Tkinter error: {e}")
        # Fallback nếu không có tkinter (hiếm gặp trên Windows)
        return ""


class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True


class BridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[bridge] {args[0]} {args[1]}")

    def do_OPTIONS(self):
        self._cors()
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path == "/pick-dir":
            self._handle_pick_dir()
        elif self.path == "/run":
            self._handle_run()
        else:
            self.respond(404, {"error": "Not found"})

    def _handle_pick_dir(self):
        try:
            path = pick_directory()
            self.respond(200, {"path": path})
        except Exception as e:
            self.respond(500, {"error": str(e)})

    def _handle_run(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.respond(400, {"error": "Invalid JSON"})
            return

        cli_command = data.get("command", "").strip()
        work_dir    = data.get("workDir", "").strip()

        if not cli_command:
            self.respond(400, {"error": "command is required"})
            return

        try:
            open_terminal(cli_command, work_dir)
            self.respond(200, {"ok": True})
        except Exception as e:
            self.respond(500, {"error": str(e)})

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def respond(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = PORT
    if "--port" in sys.argv:
        idx = sys.argv.index("--port")
        port = int(sys.argv[idx + 1])

    server = ReusableHTTPServer(("127.0.0.1", port), BridgeHandler)
    print(f"[bridge] Running on http://127.0.0.1:{port}")
    print("[bridge] Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[bridge] Stopped.")
