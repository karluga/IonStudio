import { useEffect, useState } from 'react';
import type { Battery, SimulationState, SimulationSnapshot } from '../../types';

interface LiveSimulationPanelProps {
  selectedBattery: Battery | null;
  currentAmps: number;
  isCharging: boolean;
  speedMultiplier: number;
  onSimulationUpdate: (state: SimulationState) => void;
  onRunComplete: (snapshots: SimulationSnapshot[], meta: RunMeta) => void;
}

export interface RunMeta {
  batteryName: string;
  amps: number;
  cRate: number;
  peakTemp: number;
  totalTimeMin: number;
  finalSoc: number;
}

export default function LiveSimulationPanel({
  selectedBattery,
  currentAmps,
  isCharging,
  speedMultiplier,
  onSimulationUpdate,
  onRunComplete,
}: LiveSimulationPanelProps) {
  const [simulation, setSimulation] = useState<SimulationState>({
    isCharging: false,
    currentAmps: 0,
    voltage: 0,
    soc: 0,
    timeElapsedMin: 0,
    temperature: 25,
  });

  // Accumulate snapshots for the current run
  const [snapshots, setSnapshots] = useState<SimulationSnapshot[]>([]);
  const [peakTemp, setPeakTemp] = useState(25);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isCharging && selectedBattery) {
      interval = setInterval(() => {
        setSimulation(prev => {
          const cRate = currentAmps / selectedBattery.capacityAh;
          const isTooFast = cRate > (selectedBattery.recommendedAmps / selectedBattery.capacityAh) * 1.5;

          // SOC
          const socPerTick = (currentAmps / selectedBattery.capacityAh) * 0.85 * speedMultiplier;
          const newSoc = Math.min(100, prev.soc + socPerTick);

          const progress = newSoc / 100;

          // Joule's Law heat: Q ∝ I² × R × t
          const resistance = selectedBattery.internalResistanceOhm ?? 0.025;
          const tickSeconds = 0.6; // real seconds per tick
          const joulHeat = Math.pow(currentAmps, 2) * resistance * tickSeconds * speedMultiplier;
          // Scale to a sensible °C rise (normalize by capacity so big packs heat slower)
          const heatRise = (joulHeat / selectedBattery.capacityAh) * 1.8;
          // Passive cooling toward ambient (25°C)
          const ambientTemp = 25;
          const cooling = 0.08 * (prev.temperature - ambientTemp);
          const newTemp = Math.min(85, prev.temperature + heatRise - cooling);

          const newVoltage = selectedBattery.nominalVoltage * (0.88 + progress * 0.29);
          const timeAdvanced = 0.6 * speedMultiplier; // minutes

          const finalState: SimulationState = {
            ...prev,
            isCharging: true,
            currentAmps,
            voltage: Number(newVoltage.toFixed(2)),
            soc: Number(newSoc.toFixed(1)),
            timeElapsedMin: Number((prev.timeElapsedMin + timeAdvanced).toFixed(1)),
            temperature: Number(newTemp.toFixed(1)),
          };

          // Record snapshot
          const snap: SimulationSnapshot = {
            timeMin: finalState.timeElapsedMin,
            soc: finalState.soc,
            voltage: finalState.voltage,
            temperature: finalState.temperature,
            amps: currentAmps,
          };
          setSnapshots(s => [...s, snap]);
          setPeakTemp(p => Math.max(p, finalState.temperature));

          // Auto-stop at full charge
          if (newSoc >= 100) {
            onRunComplete(
              [...snapshots, snap],
              {
                batteryName: selectedBattery.name,
                amps: currentAmps,
                cRate: Number(cRate.toFixed(2)),
                peakTemp: Math.max(peakTemp, finalState.temperature),
                totalTimeMin: Number(finalState.timeElapsedMin.toFixed(1)),
                finalSoc: 100,
              }
            );
          }

          onSimulationUpdate(finalState);
          return finalState;
        });
      }, 600);
    } else if (!isCharging) {
      // If we had a partial run with data, save it
      if (snapshots.length > 2 && selectedBattery) {
        const cRate = currentAmps / selectedBattery.capacityAh;
        onRunComplete(snapshots, {
          batteryName: selectedBattery.name,
          amps: currentAmps,
          cRate: Number(cRate.toFixed(2)),
          peakTemp,
          totalTimeMin: Number(simulation.timeElapsedMin.toFixed(1)),
          finalSoc: simulation.soc,
        });
      }

      const resetState: SimulationState = {
        isCharging: false,
        currentAmps: 0,
        voltage: selectedBattery ? selectedBattery.nominalVoltage : 0,
        soc: 0,
        timeElapsedMin: 0,
        temperature: 25,
      };
      setSimulation(resetState);
      setSnapshots([]);
      setPeakTemp(25);
      onSimulationUpdate(resetState);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [isCharging, currentAmps, speedMultiplier, selectedBattery]);

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