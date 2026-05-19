import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Battery } from '../../types';
import type { BatteryHealthPoint } from './SimulationChart';

type ScenarioId = 'always-full' | 'balanced' | 'low-amps' | 'recommended' | 'amps-1-5' | 'amps-2';

interface ScenarioDefinition {
  id: ScenarioId;
  title: string;
  chargeTarget: number;
  ampMultiplier: number;
  voltageStress: number;
  lifeMultiplier: number;
  description: string;
}

interface ScenarioResult {
  scenario: ScenarioDefinition;
  points: BatteryHealthPoint[];
}

interface ChargeCycleScenariosModalProps {
  battery: Battery;
  onClose: () => void;
}

const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'always-full',
    title: 'Always 100%',
    chargeTarget: 100,
    ampMultiplier: 1,
    voltageStress: 1.15,
    lifeMultiplier: 0.9,
    description: 'Full-charge storage keeps cell voltage high, so electrolyte side reactions slowly consume usable capacity.',
  },
  {
    id: 'balanced',
    title: '20-80%',
    chargeTarget: 80,
    ampMultiplier: 0.9,
    voltageStress: 0.34,
    lifeMultiplier: 2.4,
    description: 'The middle charge window avoids high-voltage stress and usually produces the longest useful life.',
  },
  {
    id: 'low-amps',
    title: 'Lower amps',
    chargeTarget: 100,
    ampMultiplier: 0.5,
    voltageStress: 0.8,
    lifeMultiplier: 1.35,
    description: 'Lower current reduces I^2R heat, so resistance growth and thermal aging slow down.',
  },
  {
    id: 'recommended',
    title: 'Recommended amps',
    chargeTarget: 100,
    ampMultiplier: 1,
    voltageStress: 1,
    lifeMultiplier: 1,
    description: 'The baseline case follows the manufacturer-style current limit for a normal full charge.',
  },
  {
    id: 'amps-1-5',
    title: '1.5x amps',
    chargeTarget: 100,
    ampMultiplier: 1.5,
    voltageStress: 1.15,
    lifeMultiplier: 0.58,
    description: 'Higher current raises resistive heating sharply, accelerating capacity loss and risk.',
  },
  {
    id: 'amps-2',
    title: '2x amps',
    chargeTarget: 100,
    ampMultiplier: 2,
    voltageStress: 1.3,
    lifeMultiplier: 0.36,
    description: 'Doubling current can create about four times the I^2R heat, making failure and fire risk visible.',
  },
];

function generateScenarioPoints(battery: Battery, scenario: ScenarioDefinition): BatteryHealthPoint[] {
  const points: BatteryHealthPoint[] = [];
  const maxCycles = Math.min(6000, Math.max(220, Math.round(battery.expectedCycleLife * scenario.lifeMultiplier * 1.25)));
  const baselineDamage = 20 / Math.max(1, battery.expectedCycleLife * scenario.lifeMultiplier);
  let health = 100;
  let fireRisk = 0;

  for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
    const current = battery.recommendedAmps * scenario.ampMultiplier;
    const cRate = current / battery.capacityAh;
    const heatCurrentFactor = scenario.ampMultiplier ** 2;
    const resistanceGrowth = (100 - health) * battery.internalResistanceOhm * 20;
    const highVoltageHeat = scenario.chargeTarget >= 100 ? 2.5 : 0;
    const peakTemp = 27 + heatCurrentFactor * battery.internalResistanceOhm * current * 28 + resistanceGrowth + highVoltageHeat;
    const heatStress = Math.max(0, peakTemp - 38) * 0.012;
    const ampStress = Math.max(0, cRate / (battery.recommendedAmps / battery.capacityAh) - 1) * 0.08;
    const damage = baselineDamage * scenario.voltageStress + heatStress + ampStress;

    health = Math.max(0, health - damage);
    fireRisk = Math.min(100, Math.max(0, fireRisk + Math.max(0, peakTemp - 52) * 0.08 + Math.max(0, scenario.ampMultiplier - 1.25) * 0.18 - 0.035));

    const label = peakTemp > 82 || fireRisk > 96 ? 'fire' : health <= 60 ? 'dead' : scenario.id;
    points.push({
      cycle,
      capacityHealthPercent: Number(health.toFixed(1)),
      peakTemp: Number(peakTemp.toFixed(1)),
      fireRiskPercent: Number(fireRisk.toFixed(1)),
      label,
    });

    if (label === 'fire' || label === 'dead') break;
  }

  return points;
}

function ScenarioGraph({ result }: { result: ScenarioResult }) {
  const last = result.points[result.points.length - 1];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{result.scenario.title}</h3>
          <p className="text-xs text-gray-500 leading-relaxed mt-1">{result.scenario.description}</p>
        </div>
        {last && (
          <div className="text-right text-xs text-gray-400 flex-shrink-0">
            <div>{last.cycle.toLocaleString()} cycles</div>
            <div>{last.capacityHealthPercent}% health</div>
          </div>
        )}
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={result.points} margin={{ top: 4, right: 8, bottom: 12, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
            <XAxis dataKey="cycle" stroke="#666" tick={{ fontSize: 10 }} />
            <YAxis stroke="#666" tick={{ fontSize: 10 }} width={32} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  capacityHealthPercent: 'Health',
                  peakTemp: 'Peak temp',
                  fireRiskPercent: 'Fire risk',
                };
                const units: Record<string, string> = {
                  capacityHealthPercent: '%',
                  peakTemp: '°C',
                  fireRiskPercent: '%',
                };
                const key = String(name);
                return [`${Number(value)}${units[key] ?? ''}`, labels[key] ?? key];
              }}
            />
            <Line type="monotone" dataKey="capacityHealthPercent" stroke="#facc15" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="peakTemp" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="fireRiskPercent" stroke="#fb7185" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ChargeCycleScenariosModal({ battery, onClose }: ChargeCycleScenariosModalProps) {
  const results = SCENARIOS.map((scenario) => ({
    scenario,
    points: generateScenarioPoints(battery, scenario),
  }));

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto rounded-2xl border border-white/10 bg-[#0b0f14] shadow-2xl">
        <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 bg-[#0b0f14]/95 p-5 rounded-t-2xl">
          <div>
            <h2 className="text-3xl font-bold text-accent">Charge Cycle Scenarios</h2>
            <p className="text-sm text-gray-400 mt-1">
              {battery.name} • {battery.capacityAh}Ah • recommended {battery.recommendedAmps}A • expected life {battery.expectedCycleLife.toLocaleString()} cycles
            </p>
            <p className="text-xs text-gray-500 mt-2 max-w-3xl">
              Each panel is scripted cycle-by-cycle from charge voltage stress, current, I^2R heat, internal resistance growth, and accumulating fire risk.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((result) => (
            <ScenarioGraph key={result.scenario.id} result={result} />
          ))}
        </div>
      </div>
    </div>
  );
}
