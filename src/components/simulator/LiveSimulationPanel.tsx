import { useEffect, useState } from 'react';
import type { Battery, SimulationState } from '../../types';

interface LiveSimulationPanelProps {
  selectedBattery: Battery | null;
  currentAmps: number;
  isCharging: boolean;
  speedMultiplier: number;
  onSimulationUpdate: (state: SimulationState) => void;
}

export default function LiveSimulationPanel({
  selectedBattery,
  currentAmps,
  isCharging,
  speedMultiplier,
  onSimulationUpdate
}: LiveSimulationPanelProps) {
  const [simulation, setSimulation] = useState<SimulationState>({
    isCharging: false,
    currentAmps: 0,
    voltage: 0,
    soc: 0,
    timeElapsedMin: 0,
    temperature: 25,
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isCharging && selectedBattery) {
      // Fixed physics tick rate (every 600ms real time)
      interval = setInterval(() => {
        setSimulation(prev => {
          // === PHYSICS CALCULATION (independent of speed) ===
          const cRate = currentAmps / selectedBattery.capacityAh;
          const isTooFast = cRate > selectedBattery.recommendedAmps / selectedBattery.capacityAh * 1.5;

          // SOC increase per tick (based on real current)
          const socPerTick = (currentAmps / selectedBattery.capacityAh) * 0.85; // ~realistic efficiency
          const newSoc = Math.min(100, prev.soc + socPerTick);

          const progress = newSoc / 100;

          // Temperature rise - purely based on physical stress
          const tempRisePerTick = isTooFast ? 1.9 : 0.65;
          let newTemp = prev.temperature + tempRisePerTick;
          if (newTemp > 58) newTemp = 58;

          const newVoltage = selectedBattery.nominalVoltage * (0.88 + progress * 0.29);

          // === TIME ADVANCEMENT (this is affected by speed multiplier) ===
          const realTimeAdvancedMin = 0.6; // each tick = 0.6 real minutes of charging

          const finalState: SimulationState = {
            ...prev,
            isCharging: true,
            currentAmps,
            voltage: Number(newVoltage.toFixed(2)),
            soc: Number(newSoc.toFixed(1)),
            timeElapsedMin: prev.timeElapsedMin + (realTimeAdvancedMin * speedMultiplier),
            temperature: Number(newTemp.toFixed(1)),
          };

          onSimulationUpdate(finalState);
          return finalState;
        });
      }, 600);
    } else if (!isCharging) {
      const resetState: SimulationState = {
        isCharging: false,
        currentAmps: 0,
        voltage: selectedBattery ? selectedBattery.nominalVoltage : 0,
        soc: 0,
        timeElapsedMin: 0,
        temperature: 25,
      };
      setSimulation(resetState);
      onSimulationUpdate(resetState);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [isCharging, currentAmps, speedMultiplier, selectedBattery, onSimulationUpdate]);

  // ... (rest of the UI stays exactly the same as previous version)

  if (!selectedBattery) {
    return (
      <div className="glass p-8 rounded-2xl text-center">
        <p className="text-gray-400">Select a battery to begin the simulation</p>
      </div>
    );
  }

  const isOverheating = simulation.temperature > 45;
  const isTooFast = currentAmps > selectedBattery.recommendedAmps * 1.5;

  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-accent">Live Simulation</h2>
        <div className="text-sm px-3 py-1 bg-white/10 rounded-full">
          Speed: {speedMultiplier}×
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
              className="charge-progress h-full rounded-full"
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
        </div>

        {isTooFast && (
          <div className="bg-red-500/10 border border-red-500/40 p-5 rounded-xl">
            <p className="text-red-400 font-medium">⚠️ Charging too fast!</p>
            <p className="text-sm mt-1 text-red-400/90">
              High current is causing rapid temperature rise. 
              This is like filling a water tank with a fire hose — it generates too much heat and can permanently damage the battery.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}