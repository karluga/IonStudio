import { useState, useCallback } from 'react';
import type { Battery, SimulationState, SimulationSnapshot } from '../../types';

import BatterySelector from './BatterySelector';
import LiveSimulationPanel from './LiveSimulationPanel';
import SimulationControls from './SimulationControls';
import SimulationChart, { type SimRun } from './SimulationChart';
import type { RunMeta } from './LiveSimulationPanel';

export default function VirtualCharger() {
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [currentAmps, setCurrentAmps] = useState(1.0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isCharging, setIsCharging] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isCharging: false,
    currentAmps: 0,
    voltage: 0,
    soc: 0,
    timeElapsedMin: 0,
    temperature: 25,
  });

  // Live snapshots for the in-progress run
  const [liveSnapshots, setLiveSnapshots] = useState<SimulationSnapshot[]>([]);

  // Completed run history — newest first
  const [runHistory, setRunHistory] = useState<SimRun[]>([]);

  const handleSimulationUpdate = useCallback((state: SimulationState) => {
    setSimulationState(state);
    if (state.isCharging) {
      setLiveSnapshots(prev => [
        ...prev,
        {
          timeMin: state.timeElapsedMin,
          soc: state.soc,
          voltage: state.voltage,
          temperature: state.temperature,
          amps: state.currentAmps,
        },
      ]);
    }
  }, []);

  const handleRunComplete = useCallback((snapshots: SimulationSnapshot[], meta: RunMeta) => {
    if (snapshots.length < 2) return;
    const run: SimRun = {
      id: `run-${Date.now()}`,
      meta,
      snapshots,
    };
    setRunHistory(prev => [run, ...prev]);
    setLiveSnapshots([]);
    setIsCharging(false);
  }, []);

  const handleAmpsChange = (amps: number) => setCurrentAmps(amps);
  const handleSpeedChange = (multi: number) => setSpeedMultiplier(multi);

  const toggleCharging = () => {
    if (!selectedBattery) return;
    if (isCharging) {
      // Pausing — LiveSimulationPanel will fire onRunComplete with current snapshots
      setIsCharging(false);
    } else {
      setLiveSnapshots([]);
      setIsCharging(true);
    }
  };

  const resetSimulation = () => {
    setIsCharging(false);
    setLiveSnapshots([]);
    setCurrentAmps(selectedBattery?.recommendedAmps || 1.0);
    setSpeedMultiplier(1);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          IonStudio Virtual Charger
        </h1>
        <p className="text-gray-400">Learn safe charging through real physics &amp; live simulation</p>
      </div>

      {/* Main 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <BatterySelector
            selectedBattery={selectedBattery}
            onSelect={(b) => {
              setSelectedBattery(b);
              setCurrentAmps(b.recommendedAmps);
              setIsCharging(false);
              setLiveSnapshots([]);
            }}
          />
        </div>

        <div className="lg:col-span-4">
          <LiveSimulationPanel
            selectedBattery={selectedBattery}
            currentAmps={currentAmps}
            isCharging={isCharging}
            speedMultiplier={speedMultiplier}
            onSimulationUpdate={handleSimulationUpdate}
            onRunComplete={handleRunComplete}
          />
        </div>

        <div className="lg:col-span-3">
          <SimulationControls
            currentAmps={currentAmps}
            isCharging={isCharging}
            speedMultiplier={speedMultiplier}
            onAmpsChange={handleAmpsChange}
            onSpeedChange={handleSpeedChange}
            onToggleCharging={toggleCharging}
            onStop={resetSimulation}
            maxRecommendedAmps={selectedBattery?.recommendedAmps || 2}
            absoluteMaxAmps={selectedBattery?.maxChargeAmps || 5}
          />
        </div>
      </div>

      {/* Chart — full width below */}
      <SimulationChart
        runs={runHistory}
        liveSnapshots={liveSnapshots}
        isCharging={isCharging}
      />
    </div>
  );
}