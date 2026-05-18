import type { Battery, SimulationState } from '../../types';

interface PhysicsExplanationPanelProps {
  battery: Battery;
  currentAmps: number;
  simulation: SimulationState;
}

export default function PhysicsExplanationPanel({
  battery,
  currentAmps,
  simulation
}: PhysicsExplanationPanelProps) {
  const recommendedC = battery.recommendedAmps / battery.capacityAh;
  const actualC = currentAmps / battery.capacityAh;
  const isTooFast = actualC > recommendedC * 1.5;

  const cycleReduction = isTooFast && simulation.temperature > 45 
    ? Math.min(45, Math.floor((actualC - recommendedC) * 18 + (simulation.temperature - 45) * 1.2)) 
    : 0;

  return (
    <div className="glass p-6 rounded-2xl">
      <h3 className="text-xl font-bold mb-5 text-accent">Why This Amperage? (Physics Explained)</h3>

      <div className="space-y-5 text-sm">
        <div>
          <div className="font-medium text-gray-300">Chosen Battery:</div>
          <div className="font-mono text-accent">{battery.name} — {battery.cells}S {battery.chemistry}</div>
        </div>

        <div>
          <div className="font-medium text-gray-300">Recommended Charging Current:</div>
          <div className="text-2xl font-semibold text-emerald-400">{battery.recommendedAmps}A ({recommendedC.toFixed(1)}C)</div>
          <p className="text-gray-400 mt-1">
            This is like filling a water tank at a gentle, safe speed. 
            It prevents overheating and maximizes battery lifespan.
          </p>
        </div>

        <div>
          <div className="font-medium text-gray-300">You are currently using:</div>
          <div className={`text-2xl font-semibold ${isTooFast ? 'text-red-400' : 'text-accent'}`}>
            {currentAmps}A ({actualC.toFixed(2)}C)
          </div>
        </div>

        {isTooFast && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
            <p className="text-red-400 font-medium">⚠️ You are stressing the battery</p>
            <p className="text-sm mt-2">
              Charging at {actualC.toFixed(1)}C instead of {recommendedC.toFixed(1)}C is like using a fire hose on a small balloon.
            </p>
            {cycleReduction > 0 && (
              <p className="text-sm mt-2 text-red-400">
                Estimated cycle life reduction: <strong>≈{cycleReduction}%</strong>
              </p>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-white/10">
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Key Properties Explained</div>
          <ul className="space-y-3 text-xs">
            <li><strong>Cells (S):</strong> Number of cells in series. More cells = higher total voltage (like batteries stacked in a line).</li>
            <li><strong>Capacity (Ah):</strong> How much "energy tank" the battery has. 1Ah = 1 amp for 1 hour.</li>
            <li><strong>C-rate:</strong> How fast you charge relative to capacity. 1C = full charge in ~1 hour.</li>
            <li><strong>Temperature:</strong> Heat is the enemy — above 45°C the battery degrades much faster.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}