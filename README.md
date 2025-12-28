# KurirTA - Sistem Manajemen Driver dengan WhatsApp Bot

Sistem layanan kurir/driver dengan integrasi WhatsApp Bot untuk menerima pesanan otomatis dari customer.

## Fitur Utama

### 🤖 WhatsApp Bot
- Otomatis capture nomor telepon customer yang chat
- Alur pemesanan interaktif (nama, alamat jemput, tujuan)
- Konfirmasi pesanan
- Notifikasi otomatis ke customer

### 📊 Web Dashboard Admin
- Melihat semua pesanan realtime
- Manajemen driver (CRUD)
- Assign pesanan ke driver manual/otomatis
- Sistem prioritas driver
- Jadwal piket driver
- Statistik pesanan

### 📱 Web Dashboard Driver
- Toggle status On/Off Duty
- Melihat pesanan yang ditugaskan
- Update status pesanan (Terima → Jemput → Antar → Selesai)
- Riwayat pesanan

### ⚡ Sistem Distribusi Otomatis
- Auto-assign pesanan ke driver berdasarkan:
  - Status On Duty
  - Jadwal piket aktif
  - Level prioritas
  - Jumlah order aktif (distribusi merata)

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL dengan Sequelize ORM
- **Frontend:** React.js
- **WhatsApp Bot:** whatsapp-web.js
- **Realtime:** Socket.io

## Instalasi

### Prerequisites
- Node.js v18+
- PostgreSQL
- Chrome/Chromium (untuk WhatsApp Bot)

### 1. Clone & Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Setup Database

Buat database PostgreSQL:
```sql
CREATE DATABASE kurirta;
```

### 3. Konfigurasi Environment

Edit file `.env`:
```env
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kurirta
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Secret
JWT_SECRET=your_secret_key_here

# WhatsApp Bot
BOT_NAME=KurirTA Bot
```

### 4. Seed Database

```bash
node seed.js
```

Ini akan membuat:
- Admin: `admin@kurirta.com` / `admin123`
- 3 Sample Driver

### 5. Jalankan Aplikasi

**Terminal 1 - Backend Server:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

**Terminal 3 - WhatsApp Bot:**
```bash
npm run bot
```

## Cara Pakai WhatsApp Bot

1. Jalankan `npm run bot`
2. Scan QR Code yang muncul dengan WhatsApp Anda
3. Bot siap menerima pesan!

### Perintah Bot:
- `MENU` atau `HELP` - Lihat menu
- `PESAN DRIVER` - Mulai pesan driver
- Ikuti alur chat untuk memasukkan:
  - Nama
  - Alamat jemput
  - Alamat tujuan
  - Catatan (opsional)
- Konfirmasi pesanan

## Alur Sistem

```
Customer Chat WA → Bot Capture Data → Create Order → 
Auto-Assign Driver → Driver Terima → Update Status → Selesai
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order (from WA Bot)
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/assign` - Assign driver

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/available` - Get available drivers
- `PUT /api/drivers/:id` - Update driver
- `PUT /api/drivers/:id/duty` - Toggle duty status

### Shifts
- `GET /api/shifts` - Get all shifts
- `POST /api/shifts` - Create shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift

## Login Credentials

### Admin
- Email: `admin@kurirta.com`
- Password: `admin123`

### Driver
- Email: `andi@kurirta.com` / `budi@kurirta.com` / `citra@kurirta.com`
- Password: `driver123`

## Screenshots

### Login Page
Halaman login untuk Admin dan Driver

### Admin Dashboard
- Statistik pesanan
- Daftar pesanan terbaru
- Quick actions

### Manajemen Driver
- CRUD driver
- Set prioritas
- Toggle On/Off Duty

### Jadwal Piket
- Kalender mingguan
- Tambah/hapus jadwal shift

### Driver Dashboard
- Status On/Off Duty
- Pesanan aktif
- Update status pesanan

## Kontribusi

Pull request welcome! Untuk perubahan besar, silakan buka issue terlebih dahulu.

## Lisensi

MIT
