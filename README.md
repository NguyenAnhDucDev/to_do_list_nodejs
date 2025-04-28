# Todo List App (Node.js, Docker, Prometheus, Grafana, CI/CD)

## 📝 Tổng quan
Đây là ứng dụng Todo List được xây dựng với Node.js, Express, Sequelize (MySQL), hỗ trợ quản lý công việc, phân loại, ưu tiên, deadline, và có hệ thống đăng nhập/đăng ký người dùng. Ứng dụng tích hợp:
- **Docker Compose**: Triển khai toàn bộ stack (Node.js, MySQL, Prometheus, Grafana) dễ dàng.
- **Prometheus & Grafana**: Giám sát, trực quan hóa metrics ứng dụng.
- **CI/CD với GitHub Actions**: Tự động kiểm tra, build, test, build Docker image khi push code.

## 🚀 Hướng dẫn cài đặt & chạy

### 1. Clone dự án
```bash
[git clone https://github.com/<your-username>/<repo-name>.git](https://github.com/NguyenAnhDucDev/to_do_list_nodejs)
cd to_do_list
```

### 2. Chạy bằng Docker Compose
```bash
docker-compose up --build
```
- Ứng dụng Node.js: http://localhost:3001
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- MySQL: localhost:3307 (user: root, pass: examplepassword)

### 3. Đăng nhập mặc định
- Username: `admin`
- Password: `admin123`

### 4. Truy cập metrics Prometheus
- http://localhost:3001/metrics

### 5. Truy cập dashboard Grafana
- Đăng nhập mặc định: `admin` / `admin`
- Thêm data source Prometheus: `http://prometheus:9090`

## 🛠️ Cấu trúc thư mục
```
to_do_list/
├── app.js                # Main server file
├── Dockerfile            # Docker build file
├── docker-compose.yml    # Docker Compose config
├── package.json          # Node.js dependencies
├── prometheus.yml        # Prometheus config
├── init-db.js            # Script khởi tạo DB và user mẫu
├── public/               # Static files (CSS, JS, images)
├── models/               # Sequelize models (User, Todo)
├── views/                # EJS templates (login, register, index)
├── config/               # Cấu hình DB
├── logs/                 # Log files
├── tests/                # Unit tests
└── .github/workflows/    # CI/CD workflow (GitHub Actions)
```

## ⚡ CI/CD với GitHub Actions
- Tự động kiểm tra, test, build Docker image khi push/pull request vào nhánh `main`.
- File workflow: `.github/workflows/ci-cd.yml`

## 📊 Monitoring với Prometheus & Grafana
- Prometheus tự động scrape metrics từ Node.js app (`/metrics`).
- Grafana trực quan hóa dữ liệu metrics, tạo dashboard tuỳ ý.

## 💡 Lưu ý khi phát triển
- **Không copy `node_modules` từ máy thật vào container.** Để Docker tự cài khi build.
- Khi sửa code, chỉ cần restart lại container `node-app`.
- Nếu thêm package mới, vào container và chạy `npm install`.
- Không bật MySQL/XAMPP trên máy thật khi dùng Docker (tránh trùng cổng).

## 🧑‍💻 Đóng góp & mở rộng
- Fork, tạo branch, pull request như các dự án open source khác.
- Có thể mở rộng thêm: email notification, cloud deploy, OAuth, v.v.

---
**Chúc bạn code vui vẻ và quản lý công việc hiệu quả!** 
