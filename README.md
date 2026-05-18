# IonStudio project

## Folder Structure

Files marked with\* are finished

```
ionstudio/
├── public/
│   └── vite.svg
│   src/
│   ├── assets/                  # Images, icons, logos
│   ├── components/
│   │   ├── ui/                     # Button, Card, Slider, etc.
│   │   ├── common/                 # Header, Navigation, Footer
│   │   ├── simulator/
│   │   │   ├── VirtualCharger.tsx          # Main container
│   │   │   ├── BatterySelector.tsx
│   │   │   ├── ChargerDisplay.tsx
│   │   │   ├── LiveSimulationPanel.tsx
│   │   │   ├── PhysicsExplanationPanel.tsx
│   │   │   └── SimulationControls.tsx
│   │   └── calculator/             # Future: Amperage & charge calculators
│   ├── data/
│   │   ├── batteries.ts
│   │   └── chargers.ts
│   ├── types/         # TypeScript interfaces
│   │   └── index.ts  # Battery, Charger, Simulation types
│   ├── lib/                    # Utilities, formulas, helpers
│   │   └── batteryUtils.ts   # Physics calculations (C-rate, time, power, etc.)
│   ├── pages/
│   │   └── Simulator.tsx
│   ├── styles/                  # Additional CSS if needed
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── tailwind.config.js           # (if needed later)
├── vite.config.ts
├── package.json
└── README.md
```
