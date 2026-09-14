# VehicleCare — Vehicle Maintenance Tracker

VehicleCare is a full-stack mobile application built with Laravel 12 (PHP, SQLite, Sanctum) on the backend and Expo (SDK 57, Expo Router, TypeScript) on the frontend.

## Project Structure
```
larvel/
├── backend/     ← Laravel 12 API, PHP 8.2+, SQLite (database/database.sqlite)
└── frontend/    ← Expo (SDK 57), Expo Router, TypeScript (src/app/)
```

---

## 🚀 How to Run the Application

### 1. Start the Backend API Server
Open a terminal in the `backend/` directory and start Laravel listening on all network interfaces (`0.0.0.0`):

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```
> **Note**: Serving on `0.0.0.0` ensures the backend API is reachable from a physical mobile device or emulator on your LAN.

### 2. Updating the API Base URL (Single Source of Truth)
All screens and API clients import the base API URL from **`frontend/src/constants/api.ts`**.

To update the backend URL when your LAN IP address changes:
- Option A: Set the `EXPO_PUBLIC_API_URL` environment variable (e.g., `EXPO_PUBLIC_API_URL=http://192.168.1.100:8000`).
- Option B: Edit `DEFAULT_API_HOST` directly in `frontend/src/constants/api.ts`:
  ```typescript
  const DEFAULT_API_HOST = 'http://192.168.1.100:8000'; // Replace with your computer's LAN IP
  ```

### 3. Start the Frontend App (Expo)
Open a terminal in the `frontend/` directory and start Expo:

```bash
cd frontend
npx expo start
```
You can press `w` to open in browser (Web mode), `a` for Android emulator, or scan the QR code with Expo Go on your mobile phone on the same LAN.

---

## 🛠️ Database Setup (Fresh Re-index)
If you ever need to reset the SQLite database:
```bash
cd backend
php artisan migrate:fresh
php artisan storage:link
```

---

## 📱 Features & Endpoints Implemented
- **Authentication**: Token-based auth via Sanctum (`/api/register`, `/api/login`, `/api/logout`, `/api/me`) stored via `expo-secure-store`.
- **Vehicles**: Full CRUD (`/api/vehicles`) with 2-step onboarding and vehicle switcher.
- **Service Tracker**: Log service records with multi-select performed chips, cost, odometer, and auto-expense creation (`/api/vehicles/{id}/services`).
- **Fuel Tracker**: Log fuel entries with auto-calculated total cost and live fuel efficiency KM/L calculation (`/api/vehicles/{id}/fuel`).
- **Replacements**: Track tyre, battery, brake, and component replacements with warranty & next forecasts (`/api/vehicles/{id}/replacements`).
- **Unified Expenses Ledger**: Consolidated view of fuel, service, replacement, and custom expenses (`/api/vehicles/{id}/expenses`).
- **Aggregated Reminders Feed**: Dynamic feed categorized into Overdue (red), Due Soon (amber), and Upcoming (green) based on odometer and expiration dates (`/api/vehicles/{id}/reminders`).
- **Dashboard & Analytics**: Hero card, financial totals, monthly trend series, avg KM/L, and cost/KM analytics (`/api/vehicles/{id}/dashboard`, `/api/vehicles/{id}/analytics`).
