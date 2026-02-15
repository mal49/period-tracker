# HerDay Menstrual Tracker

A beautiful, private, and offline-capable menstrual cycle tracker built as a Progressive Web App. All your data stays on your device — no accounts, no servers, no tracking.

## Features

- **Dashboard** — See your current cycle phase, cycle day, and countdown to your next period at a glance
- **Calendar View** — Visual calendar with color-coded period days, predictions, fertile window, and ovulation markers
- **Period Logging** — Log periods with flow intensity (light, medium, heavy, spotting), symptoms, mood, and notes
- **Cycle Predictions** — Automatic prediction of upcoming periods and fertile windows based on your cycle history
- **History** — Browse and edit past period entries
- **Notifications** — Optional reminders before your next expected period
- **Dark Mode** — Supports light and dark themes with system preference detection
- **Data Import/Export** — Back up and restore your data as JSON
- **Onboarding** — Guided first-time setup to configure your cycle defaults
- **Installable PWA** — Install on your home screen and use offline, just like a native app
- **Cute Mascot** — Meet Awa, your friendly cycle companion

## Privacy

HerDay is 100% client-side. All data is stored in your browser's `localStorage`. Nothing is ever sent to a server.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| UI Primitives | Radix UI |
| Icons | Lucide React |
| Date Utilities | date-fns |
| PWA | vite-plugin-pwa (Workbox) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/wawa-period-tracker.git
cd wawa-period-tracker

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` directory, ready to be deployed to any static hosting provider.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── BottomNav.tsx      # Tab navigation bar
│   ├── Calendar.tsx       # Calendar view with cycle visualization
│   ├── Dashboard.tsx      # Home screen with cycle overview
│   ├── History.tsx        # Past entries list
│   ├── LogPeriod.tsx      # Period logging sheet
│   ├── Mascot.tsx         # Awa mascot component
│   ├── Onboarding.tsx     # First-time setup flow
│   └── Settings.tsx       # App settings and data management
├── hooks/
│   ├── useCycle.ts        # Cycle phase calculation and predictions
│   ├── useLocalStorage.ts # Persistent state via localStorage
│   └── useNotifications.ts# Browser notification scheduling
├── types/
│   └── index.ts           # TypeScript type definitions
├── lib/
│   └── utils.ts           # Utility functions
├── App.tsx                # Main app shell with routing
└── index.css              # Global styles
```

## License

This project is for personal use.
