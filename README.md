# HabitFlow 📱⚡

A full-stack, production-grade Habit Tracker mobile application built with **React Native (Expo)**, **Node.js (Express)**, and **MongoDB Atlas**.

---

## 🌟 Features

### Mobile Client (React Native / Expo)
- **Modern Stationery Design**: Warm paper aesthetic with seamless Light and Dark mode support.
- **Interactive Habit Dashboard**:
  - Daily progress ring and bar calculating today's completion percentage.
  - Motivational status messaging based on real-time completion.
  - Interactive habit cards featuring icon pickers, color accents, and streak indicators.
- **Optimistic Check-In Toggle**: Real-time feedback with animated checkmarks via `react-native-reanimated` and background sync via TanStack Query.
- **Detailed Habit Analytics**:
  - Current streak and longest streak records.
  - 30-day completion rate progress bar.
  - 90-day activity heatmap grid.
- **Weekly Trends**: 7-day completion bar chart visualizing habit consistency over time.
- **Local Smart Reminders**: Daily scheduled device notifications powered by `expo-notifications`.
- **Session Persistence**: Secure token management with `expo-secure-store` and automatic 401 interception.

### Backend API (Express / MongoDB Atlas)
- **JWT Authentication**: Token-based authentication with 30-day expiry and bcrypt password encryption.
- **Timezone-Resilient Streak Engine**: Pure functional streak logic accounting for late check-ins and timezone differences (default `Asia/Kolkata`).
- **Resource Ownership & Security**: Strict user-level data isolation, Helmet headers, and CORS enabled.
- **Cascade Deletions**: Deleting a habit automatically cleans up all associated check-in documents.
- **Health Checks & Deployment Ready**: `/health` and `/api/health` monitoring endpoints configured for zero-downtime hosting.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Mobile Frontend** | React Native, Expo SDK 52, Expo Router v4, TypeScript |
| **State & Networking** | TanStack React Query v5, Axios |
| **Storage & Security** | Expo SecureStore, JWT |
| **UI & Graphics** | React Native SVG, React Native Reanimated, Expo Vector Icons |
| **Notifications** | Expo Notifications |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Security & Utilities**| Helmet, CORS, Express Validator, Morgan, Bcryptjs |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert`), Supertest |

---

## 📁 Repository Structure

```
├── app/                              # Expo Router file-based routing
│   ├── (auth)/                       # Authentication screens (Login, Register)
│   ├── (tabs)/                       # Bottom tabs (Today, Stats, Profile)
│   ├── habit/                        # Habit flows (New, Detail, Edit)
│   └── _layout.tsx                   # App providers (Auth, Theme, QueryClient)
├── src/                              # Client-side core logic
│   ├── api/                          # Axios client & typed endpoint modules
│   ├── components/                   # Reusable UI widgets
│   ├── context/                      # AuthContext & ThemeContext
│   ├── theme/                        # Colors, typography, spacing tokens
│   └── utils/                        # Date helpers & notification scheduler
├── config/                           # MongoDB connection configuration
├── controllers/                      # Express route controllers
├── middleware/                       # Auth & central error handler
├── models/                           # Mongoose schemas (User, Habit, CheckIn)
├── routes/                           # API route definitions
├── test/                             # Automated test suite (41 tests)
├── utils/                            # Core streak algorithm
├── app.json                          # Expo project configuration
├── eas.json                          # Expo Application Services build configuration
├── postman_collection.json           # Comprehensive Postman collection
├── server.js                         # API server entry point
└── package.json                      # Project dependencies & scripts
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Backend Configuration
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/habittracker?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_habit_tracker_mobile_app_prod_2026
JWT_EXPIRE=30d
DEFAULT_TIMEZONE=Asia/Kolkata

# Mobile Client Configuration
EXPO_PUBLIC_API_URL=https://habitflow-backend.onrender.com/api
```

---

## 🚀 Getting Started

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/RonitkumarSoni/HabitFlow.git
cd HabitFlow

# Install dependencies
npm install
```

### 2. Run the Backend Server
```bash
# Start server in development mode
npm run server:dev

# Start server in production mode
npm run server
```

### 3. Run the Mobile App
```bash
# Start Metro bundler
npx expo start
```
- Press **`a`** for Android Emulator.
- Press **`w`** for Web preview.
- Scan the QR code using the **Expo Go** app on your physical device.

---

## 📡 API Reference

All backend endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user and receive JWT |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and receive JWT |
| `GET` | `/api/auth/me` | Protected | Fetch authenticated user profile |

### Habits
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/habits` | Protected | Create a new daily habit |
| `GET` | `/api/habits` | Protected | List active habits with streak & completion states |
| `GET` | `/api/habits/:id` | Protected | Retrieve specific habit details |
| `PUT` | `/api/habits/:id` | Protected | Update habit metadata or reminder time |
| `DELETE` | `/api/habits/:id` | Protected | Delete habit and cascade remove check-ins |
| `PATCH` | `/api/habits/:id/archive` | Protected | Toggle archive status |

### Check-Ins
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/habits/:id/toggle` | Protected | Toggle check-in state for a date (`YYYY-MM-DD`) |
| `GET` | `/api/habits/:id/checkins` | Protected | Retrieve check-in history across date ranges |

### Analytics
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stats/overview` | Protected | Overall completion rate, totals, and longest streak |
| `GET` | `/api/stats/weekly` | Protected | 7-day completion breakdown |
| `GET` | `/api/habits/:id/stats` | Protected | Habit-specific 30-day rate and 90-day heatmap data |

---

## 🧪 Testing

The backend includes a test suite covering streak logic, controller behavior, cascade operations, and input validation:

```bash
# Execute backend test suite
npm test

# Type-check frontend TypeScript
npx tsc --noEmit
```

---

## 📦 Production Builds (Android APK)

The project includes an `eas.json` configuration with an APK preview profile:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Build standalone Android APK
eas build -p android --profile preview
```

---

## 📄 License

This project is licensed under the MIT License.
