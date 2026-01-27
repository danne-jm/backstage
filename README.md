# Backstage Platform

![Status](https://img.shields.io/badge/status-production-success)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Inertia](https://img.shields.io/badge/Inertia.js-purple)

**Backstage** is a specialized Enterprise Resource Planning (ERP) and E-commerce platform designed for Student Organizations. It replaces the fragmented stack of "Eventbrite + Shopify + Mailchimp + Excel" with a single, unified ecosystem that saves thousands in transaction fees and streamlines volunteer operations.

---

## 🚀 Key Highlights

### 📧 Advanced Communication Engine
Unlike standard e-commerce platforms, Backstage features a **native, fully customizable email distribution system**:
- **Targeted Segmentation:** Send emails to specific groups (e.g., "All Gala Attendees," "Members Only," or "Volunteers").
- **Rich Text & HTML Support:** Compose beautiful newsletters or announcements directly in the admin panel.
- **Dynamic Variable Injection:** Personalize emails with placeholders like `{{ name }}` or `{{ ticket_qr }}`.
- **Transaction Receipts:** Automated, professional HTML order confirmations sent immediately upon payment success.

### 🛡️ Granular RBAC & Guest Access
Security is built into the core with a strict **Role-Based Access Control (RBAC)** system:
- **Role Hierarchy:** Define distinct permissions for *Presidium*, *Board Members*, *Active Members*, and *Volunteers*.
- **Guest Access:** safely invite external auditors or temporary staff with restricted "Guest" roles (e.g., view-only access to specific event stats without seeing financial ledgers or member data).
- **Two-Factor Authentication (2FA):** Mandatory 2FA support for high-privilege accounts to protect member data.

---

## ✨ Core Features

### 🛒 The Store (Public Frontend)
- **Hybrid Cart:** Students can buy a **Digital Event Ticket** and a **Physical Hoodie** in the same transaction.
- **Smart Pricing:** The system automatically detects ESN Card holders (or members) and applies "Member Price" discounts instantly.
- **Split-Domain Architecture:** The Store (`store.domain.com`) allows for high-traffic public access, while the Admin Panel (`backstage.domain.com`) remains isolated and secure.
- **Direct Payments:** Integrated with **SumUp** to minimize transaction fees (saving ~3-5% compared to Eventbrite).

### 🎫 Professional Ticketing
- **Secure QR Codes:** Every ticket generates a cryptographically unique QR code.
- **Built-in PWA Scanner:** No need for expensive scanning hardware. The admin panel includes a mobile-optimized **Ticket Scanner** that uses the phone's camera for rapid entry management.
- **Real-Time Capacity:** Live tracking of check-ins vs. sold tickets to prevent overcrowding.

### 🏢 Office & POS Mode
Designed for the physical "Office Shifts" run by volunteers:
- **Shift Accountability:** Volunteers must "Clock In" and count the cash drawer.
- **Reconciliation:** The system tracks cash vs. card sales per shift, forcing a "End of Shift" count to ensure the treasury balances perfectly.
- **Quick-Sale Interface:** A streamlined POS screen for selling merch and tickets to walk-ins.

### 📦 Inventory & Warehouse
- **Centralized Stock:** Online sales and physical Office sales deduct from the same inventory pool in real-time.
- **Variant Management:** Handle sizes (S, M, L) and colors easily.

---

## 🛠️ Tech Stack

- **Backend:** Laravel 11
- **Frontend:** React (TypeScript) via Inertia.js
- **Styling:** Tailwind CSS & Shadcn UI
- **Database:** MySQL
- **Real-Time:** Laravel Reverb (WebSockets)
- **Queue/Cache:** Redis
- **Mail:** SMTP (Hostinger/Gmail)

---

## 📦 Installation

### Prerequisites
- PHP 8.2+
- Composer
- Node.js & NPM
- MySQL
- Redis

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/yourusername/backstage.git](https://github.com/yourusername/backstage.git)
   cd backstage


Live at: 
- https://laravel.danieljm.dpdns.org
- https://store.danieljm.dpdns.org
