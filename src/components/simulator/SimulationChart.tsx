import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimulationSnapshot } from '../../types';
import type { RunMeta } from './LiveSimulationPanel';

export interface SimRun {
  id: string;
  meta: RunMeta;
  snapshots: SimulationSnapshot[];
}

export interface BatteryHealthPoint {
  cycle: number;
  capacityHealthPercent: number;
  peakTemp: number;
  fireRiskPercent: number;
  label: string;
}

interface SimulationChartProps {
  runs: SimRun[];
  liveSnapshots: SimulationSnapshot[];
  isCharging: boolean;
  healthHistory: BatteryHealthPoint[];
  selectedBatteryName: string;
  onClearHistory: () => void;
}

type ChartMetric = 'soc' | 'temperature' | 'voltage' | 'amps' | 'capacityHealthPercent' | 'fireRiskPercent';

const METRIC_CONFIG: Record<ChartMetric, { label: string; color: string; unit: string }> = {
  soc: { label: 'Charge (%)', color: '#34d399', unit: '%' },
  temperature: { label: 'Temperature', color: '#f97316', unit: '°C' },
  voltage: { label: 'Voltage', color: '#38bdf8', unit: 'V' },
  amps: { label: 'Current', color: '#a78bfa', unit: 'A' },
  capacityHealthPercent: { label: 'Health', color: '#facc15', unit: '%' },
  fireRiskPercent: { label: 'Fire risk', color: '#fb7185', unit: '%' },
};

function hasChangingValues(data: SimulationSnapshot[], metric: ChartMetric) {
  if (data.length < 2) return metric === 'soc' || metric === 'temperature';
  const first = data[0]?.[metric];
  return data.some(point => Math.abs(Number(point[metric]) - Number(first)) > 0.05);
}

function getCycleLabel(run: SimRun) {
  const date = new Date(run.meta.completedAt);
  const time = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `Cycle #${run.meta.cycleNumber}${time ? ` · ${time}` : ''}`;
}

function RunBadge({ run, isCurrent }: { run: SimRun; isCurrent: boolean }) {
  const cRateColor = run.meta.cRate > 1.5 ? 'text-red-400' : run.meta.cRate > 1 ? 'text-amber-400' : 'text-emerald-400';
  const tempColor = run.meta.peakTemp > 55 ? 'text-red-400' : run.meta.peakTemp > 45 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isCurrent
        ? 'border-accent/50 bg-accent/5'
        : 'border-white/10 bg-white/3 opacity-70 hover:opacity-100'
    }`}>
      <div className="flex items-center justify-between mb-2 gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {getCycleLabel(run)}
        </span>
        <span className="text-xs text-gray-500">{run.meta.totalTimeMin} min</span>
      </div>
      <div className="text-sm font-medium truncate mb-2">{run.meta.batteryName}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <span className={cRateColor}>{run.meta.cRate}C / {run.meta.amps}A</span>
        <span className={tempColor}>Peak {run.meta.peakTemp}°C</span>
        <span className="text-gray-400">{run.meta.finalCharge}% charge</span>
        <span className="text-gray-400">{run.meta.capacityHealthPercent}% health</span>
      </div>
    </div>
  );
}

export default function SimulationChart({
  runs,
  liveSnapshots,
  isCharging,
  healthHistory,
  selectedBatteryName,
  onClearHistory,
}: SimulationChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<Set<ChartMetric>>(
    new Set(['soc', 'temperature'])
  );
  const [selectedRunId, setSelectedRunId] = useState<string>('live');

  const effectiveSelectedRunId =
    selectedRunId === 'live' || runs.some(run => run.id === selectedRunId)
      ? selectedRunId
      : runs[0]?.id ?? 'live';
  const selectedRun = runs.find(run => run.id === effectiveSelectedRunId);
  const displayData: SimulationSnapshot[] = useMemo(
    () => effectiveSelectedRunId === 'live'
      ? liveSnapshots
      : selectedRun?.snapshots ?? runs[0]?.snapshots ?? [],
    [effectiveSelectedRunId, liveSnapshots, runs, selectedRun?.snapshots]
  );
  const hasRuns = runs.length > 0;
  const hasLive = liveSnapshots.length > 0;
  const isLiveSelected = effectiveSelectedRunId === 'live' && isCharging;

  const availableMetrics = useMemo(
    () => (Object.keys(METRIC_CONFIG) as ChartMetric[]).filter(metric => hasChangingValues(displayData, metric)),
    [displayData]
  );
  const visibleActiveMetrics = useMemo(() => {
    const next = new Set([...activeMetrics].filter(metric => availableMetrics.includes(metric)));
    if (next.size === 0) next.add(availableMetrics[0] ?? 'soc');
    return next;
  }, [activeMetrics, availableMetrics]);

  const toggleMetric = (metric: ChartMetric) => {
    setActiveMetrics(prev => {
      const next = new Set(prev);
      if (next.has(metric)) {
        if (next.size > 1) next.delete(metric);
      } else {
        next.add(metric);
      }
      return next;
    });
  };

  if (!hasRuns && !hasLive && healthHistory.length === 0) {
    return (
      <div className="glass p-8 rounded-2xl text-center mt-6">
        <p className="text-gray-500 text-sm">Start a simulation to see live charts here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="glass p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-accent flex items-center gap-2">
              Simulation Chart
              {isLiveSelected && (
                <span className="text-xs font-normal text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full animate-pulse">
                  Live
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Only values that change during the selected cycle are shown.</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {availableMetrics.map((key) => {
              const cfg = METRIC_CONFIG[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleMetric(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    visibleActiveMetrics.has(key)
                      ? 'border-transparent text-black'
                      : 'border-white/10 text-gray-500 bg-transparent hover:border-white/20'
                  }`}
                  style={visibleActiveMetrics.has(key) ? { backgroundColor: cfg.color } : {}}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 4, right: 8, bottom: 16, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                <XAxis
                  dataKey="timeMin"
                  stroke="#555"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Simulation time (min)', position: 'insideBottom', offset: -8, fill: '#666', fontSize: 11 }}
                />
                <YAxis stroke="#555" tick={{ fontSize: 11 }} width={38} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(value) => `${value} min`}
                  formatter={(value, name) => {
                    const key = String(name) as ChartMetric;
                    return [`${Number(value)}${METRIC_CONFIG[key]?.unit ?? ''}`, METRIC_CONFIG[key]?.label ?? String(name)];
                  }}
                />
                {(Object.entries(METRIC_CONFIG) as [ChartMetric, typeof METRIC_CONFIG[ChartMetric]][]).map(([key, cfg]) =>
                  visibleActiveMetrics.has(key) ? (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={cfg.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      isAnimationActive={false}
                    />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:w-64 flex-shrink-0 space-y-2 overflow-y-auto max-h-72 pr-1">
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="text-xs uppercase tracking-widest text-gray-500">Cycle History</div>
              {hasRuns && (
                <button onClick={onClearHistory} className="text-xs text-red-300 hover:text-red-200">
                  Delete {selectedBatteryName}
                </button>
              )}
            </div>

            {hasLive && (
              <button onClick={() => setSelectedRunId('live')} className="block w-full text-left">
                <div className={`p-4 rounded-xl border ${effectiveSelectedRunId === 'live' ? 'border-accent/50 bg-accent/5' : 'border-white/10 bg-white/3'}`}>
                  <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Current Cycle</div>
                  <div className="text-sm text-gray-400 mt-2">{liveSnapshots.length} samples recorded</div>
                </div>
              </button>
            )}

            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => setSelectedRunId(run.id)}
                className="block w-full text-left"
              >
                <RunBadge run={run} isCurrent={effectiveSelectedRunId === run.id} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-accent">Battery Health History</h2>
          <p className="text-xs text-gray-500 mt-1">
            Capacity loss is modeled from high charge voltage, heat, current stress, and rising internal resistance.
          </p>
        </div>

        {healthHistory.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthHistory} margin={{ top: 4, right: 8, bottom: 16, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                <XAxis
                  dataKey="cycle"
                  stroke="#555"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Cycle', position: 'insideBottom', offset: -8, fill: '#666', fontSize: 11 }}
                />
                <YAxis stroke="#555" tick={{ fontSize: 11 }} width={38} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                  formatter={(value, name) => {
                    const metricName = String(name);
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
                    return [`${Number(value)}${units[metricName] ?? ''}`, labels[metricName] ?? metricName];
                  }}
                />
                <Line type="monotone" dataKey="capacityHealthPercent" stroke="#facc15" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="peakTemp" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="fireRiskPercent" stroke="#fb7185" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Complete a cycle or run a scripted lifetime test to build health history.</p>
        )}
      </div>
    </div>
  );
}
