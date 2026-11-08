# HabitFlow — Production-Ready Habit Tracker 📱⚡

**HabitFlow** is a modern, production-ready full-stack Habit Tracking application featuring a **React Native (Expo)** mobile frontend with an **Express + MongoDB Atlas** backend.

Designed with an aesthetic inspired by warm paper/editorial stationery, smooth micro-interactions, optimistic updates, and persistent streak tracking.

---

## 🏗️ Architecture Overview

```
├── app/                              # Expo Router file-based navigation
│   ├── (auth)/                       # Authentication route group
│   │   ├── _layout.tsx               # Auth layout (stack)
│   │   ├── login.tsx                 # Login screen (validation, loading states)
│   │   └── register.tsx              # Registration screen (auto-login)
│   ├── (tabs)/                       # Main bottom tab navigator
│   │   ├── _layout.tsx               # Tab bar configuration & custom icons
│   │   ├── index.tsx                 # Today (Home): Progress ring, habit list, check toggle
│   │   ├── stats.tsx                 # Stats: Overview cards, 7-day weekly bar chart
│   │   └── profile.tsx               # Profile: User info, dark mode switch, logout
│   ├── habit/
│   │   ├── new.tsx                   # Add Habit modal (color/icon picker, reminder)
│   │   ├── [id].tsx                  # Habit Detail (streaks, 30-day rate, 90-day heatmap)
│   │   └── edit/[id].tsx             # Edit Habit modal (update, archive, cascade delete)
│   └── _layout.tsx                   # Root layout (Auth, Theme, QueryClient providers)
├── src/
│   ├── api/                          # Axios client & typed API resource modules
│   │   ├── client.ts                 # Interceptors: Bearer token, x-timezone, 401 auto-logout
│   │   ├── auth.ts                   # Auth endpoints
│   │   ├── habits.ts                 # Habit CRUD, toggle check-in, range history
│   │   └── stats.ts                  # Overview, weekly trends & habit stats
│   ├── context/
│   │   ├── AuthContext.tsx           # Authentication state, SecureStore token persistence
│   │   └── ThemeContext.tsx          # Light (warm linen) & Dark mode theme provider
│   ├── components/                   # Reusable UI widgets
│   │   ├── Button.tsx                # Pill button with loading spinner & variants
│   │   ├── Input.tsx                 # Floating input with inline errors & password eye
│   │   ├── Card.tsx                  # Rounded paper surface container
│   │   ├── HabitCard.tsx             # Interactive habit card with spring check toggle
│   │   ├── ProgressRing.tsx          # SVG circular ring + linear progress bar
│   │   ├── HeatmapGrid.tsx           # 90-day calendar contribution matrix
│   │   └── EmptyState.tsx            # Illustrated empty state with CTA
│   ├── theme/                        # Design system tokens (colors, typography, spacing)
│   └── utils/
│       ├── date.ts                   # Date formatting, greeting generator, time parsing
│       └── notifications.ts          # Local daily notifications scheduler
├── config/
│   └── db.js                         # MongoDB Atlas connection & connection events
├── controllers/                      # Backend Express business logic
│   ├── authController.js
│   ├── habitController.js
│   ├── checkInController.js
│   └── statsController.js
├── middleware/                       # Backend middlewares (auth, central errorHandler, validator)
├── models/                           # Mongoose schemas (User, Habit, CheckIn)
├── test/                             # 41 automated backend tests across 9 suites
├── utils/
│   └── streak.js                     # Pure streak calculation functions
├── app.json                          # Expo configuration & notification plugin
├── eas.json                          # EAS build config (preview APK profile)
├── package.json                      # Unified dependencies & npm scripts
└── server.js                         # Express server entry point
```

---

## 🎨 Design System

- **Light Mode Background**: `#F5F3EE` (Warm linen paper)
- **Dark Mode Background**: `#121316` (Deep ink paper)
- **Signature Emerald**: `#0B7A5E` / Tint `#E3F1EC`
- **Streak Flame**: `#E4572E` / Tint `#FBE9E3`
- **Typography**: Clean system typography with high legibility and hierarchy.
- **Micro-interactions**: Spring-physics animated checkboxes using `react-native-reanimated`.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```env
# Backend Server Configuration
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/habittracker?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_habit_tracker_mobile_app_prod_2026
JWT_EXPIRE=30d
DEFAULT_TIMEZONE=Asia/Kolkata

# Expo Mobile Frontend (Publicly accessible backend URL)
EXPO_PUBLIC_API_URL=https://habitflow-backend.onrender.com/api
```

> **Note**: For local testing between an Android emulator / physical device and a local server, configure `EXPO_PUBLIC_API_URL` to your machine's LAN IP (e.g. `http://192.168.1.5:5000/api`) or your deployed Render URL. Do **not** use `localhost` for physical devices.

---

## 🚀 Running the Project

### 1. Start the Express Backend Server
```bash
# Production start
npm run server

# Or development mode with auto-reload
npm run server:dev
```

### 2. Start the Expo React Native App
```bash
# Start Metro bundler
npx expo start
```

Press:
- **`a`** to open on Android Emulator or connected USB device.
- **`w`** to open in Web Browser.
- Scan the terminal QR code with the **Expo Go** app on your phone.

---

## 📦 Building Android APK (`eas.json`)

To generate a standalone installable Android APK without Google Play Console setup:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Run the APK preview build:
   ```bash
   eas build -p android --profile preview
   ```
4. Once completed, EAS will provide a direct download link for your `HabitFlow.apk`!

---

## 🧠 Key Viva / Interview Concepts Explained

### 1. How does the Streak Calculation work?
- Streak calculation is implemented as **pure functions** in [`utils/streak.js`](file:///c:/Users/ADMIN/OneDrive/Desktop/diwali_assigmnet/utils/streak.js).
- **`currentStreak`**: Counts consecutive days completed ending today. If today has **not** been completed yet, the count starts from **yesterday**. This guarantees a user's streak isn't prematurely broken during an active day before they have a chance to complete it!
- **`longestStreak`**: Deduplicates dates, sorts them chronologically in UTC, walks through consecutive differences (`diff == 1`), and maintains the global maximum run.
- **Timezone Safety**: Dates are strictly stored and queried in `"YYYY-MM-DD"` format. The client sends its local date and timezone header (`x-timezone`), preventing UTC midnight rollover discrepancies.

### 2. How does Optimistic Check-In Toggle work in the Mobile App?
In [`app/(tabs)/index.tsx`](file:///c:/Users/ADMIN/OneDrive/Desktop/diwali_assigmnet/app/(tabs)/index.tsx), we use TanStack React Query's `useMutation` with `onMutate`:
1. When the user taps the checkbox, `onMutate` immediately updates the local React Query cache and increments/decrements the streak count and `todayDone` state.
2. The user sees an instant visual checkmark and spring animation without waiting for network latency.
3. If the server request succeeds, the cache is refreshed via `onSettled`.
4. If the server request fails (e.g. network disconnect), `onError` seamlessly rolls back to the previous snapshot.

### 3. How is Authentication Persisted & Protected?
1. The JWT token returned from `/api/auth/login` or `/api/auth/register` is encrypted on device using `expo-secure-store`.
2. On app launch, `AuthContext` reads the token and calls `/api/auth/me` to restore the user session.
3. An Axios request interceptor attaches `Authorization: Bearer <token>` to every request.
4. An Axios response interceptor monitors for `401 Unauthorized`. If a token expires or becomes invalid, it deletes the token from `SecureStore` and redirects the user to the login screen.

### 4. How do Local Notifications work?
In [`src/utils/notifications.ts`](file:///c:/Users/ADMIN/OneDrive/Desktop/diwali_assigmnet/src/utils/notifications.ts):
- When a habit is saved with a `reminderTime` (e.g. `08:00`), `scheduleHabitReminder` schedules a recurring daily notification via `expo-notifications`.
- When a habit is edited, archived, or deleted, `cancelHabitReminder` removes the scheduled trigger.

---

## 🧪 Testing

The backend includes a comprehensive 41-test automated suite covering authentication, streak math, habits CRUD, cascade deletes, error handling, and stats:
```bash
npm test
```
TypeScript compilation check for the frontend:
```bash
npx tsc --noEmit
```
Both pass with **0 errors and 0 warnings**.
