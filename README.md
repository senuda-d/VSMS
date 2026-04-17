#  VSMS: Vehicle Service Management System

<div align="center">

![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)
![MERN Stack](https://img.shields.io/badge/stack-MERN-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)
![Dependabot](https://img.shields.io/badge/dependabot-active-brightgreen?style=for-the-badge)

**A high-performance management solution for modern automotive workshops.**

[Setup Guide](#-setup-instructions) • [Features](#-key-features) • [Architecture](#-system-architecture) • [Security](#-security--maintenance)

</div>

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite 5+), Vanilla CSS, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Tooling** | Dependabot, ESLint, Git |

---

## 🚀 Setup Instructions

### 1️⃣ Clone and Prepare
```bash
git clone https://github.com/senuda-d/VSMS.git
cd VSMS
```

### 2️⃣ Backend Configuration
1. **Navigate**: `cd backend`
2. **Install**: `npm install`
3. **Environment**: Create a `.env` file:
   ```env
   MONGO_URI=your_mongodb_connection_string
   PORT=5000
   ```
4. **Launch**: `npm run dev` (Runs on port 5000)

### 3️⃣ Frontend Configuration
1. **Navigate**: `cd ../frontend`
2. **Install**: `npm install`
3. **Launch**: `npm run dev` (Runs on port 5173)

---

## 💎 Key Features

- **📊 Industrial Dashboard**: Real-time revenue analytics, active booking counts, and inventory status.
- **🛠️ Active Job Bay**: Digital checklist for mechanics with automated billing integration.
- **📦 Smart Inventory**: Quick-adjust quantity controls with automated reorder alerts.
- **📄 Professional Invoicing**: One-click PDF generation with itemized labor and parts.
- **🤖 Service Assistant**: Integrated chatbot for availability checks and customer queries.

---

## 🏛️ System Architecture

The project follows a modular MERN architecture with a focus on clean separation of concerns:

```text
/backend
├── controllers/    # API Logic (CRUD handling)
├── models/         # Database Schemas (Customer, Vehicle, Bill, etc.)
├── routes/         # Express Router definitions
└── server.js      # Main entry point with middleware

/frontend
├── src/
│   ├── assets/    # Industrial UI assets & logos
│   ├── pages/     # Feature-specific modules
│   └── styles/    # Shared CSS variables & industrial theme
└── App.jsx        # Routing & Application Shell
```

---

## 🛡️ Security & Maintenance

- **Automated Updates**: Dependabot is configured to check for `npm` security vulnerabilities daily.
- **Industrial Theme**: Consistent typography and color variables used across all modules.
- **Input Sanitization**: Numeric inputs are sanitized on both frontend and backend.

---
<div align="center">
Developed for the VSMS Project © 2026
</div>
