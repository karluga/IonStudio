import { useState } from 'react';
import type { Battery, SimulationState } from '../../types';
import { batteries } from '../../data/batteries';

import BatterySelector from './BatterySelector';
import LiveSimulationPanel from './LiveSimulationPanel';
import SimulationControls from './SimulationControls';

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

  const handleAmpsChange = (amps: number) => setCurrentAmps(amps);
  const handleSpeedChange = (multi: number) => setSpeedMultiplier(multi);

  const toggleCharging = () => {
    if (!selectedBattery) return;
    setIsCharging(!isCharging);
  };

  const resetSimulation = () => {
    setIsCharging(false);
    setCurrentAmps(selectedBattery?.recommendedAmps || 1.0);
    setSpeedMultiplier(1);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          IonStudio Virtual Charger
        </h1>
        <p className="text-gray-400">Learn safe charging through real physics & live simulation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Battery Selection */}
        <div className="lg:col-span-5">
          <BatterySelector 
            selectedBattery={selectedBattery} 
            onSelect={setSelectedBattery} 
          />
        </div>

        {/* Center - Live Simulation */}
        <div className="lg:col-span-4">
          <LiveSimulationPanel
            selectedBattery={selectedBattery}
            currentAmps={currentAmps}
            isCharging={isCharging}
            speedMultiplier={speedMultiplier}   // ← Will need to update LiveSimulationPanel too
            onSimulationUpdate={setSimulationState}
          />
        </div>

        {/* Right Column - Controls */}
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
    </div>
  );
}