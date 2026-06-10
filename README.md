# AI CLI Manager (Local Bridge)

Dự án này cung cấp một giao diện web (Dashboard) để quản lý và khởi chạy các công cụ AI CLI (như Gemini CLI, Kiro CLI, v.v.) trực tiếp từ trình duyệt web trên môi trường Linux.

## 🚀 Tính năng chính

- **Quản lý danh sách AI**: Thêm, sửa, xóa các AI CLI với các lệnh tương ứng.
- **Theo dõi giới hạn (Cooldown)**: Đánh dấu AI bị giới hạn (Limited) theo thời gian. Tự động chuyển đổi sang AI tiếp theo khả dụng.
- **Khởi chạy Terminal**: Mở một cửa sổ terminal mới (gnome-terminal, tilix, xterm...) để chạy lệnh AI trực tiếp.
- **Chọn thư mục làm việc**: Tích hợp công cụ chọn thư mục (Zenity) để thiết lập `working directory` cho các lệnh CLI.
- **Ưu tiên (Priority)**: Sắp xếp AI theo mức độ ưu tiên để tự động gợi ý AI thay thế.

## 🛠 Kiến trúc dự án

Dự án bao gồm 2 phần chính:

1.  **Frontend (Web UI)**:
    - `index.html`: Cấu trúc giao diện chính.
    - `style.css`: Định dạng giao diện (Dark mode, Dashboard cards).
    - `app.js`: Logic quản lý trạng thái, lưu trữ dữ liệu vào `localStorage` và giao tiếp với Bridge.
2.  **Backend (Python Bridge)**:
    - `bridge.py`: Một HTTP server (Python `http.server`) chạy tại local (cổng 7700). Nhiệm vụ chính là nhận lệnh từ web và thực thi lệnh hệ thống (mở terminal, mở zenity).

## 📂 Cấu trúc thư mục

```text
/
├── bridge.py           # Server trung gian kết nối Web và Local
├── app.js              # Logic xử lý tại frontend
├── index.html          # Giao diện dashboard
├── style.css           # Định dạng CSS
├── start.sh            # Script khởi động nhanh cả bridge và web
├── bridge-app.desktop  # File shortcut cho Linux desktop
├── bridge.service      # Cấu hình systemd service (tùy chọn)
└── ...
```

## ⚙️ Yêu cầu hệ thống

- **Hệ điều hành**: Linux (đã test trên GNOME, Ubuntu).
- **Python**: Phiên bản 3.x.
- **Phụ trợ**: 
  - `zenity` (để chọn thư mục).
  - Terminal emulator (gnome-terminal, tilix, xterm, konsole...).

## 🌐 Deploy lên Vercel

Bạn có thể đưa giao diện Web này lên Vercel để truy cập từ bất cứ đâu, nhưng **Bridge Server vẫn phải chạy trên máy cục bộ** của bạn để thực thi lệnh.

1.  **Đẩy code lên GitHub**.
2.  **Kết nối dự án với Vercel**: Chọn thư mục gốc của dự án.
3.  **Lưu ý về bảo mật**: Trình duyệt có thể chặn yêu cầu từ trang Web (HTTPS) gọi xuống Local Bridge (HTTP). Tuy nhiên, hầu hết trình duyệt hiện đại cho phép gọi tới `http://127.0.0.1` từ một trang web an toàn.
4.  **IP**: Bạn **không cần đổi IP** trong code. `127.0.0.1` luôn trỏ về máy tính đang mở trình duyệt, nên dù web chạy trên Vercel, nó vẫn sẽ tìm thấy Bridge đang chạy ở máy bạn.

## 📖 Hướng dẫn sử dụng

### 1. Khởi chạy nhanh
```bash
chmod +x start.sh
./start.sh
```

### 2. Cài đặt thủ công
Chạy server bridge:
```bash
python3 bridge.py
```
Sau đó mở file `index.html` hoặc link Vercel của bạn.

### 3. Cài đặt Desktop Shortcut (khuyên dùng)
Để mở ứng dụng nhanh từ menu ứng dụng (như một App thực thụ):

1.  **Cấp quyền thực thi cho script**:
    ```bash
    chmod +x /home/hoangnh/src/project_all_cli/start.sh
    ```
2.  **Chỉnh sửa file `.desktop`**: Mở file `bridge-app.desktop` và đảm bảo các đường dẫn `Exec` trỏ đúng vào vị trí thực tế của file `start.sh` trên máy bạn.
3.  **Copy vào thư mục ứng dụng**:
    ```bash
    cp bridge-app.desktop ~/.local/share/applications/
    ```
4.  **Sử dụng**: Bây giờ bạn có thể nhấn phím Windows (Super), gõ "Bridge App" và nhấn Enter để khởi động cả Server và UI cùng lúc.


### 4. Cấu hình Systemd Service (Tùy chọn)
Nếu bạn muốn bridge luôn chạy ngầm khi khởi động máy:
1. Sửa đường dẫn và user trong `bridge.service`.
2. Copy vào thư mục systemd:
   ```bash
   sudo cp bridge.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable bridge.service
   sudo systemctl start bridge.service
   ```

## ⚠️ Lưu ý

- Bridge server chỉ lắng nghe tại `127.0.0.1` để đảm bảo an toàn.
- Dữ liệu về danh sách AI và trạng thái cooldown được lưu cục bộ trên trình duyệt (localStorage).
# router_cli_ai
