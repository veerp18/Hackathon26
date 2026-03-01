# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**911-notebook** is a hackathon project — a cross-platform mobile app (iOS, Android, Web) built with React Native and Expo. The app integrates Supabase for auth/database and includes media/file handling capabilities.

## Development Commands

All commands run from `frontend/911-notebook/`:

```bash
cd frontend/911-notebook

npm start          # Start Expo dev server (interactive platform selection)
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
```

No test runner or linter is configured.

## Architecture

### Structure

```
frontend/911-notebook/   # React Native / Expo app
backend/                 # Not yet implemented
```

### Frontend App Flow

- **Entry:** `index.js` → `registerRootComponent(App)` from expo
- **Root:** `App.js` — currently boilerplate; real screens should be built here or under an `app/` directory (expo-router is installed)
- **Routing:** expo-router is configured as a plugin in `app.json` — use file-based routing under `app/` for navigation

### Key Dependencies

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Auth + PostgreSQL database |
| `expo-router` | File-based navigation |
| `expo-av` | Audio/video recording & playback |
| `expo-file-system` | File read/write |
| `expo-sharing` | Share files externally |
| `expo-secure-store` | Encrypted key-value storage |
| `@react-native-async-storage/async-storage` | Unencrypted local storage |
| `axios` | HTTP client |

### Supabase Integration

Supabase credentials should be stored via `expo-secure-store` (not hardcoded). Initialize the client once and export it for use across the app. `expo-secure-store` is already configured as an Expo plugin in `app.json`.

### Platform Targets

- **iOS:** portrait orientation, tablet supported
- **Android:** adaptive icon configured
- **Web:** favicon configured, react-native-web installed
