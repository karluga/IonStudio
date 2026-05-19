interface SimulationControlsProps {
  currentAmps: number;
  isCharging: boolean;
  speedMultiplier: number;
  ambientTemp: number;
  onAmpsChange: (amps: number) => void;
  onSpeedChange: (multiplier: number) => void;
  onAmbientTempChange: (temp: number) => void;
  onToggleCharging: () => void;
  onNewCycle: () => void;
  onReset: () => void;
  maxRecommendedAmps: number;
  absoluteMaxAmps: number;
  disabled?: boolean;
}

export default function SimulationControls({
  currentAmps,
  isCharging,
  speedMultiplier,
  ambientTemp,
  onAmpsChange,
  onSpeedChange,
  onAmbientTempChange,
  onToggleCharging,
  onNewCycle,
  onReset,
  maxRecommendedAmps,
  absoluteMaxAmps,
  disabled = false,
}: SimulationControlsProps) {
  return (
    <div className="glass p-6 rounded-2xl h-fit">
      <h3 className="text-xl font-semibold mb-6 text-accent">Charging Controls</h3>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">
          Charging Current: <span className="text-accent font-mono">{currentAmps.toFixed(1)}A</span>
        </label>
        <input
          type="range"
          min={0.1}
          max={absoluteMaxAmps}
          step={0.1}
          value={currentAmps}
          disabled={disabled}
          onChange={(e) => onAmpsChange(parseFloat(e.target.value))}
          className="w-full accent-cyan-400"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Safe and slow</span>
          <span className="text-amber-400">Recommended: {maxRecommendedAmps}A</span>
          <span>Max risk</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">
          Ambient Cooling Temp: <span className="text-accent font-mono">{ambientTemp}°C</span>
        </label>
        <input
          type="range"
          min={0}
          max={45}
          step={1}
          value={ambientTemp}
          onChange={(e) => onAmbientTempChange(parseInt(e.target.value))}
          className="w-full accent-cyan-400"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Cold room</span>
          <span>Hot garage</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">
          Simulation Speed: <span className="text-accent font-mono">{speedMultiplier}x</span>
        </label>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={speedMultiplier}
          onChange={(e) => onSpeedChange(parseInt(e.target.value))}
          className="w-full accent-cyan-400"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1x real</span>
          <span>50x fast</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onToggleCharging}
          disabled={disabled}
          className={`py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-40 ${
            isCharging
              ? 'bg-red-500/80 hover:bg-red-600'
              : 'bg-accent hover:bg-cyan-400 text-black'
          }`}
        >
          {isCharging ? 'Pause' : 'Start'}
        </button>

        <button
          onClick={onNewCycle}
          disabled={disabled}
          className="py-4 rounded-xl border border-emerald-300/40 hover:bg-emerald-300/10 transition-all disabled:opacity-40"
        >
          New Cycle
        </button>

        <button
          onClick={onReset}
          className="col-span-2 py-3 rounded-xl border border-white/30 hover:bg-white/10 transition-all"
        >
          Reset Live Cycle
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-5 text-center">
        Heat follows I^2 x R, so current changes affect temperature faster than they affect charge.
      </p>
    </div>
  );
}
