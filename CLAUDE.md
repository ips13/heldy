# Heldy — Health Tracker

A personal health tracking PWA built with React, TypeScript, Vite, Tailwind CSS, and Recharts.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Recharts** (Area + Bar charts)
- **Lucide React** (icons)
- **date-fns** (date utilities)

## Features

### Blood Pressure Tracking
- Record systolic, diastolic, and pulse readings
- Voice input via Web Speech API ("120 over 80 pulse 72")
- Area and Bar chart views with period selector
- Copy readings with date choice (Entry Date or Today)
- Edit and delete readings (inline via Eye toggle or swipe gestures)
- Categorised badges (Normal, Elevated, High Stage 1/2, Crisis)
- Day-period tracking (Morning, Noon, Evening, Night)

### Blood Sugar Tracking
- Record glucose in mg/dL or mmol/L
- Voice input ("108" or "5.5")
- Area and Bar chart views with reference lines (70/100/126 mg/dL)
- Meal context (Fasting, Before Meal, After Meal, Bedtime, Random)
- Copy readings with date choice (Entry Date or Today)
- Edit and delete readings (inline via Eye toggle or swipe gestures)
- Estimated HbA1c calculation (ADAG formula)
- Categorised badges (Low, Normal, Pre-diabetic, Diabetic)

### History List Interactions
- **Eye toggle** in History header shows/hides inline Copy + Delete buttons
- **Edit button** always visible on each row
- **Swipe left** reveals a Delete panel → triggers ConfirmDeleteModal
- **Swipe right** reveals a Copy panel → triggers CopyDateModal

### Dashboard
- Overview of latest BP and sugar readings
- Recent history tiles with quick navigation

### Settings
- Dark / Light theme toggle
- CSV export for BP and sugar data

### Security
- **Lock screen** with 4-digit passcode (default: **7009**)
- Unlock state persisted in `sessionStorage` (locked again on new browser session)

### PWA (Progressive Web App)
- Installable on iPhone via "Add to Home Screen"
- App icon: `heldy.png` (Gemini-generated) — used for favicon, apple-touch-icon, and manifest
- Manifest at `public/manifest.json`
- `apple-mobile-web-app-capable` meta tag for standalone mode
- Theme colour: `#7c3aed`

## Project Structure

```
src/
  App.tsx                   # Root app shell, tab navigation, lock screen gate
  components/
    BottomSheet.tsx          # Slide-up sheet for add/edit forms
    ConfirmDeleteModal.tsx   # Delete confirmation modal
    CopyDateModal.tsx        # Copy reading — choose Entry Date or Today
    LockScreen.tsx           # PIN lock screen (default passcode: 7009)
    PeriodSelector.tsx       # Filter: 7d / 30d / 3m / 6m / 1y / custom
    StatCard.tsx             # Metric summary card
    SwipeableRow.tsx         # Swipeable list row (left=delete, right=copy)
    VoiceButton.tsx          # Floating mic button
    VoiceInputSheet.tsx      # Voice transcript review sheet
  hooks/
    useSpeech.ts             # Web Speech API hook
  pages/
    BPPage.tsx               # Blood pressure tab
    DashboardPage.tsx        # Overview tab
    SettingsPage.tsx         # Settings + export tab
    SugarPage.tsx            # Blood sugar tab
  types/
    index.ts                 # Shared TypeScript types
  utils/
    export.ts                # CSV export helpers
    health.ts                # Classification, formatting, filtering utilities
    storage.ts               # localStorage CRUD wrappers

public/
  heldy.png                  # App icon (Gemini-generated) — favicon + home screen icon
  manifest.json              # PWA manifest
  apple-touch-icon.png       # Legacy (replaced by heldy.png)
  icon-192.png               # Legacy (replaced by heldy.png)
  icon-512.png               # Legacy (replaced by heldy.png)

scripts/
  generate-icons.mjs         # Generates PNG icons from scratch (Node.js, no deps)
```

## Development

```bash
npm install
npm run dev
```

### Regenerate PWA Icons

```bash
node scripts/generate-icons.mjs
```

## Build

```bash
npm run build
```

## Data Storage

All readings are stored in `localStorage` under:
- `heldy_bp` — BP readings array (JSON)
- `heldy_sugar` — Sugar readings array (JSON)
- `heldy_theme` — UI theme preference

## Passcode

Default lock screen passcode: **7009**

The app prompts for the passcode on every new browser session. The unlock state is kept in `sessionStorage` so refreshing within the same session does not re-lock the app.
