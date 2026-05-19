import type { Battery } from '../../types';
import { batteries } from '../../data/batteries';

interface BatterySelectorProps {
  selectedBattery: Battery | null;
  onSelect: (battery: Battery) => void;
  onOpenScenarios: (battery: Battery) => void;
}

export default function BatterySelector({ selectedBattery, onSelect, onOpenScenarios }: BatterySelectorProps) {
  return (
    <div className="glass p-6 rounded-2xl">
      <h2 className="text-2xl font-bold mb-4 text-accent">Select Battery</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-2">
        {batteries.map((battery) => (
          <div
            key={battery.id}
            onClick={() => onSelect(battery)}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
              selectedBattery?.id === battery.id
                ? 'border-accent bg-accent/10'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            <div className="font-semibold">{battery.name}</div>
            <div className="text-sm text-gray-400 mt-1">
              {battery.cells}S • {battery.capacityAh}Ah • {battery.chemistry}
            </div>
            <div className="text-xs mt-2 text-gray-500 space-y-1">
              <div>Recommended: <span className="text-accent font-medium">{battery.recommendedAmps}A</span></div>
              <div>Expected life: <span className="text-gray-300">{battery.expectedCycleLife.toLocaleString()} cycles</span></div>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenScenarios(battery);
              }}
              className="mt-3 w-full rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/15"
            >
              Charge cycle scenarios
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
