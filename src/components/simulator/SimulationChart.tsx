import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import type { SimulationSnapshot } from '../../types';
import type { RunMeta } from './LiveSimulationPanel';

export interface SimRun {
  id: string;
  meta: RunMeta;
  snapshots: SimulationSnapshot[];
}

interface SimulationChartProps {
  runs: SimRun[];
  liveSnapshots: SimulationSnapshot[];
  isCharging: boolean;
}

type ChartMetric = 'soc' | 'temperature' | 'voltage' | 'amps';

const METRIC_CONFIG: Record<ChartMetric, { label: string; color: string; unit: string }> = {
  soc:         { label: 'SOC (%)',        color: '#34d399', unit: '%'  },
  temperature: { label: 'Temperature',    color: '#f97316', unit: '°C' },
  voltage:     { label: 'Voltage',        color: '#38bdf8', unit: 'V'  },
  amps:        { label: 'Current',        color: '#a78bfa', unit: 'A'  },
};

// Muted palette for historical runs
const HISTORY_COLORS = ['#6b7280', '#4b5563', '#374151', '#1f2937'];

function RunBadge({ meta, index, isCurrent }: { meta: RunMeta; index: number; isCurrent: boolean }) {
  const cRateColor = meta.cRate > 1.5 ? 'text-red-400' : meta.cRate > 1 ? 'text-amber-400' : 'text-emerald-400';
  const tempColor = meta.peakTemp > 55 ? 'text-red-400' : meta.peakTemp > 45 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isCurrent
        ? 'border-accent/50 bg-accent/5'
        : 'border-white/10 bg-white/3 opacity-60'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {isCurrent ? '● Current' : `Run #${index + 1}`}
        </span>
        <span className="text-xs text-gray-500">{meta.totalTimeMin} min</span>
      </div>
      <div className="text-sm font-medium truncate mb-2">{meta.batteryName}</div>
      <div className="flex gap-3 text-xs">
        <span className={cRateColor}>{meta.cRate}C / {meta.amps}A</span>
        <span className="text-gray-600">·</span>
        <span className={tempColor}>Peak {meta.peakTemp}°C</span>
        <span className="text-gray-600">·</span>
        <span className="text-gray-400">{meta.finalSoc}% SOC</span>
      </div>
    </div>
  );
}

export default function SimulationChart({ runs, liveSnapshots, isCharging }: SimulationChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<Set<ChartMetric>>(
    new Set(['soc', 'temperature'])
  );
  const [selectedRun, setSelectedRun] = useState<number>(0); // 0 = live/latest

  const toggleMetric = (m: ChartMetric) => {
    setActiveMetrics(prev => {
      const next = new Set(prev);
      if (next.has(m)) {
        if (next.size > 1) next.delete(m); // always keep at least one
      } else {
        next.add(m);
      }
      return next;
    });
  };

  // Determine which data to show
  const hasRuns = runs.length > 0;
  const displayData: SimulationSnapshot[] =
    selectedRun === 0
      ? (isCharging ? liveSnapshots : (runs[0]?.snapshots ?? []))
      : (runs[selectedRun]?.snapshots ?? []);

  const isLiveSelected = selectedRun === 0 && isCharging;

  if (!hasRuns && !isCharging) {
    return (
      <div className="glass p-8 rounded-2xl text-center mt-6">
        <p className="text-gray-500 text-sm">Start a simulation to see live charts here</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-2xl mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-accent flex items-center gap-2">
            Simulation Chart
            {isLiveSelected && (
              <span className="text-xs font-normal text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full animate-pulse">
                ● LIVE
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Click metrics to toggle · Newest run shown first</p>
        </div>

        {/* Metric toggles */}
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(METRIC_CONFIG) as [ChartMetric, typeof METRIC_CONFIG[ChartMetric]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => toggleMetric(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeMetrics.has(key)
                  ? 'border-transparent text-black'
                  : 'border-white/10 text-gray-500 bg-transparent hover:border-white/20'
              }`}
              style={activeMetrics.has(key) ? { backgroundColor: cfg.color } : {}}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Chart */}
        <div className="flex-1 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 4, right: 8, bottom: 16, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis
                dataKey="timeMin"
                stroke="#555"
                tick={{ fontSize: 11 }}
                label={{ value: 'Time (min)', position: 'insideBottom', offset: -8, fill: '#666', fontSize: 11 }}
              />
              <YAxis stroke="#555" tick={{ fontSize: 11 }} width={36} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => `${v} min`}
                formatter={(value: number, name: string) => {
                  const key = name as ChartMetric;
                  return [`${value}${METRIC_CONFIG[key]?.unit ?? ''}`, METRIC_CONFIG[key]?.label ?? name];
                }}
              />
              {(Object.entries(METRIC_CONFIG) as [ChartMetric, typeof METRIC_CONFIG[ChartMetric]][]).map(([key, cfg]) =>
                activeMetrics.has(key) ? (
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

              {/* Overlay previous runs as muted lines */}
              {runs.slice(1, 4).map((run, i) =>
                activeMetrics.has('temperature') ? (
                  <Line
                    key={`prev-temp-${run.id}`}
                    data={run.snapshots}
                    type="monotone"
                    dataKey="temperature"
                    stroke={HISTORY_COLORS[i]}
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="4 3"
                    isAnimationActive={false}
                    legendType="none"
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Run history sidebar */}
        {hasRuns && (
          <div className="w-56 flex-shrink-0 space-y-2 overflow-y-auto max-h-72 pr-1">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-3 px-1">Run History</div>

            {/* Current / live run */}
            <div
              onClick={() => setSelectedRun(0)}
              className="cursor-pointer"
            >
              <RunBadge
                meta={runs[0]?.meta ?? { batteryName: '–', amps: 0, cRate: 0, peakTemp: 25, totalTimeMin: 0, finalSoc: 0 }}
                index={0}
                isCurrent={selectedRun === 0}
              />
            </div>

            {/* Previous runs */}
            {runs.slice(1).map((run, i) => (
              <div
                key={run.id}
                onClick={() => setSelectedRun(i + 1)}
                className="cursor-pointer"
              >
                <RunBadge meta={run.meta} index={i + 1} isCurrent={selectedRun === i + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}