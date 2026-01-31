# Backstage Platform

![Status](https://img.shields.io/badge/status-production-success)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Inertia](https://img.shields.io/badge/Inertia.js-purple)

**Backstage** is a unified Enterprise Resource Planning (ERP) and E-commerce platform designed to consolidate operations. It replaces the fragmented stack of separate e-commerce, ticketing, mailing, and spreadsheet tools with a single, ecosystem.

By moving to a unified system, organizations save significant resources in both the short term and long run by eliminating redundant subscription fees, reducing manual data entry errors, and streamlining operations. No more scattered data sheets—everything is managed from one place.

---

## 🚀 Key Highlights

### �️ Dual Shop System
Backstage offers a seamless commerce experience across two distinct fronts:
- **Online Store:** A polished, public-facing e-commerce site for customers to purchase tickets and merchandise.
- **Physical Office POS:** A dedicated Point of Sale interface for volunteers or staff to process walk-in transactions, handle cash/card payments, and manage shifts.
Both fronts share the **same inventory**, ensuring real-time stock synchronization.

### 📦 Unified Inventory Management
- **Centralized Control:** Manage all sellables (products, tickets, memberships) from a single dashboard.
- **Rich Data:** Store detailed product information, pricing, and high-resolution images.
- **Variant Support:** Full support for product variants (e.g., Sizes, Colors) with independent stock tracking.
- **Store Manager:** A high-level view of all revenue streams, combining online and physical sales data for total financial visibility.

### 🎫 Professional Ticketing & Scanner
- **Ticket Distributor:** Integrated system using **Google OAuth** for secure and verified ticket distribution.
- **Built-in Scanner:** No need for expensive dedicated hardware. The platform includes a native **Ticket Scanner** accessible via web/mobile that utilizes the device's camera.
- **Secure Entry:** Rapid, secure QR code scanning for event entry management.

### 📧 Advanced Communication Engine
- **Hybrid Mailing:** Capable of sending both standard newsletters and transactional QR code emails.
- **Email Preview:** Visualize your email designs with a dedicated preview feature before sending to ensure perfection.
- **Transactional Consistency:** Automated order confirmations via Web, Email (SMTP), and downloadable PDF receipts.

---

## ✨ Core Features

### 🔐 Security & Access Control (RBAC)
- **Granular Permissions:** Invite team members with specific roles.
- **Guest Access:** Invite external guests (e.g., auditors, temporary event staff) with strictly limited access, such as "Scanning Only" permissions.
- **Optional 2FA:** Two-Factor Authentication is supported and optional for all users to enhance account security.

### � Modern User Experience
- **PWA Support:** Installable as a Progressive Web App (PWA) on mobile devices for an app-like experience.
- **Discount Codes:** comprehensive discount tracking system that works across all sellables.
- **Payments:** Native integration with **SumUp** for reliable and low-fee transaction processing.

---

## 🛠️ Tech Stack

- **Backend:** Laravel 11
- **Frontend:** React (TypeScript) via Inertia.js
- **Styling:** Tailwind CSS & Shadcn UI
- **Database:** MySQL
- **Real-Time:** Laravel Reverb (WebSockets)
- **Queue/Cache:** Redis

---

## 📦 Installation & Production Setup

### 1. Prerequisites
Ensure your server meets these requirements before starting:
- **OS**: Ubuntu 22.04 LTS / Debian 11+
- **PHP**: 8.2 or 8.3
  - Extensions: `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `gd`, `intl`, `mbstring`, `mysql`, `openssl`, `pcntl`, `pdo`, `redis`, `xml`, `zip`
- **Database**: MySQL 8.0+ or MariaDB 10.6+
- **Cache/Queue**: Redis Server (`sudo apt install redis-server`)
- **Process Manager**: Supervisor (`sudo apt install supervisor`)
- **Node.js**: v18+ & NPM

### 2. Deployment
Clone the repo and install dependencies:
```bash
# 1. Clone
git clone https://github.com/danne-jm/backstage.git
cd backstage

# 2. Install Backend Deps
composer install --optimize-autoloader --no-dev

# 3. Install Frontend Deps & Build
npm install
npm run build
```

### 3. Configuration
Set up your environment variables:
```bash
cp .env.example .env
php artisan key:generate
```
**Critical `.env` Settings:**
- `APP_URL`: Your full domain (e.g., `https://backstage.example.com`)
- `DB_*`: Database credentials (ensure DB exists)
- `REDIS_*`: Redis connection (default is usually sufficient)
- `SUMUP_*`: (Optional) SumUp API keys for payments
- `REVERB_*`: WebSockets (Ensure `REVERB_HOST` matches your domain or IP)

Run migrations:
```bash
php artisan migrate --seed
```

### 4. Background Services (Crucial)
This application relies on background workers for emails, tickets, and real-time sockets. We use a unified Supervisor setup.

1. **Configure Paths**:
   - Open `backstage.service` and `backstage_supervisor.conf` in the project root.
   - **ACTION REQUIRED**: Replace `/home/{username}/...` with **your actual project path**.
   - **ACTION REQUIRED**: Replace `user={username}` with **your actual system user**.

2. **Install Service**:
   ```bash
   # Copy systemd unit
   sudo cp backstage.service /etc/systemd/system/

   # Reload and start
   sudo systemctl daemon-reload
   sudo systemctl enable backstage
   sudo systemctl start backstage
   ```

3. **Verify Health**:
   ```bash
   sudo systemctl status backstage
   ```
   You should see `Active: active (running)`. This service limits itself to your project folder and handles the Queue Worker, Scheduler, and WebSocket server automatically.

### 5. Web Server (Nginx)
Point your web server root to the `/public` directory.
```nginx
server {
    listen 80;
    server_name backstage.domain.com store.domain.com;
 
    index index.php;
 
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
 
    # ... PHP-FPM configuration ...
}
```

---

## Live Demo
https://laravel.danieljm.dpdns.org

https://store.danieljm.dpdns.org