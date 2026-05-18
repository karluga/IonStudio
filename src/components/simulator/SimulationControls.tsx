interface SimulationControlsProps {
  currentAmps: number;
  isCharging: boolean;
  speedMultiplier: number;
  onAmpsChange: (amps: number) => void;
  onSpeedChange: (multiplier: number) => void;
  onToggleCharging: () => void;
  onStop: () => void;
  maxRecommendedAmps: number;
  absoluteMaxAmps: number;
}

export default function SimulationControls({
  currentAmps,
  isCharging,
  speedMultiplier,
  onAmpsChange,
  onSpeedChange,
  onToggleCharging,
  onStop,
  maxRecommendedAmps,
  absoluteMaxAmps,
}: SimulationControlsProps) {
  return (
    <div className="glass p-6 rounded-2xl h-fit">
      <h3 className="text-xl font-semibold mb-6 text-accent">Charging Controls</h3>

      {/* Amperage Slider */}
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
          onChange={(e) => onAmpsChange(parseFloat(e.target.value))}
          className="w-full accent-cyan-400"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Safe & Slow</span>
          <span className="text-amber-400">Recommended: {maxRecommendedAmps}A</span>
          <span>Max Risk</span>
        </div>
      </div>

      {/* Speed Multiplier Slider */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">
          Simulation Speed: <span className="text-accent font-mono">{speedMultiplier}×</span>
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
          <span>1× Real</span>
          <span>50× Fast</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Higher speed = faster charging in simulation</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onToggleCharging}
          className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all ${
            isCharging 
              ? 'bg-red-500/80 hover:bg-red-600' 
              : 'bg-accent hover:bg-cyan-400 text-black'
          }`}
        >
          {isCharging ? 'Pause' : 'Start Charging'}
        </button>

        <button
          onClick={onStop}
          className="px-8 py-4 rounded-xl border border-white/30 hover:bg-white/10 transition-all"
        >
          Reset
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-5 text-center">
        Amps = water flow rate.<br />
        Too much flow = heat + damage (see temperature rise)
      </p>
    </div>
  );
}