# AI CLI Manager (Local Bridge)

Dự án này cung cấp một giao diện web (Dashboard) để quản lý và khởi chạy các công cụ AI CLI (như Gemini CLI, Kiro CLI, v.v.) trực tiếp từ trình duyệt web trên môi trường Linux và Windows.

## 🚀 Tính năng chính

- **Quản lý danh sách AI**: Thêm, sửa, xóa các AI CLI với các lệnh tương ứng.
- **Theo dõi giới hạn (Cooldown)**: Đánh dấu AI bị giới hạn (Limited) theo thời gian. Tự động chuyển đổi sang AI tiếp theo khả dụng.
- **Khởi chạy Terminal**: Mở một cửa sổ terminal mới (CMD, PowerShell, GNOME Terminal, v.v.) để chạy lệnh AI trực tiếp.
- **Chọn thư mục làm việc**: Tích hợp công cụ chọn thư mục native để thiết lập `working directory`.
- **Ưu tiên (Priority)**: Sắp xếp AI theo mức độ ưu tiên để tự động gợi ý AI thay thế.

## 🛠 Kiến trúc dự án

Dự án bao gồm 2 phần chính:

1.  **Frontend (Web UI)**: Giao diện dashboard quản lý, có thể chạy local hoặc deploy lên Vercel.
2.  **Backend (Python Bridge)**: Một HTTP server chạy tại local để thực thi lệnh hệ thống.

## 📂 Cấu trúc thư mục

```text
/
├── bridge.py           # Server trung gian (Cross-platform)
├── app.js              # Logic xử lý tại frontend
├── index.html          # Giao diện dashboard
├── style.css           # Định dạng CSS
├── install.sh          # Cài đặt tự động cho Linux
├── install.ps1         # Cài đặt tự động cho Windows (PowerShell)
├── start.sh            # Khởi động cho Linux
├── start.bat           # Khởi động cho Windows
└── ...
```

## ⚙️ Yêu cầu hệ thống

- **Python**: Phiên bản 3.x (đã thêm vào PATH).
- **Hệ điều hành**: Linux hoặc Windows 10/11.

## 🌐 Deploy lên Vercel

Bạn có thể đưa giao diện Web này lên Vercel để truy cập từ bất cứ đâu. Bridge Server sẽ tự động nhận diện địa chỉ qua tham số `?bridge=...` trong URL hoặc lưu trữ cục bộ.

## 📖 Hướng dẫn sử dụng cục bộ

### 1. Dành cho Linux
```bash
git clone https://github.com/nghuyhoang29801/router_cli_ai.git && cd router_cli_ai
chmod +x install.sh && ./install.sh
```

### 2. Dành cho Windows
Mở PowerShell với quyền Administrator:
```powershell
git clone https://github.com/nghuyhoang29801/router_cli_ai.git; cd router_cli_ai
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser; .\install.ps1
```

Sau khi cài đặt, bạn sẽ thấy icon **Bridge App** trong menu ứng dụng hoặc trên màn hình Desktop. Chỉ cần mở nó lên để bắt đầu.

## ⚠️ Lưu ý

- Bridge server chỉ lắng nghe tại `127.0.0.1` để đảm bảo an toàn.
- Dữ liệu về danh sách AI và trạng thái cooldown được lưu cục bộ trên trình duyệt (localStorage).
