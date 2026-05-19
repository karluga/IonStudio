import type { Battery, SimulationState } from '../../types';

interface LiveSimulationPanelProps {
  selectedBattery: Battery | null;
  currentAmps: number;
  speedMultiplier: number;
  ambientTemp: number;
  simulation: SimulationState;
}

export interface RunMeta {
  batteryId: string;
  batteryName: string;
  amps: number;
  cRate: number;
  peakTemp: number;
  totalTimeMin: number;
  finalCharge: number;
  cycleNumber: number;
  completedAt: string;
  capacityHealthPercent: number;
  fireRiskPercent: number;
  endedBy: 'full' | 'manual' | 'dead' | 'fire';
}

export default function LiveSimulationPanel({
  selectedBattery,
  currentAmps,
  speedMultiplier,
  ambientTemp,
  simulation,
}: LiveSimulationPanelProps) {
  if (!selectedBattery) {
    return (
      <div className="glass p-8 rounded-2xl text-center">
        <p className="text-gray-400">Select a battery to begin the simulation</p>
      </div>
    );
  }

  const isOverheating = simulation.temperature > 45;
  const isTooFast = currentAmps > selectedBattery.recommendedAmps * 1.5;
  const resistanceMilliOhm = selectedBattery.internalResistanceOhm * 1000;

  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-accent">Live Simulation</h2>
        <div className="text-sm px-3 py-1 bg-white/10 rounded-full">
          Speed: {speedMultiplier}x
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Battery Charge</span>
            <span className="font-mono font-medium">{simulation.soc}%</span>
          </div>
          <div className="h-5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="charge-progress h-full rounded-full transition-all duration-500"
              style={{ width: `${simulation.soc}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-5 rounded-xl">
            <div className="text-xs text-gray-400">Voltage</div>
            <div className="text-4xl font-mono mt-1">{simulation.voltage}V</div>
          </div>
          <div className="bg-white/5 p-5 rounded-xl">
            <div className="text-xs text-gray-400">Current</div>
            <div className="text-4xl font-mono text-accent">{currentAmps}A</div>
          </div>
          <div className="bg-white/5 p-5 rounded-xl">
            <div className="text-xs text-gray-400">Temperature</div>
            <div className={`text-4xl font-mono ${isOverheating ? 'text-red-500' : ''}`}>
              {simulation.temperature}°C
            </div>
          </div>
          <div className="bg-white/5 p-5 rounded-xl">
            <div className="text-xs text-gray-400">Time Elapsed</div>
            <div className="text-4xl font-mono">{simulation.timeElapsedMin.toFixed(1)} min</div>
          </div>
          <div className="bg-white/5 p-5 rounded-xl">
            <div className="text-xs text-gray-400">Health</div>
            <div className={`text-4xl font-mono ${simulation.capacityHealthPercent < 70 ? 'text-amber-400' : ''}`}>
              {simulation.capacityHealthPercent.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white/5 p-5 rounded-xl">
            <div className="text-xs text-gray-400">Fire Risk</div>
            <div className={`text-4xl font-mono ${simulation.fireRiskPercent > 35 ? 'text-red-400' : ''}`}>
              {simulation.fireRiskPercent.toFixed(0)}%
            </div>
          </div>
        </div>

        {isTooFast && (
          <div className="bg-red-500/10 border border-red-500/40 p-5 rounded-xl">
            <p className="text-red-400 font-medium">Charging too fast</p>
            <p className="text-sm mt-1 text-red-400/90">
              Current through internal resistance makes heat by Joule's law: heat rises with I^2 x R.
              Doubling amps makes roughly four times the heat before cooling can remove it.
            </p>
          </div>
        )}

        {(simulation.isDead || simulation.isOnFire || simulation.temperature > 60) && (
          <div className="bg-amber-500/10 border border-amber-500/40 p-5 rounded-xl">
            <p className="text-amber-300 font-medium">
              {simulation.isOnFire ? 'Thermal runaway event' : simulation.isDead ? 'Battery is no longer usable' : 'Thermal danger zone'}
            </p>
            <p className="text-sm mt-1 text-amber-100/80">
              The cell is modeled as having {resistanceMilliOhm.toFixed(1)} mOhm of internal resistance.
              At high current, that resistance heats the electrodes and electrolyte. If heat generation beats cooling to
              {ambientTemp}°C air, capacity fades faster; at extreme temperature the separator can fail and the pack can ignite.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
