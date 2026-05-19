import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Battery, SimulationState, SimulationSnapshot } from '../../types';
import { batteries } from '../../data/batteries';

import BatterySelector from './BatterySelector';
import LiveSimulationPanel from './LiveSimulationPanel';
import SimulationControls, { type HealthScenarioId } from './SimulationControls';
import SimulationChart, { type BatteryHealthPoint, type SimRun } from './SimulationChart';
import type { RunMeta } from './LiveSimulationPanel';

const STORAGE_KEY = 'ionstudio.cycleHistory.v1';
const TICK_MS = 600;
const TICK_MINUTES = 0.6;

type StoredHistory = Record<string, SimRun[]>;

function createInitialState(battery: Battery | null, ambientTemp: number, health = 100): SimulationState {
  return {
    isCharging: false,
    currentAmps: 0,
    voltage: battery?.nominalVoltage ?? 0,
    soc: 0,
    timeElapsedMin: 0,
    temperature: ambientTemp,
    capacityHealthPercent: health,
    fireRiskPercent: 0,
    isDead: health <= 55,
    isOnFire: false,
  };
}

function makeSnapshot(state: SimulationState): SimulationSnapshot {
  return {
    timeMin: state.timeElapsedMin,
    soc: state.soc,
    voltage: state.voltage,
    temperature: state.temperature,
    amps: state.currentAmps,
    capacityHealthPercent: state.capacityHealthPercent,
    fireRiskPercent: state.fireRiskPercent,
  };
}

function getLatestHealth(runs: SimRun[]) {
  return runs[0]?.meta.capacityHealthPercent ?? 100;
}

function getPeakTemp(snapshots: SimulationSnapshot[], fallback: number) {
  return snapshots.reduce((peak, snap) => Math.max(peak, snap.temperature), fallback);
}

function buildHealthPoint(run: SimRun): BatteryHealthPoint {
  return {
    cycle: run.meta.cycleNumber,
    capacityHealthPercent: run.meta.capacityHealthPercent,
    peakTemp: run.meta.peakTemp,
    fireRiskPercent: run.meta.fireRiskPercent,
    label: run.meta.endedBy,
  };
}

function estimateCycleDamage(args: {
  battery: Battery;
  amps: number;
  peakTemp: number;
  finalCharge: number;
  ambientTemp: number;
}) {
  const cRate = args.amps / args.battery.capacityAh;
  const recommendedCRate = args.battery.recommendedAmps / args.battery.capacityAh;
  const chargeStress = args.finalCharge >= 98 ? 0.38 : args.finalCharge > 80 ? 0.18 : 0.06;
  const ampStress = Math.max(0, cRate / recommendedCRate - 1) * 0.45;
  const lowAmpRelief = cRate < recommendedCRate * 0.65 ? -0.04 : 0;
  const heatStress = Math.max(0, args.peakTemp - 38) * 0.035;
  const ambientStress = Math.max(0, args.ambientTemp - 30) * 0.015;

  return Math.max(0.04, chargeStress + ampStress + heatStress + ambientStress + lowAmpRelief);
}

function createScriptedHistory(battery: Battery, scenario: HealthScenarioId): BatteryHealthPoint[] {
  const points: BatteryHealthPoint[] = [];
  let health = 100;
  let fireRisk = 0;

  for (let cycle = 1; cycle <= 180; cycle += 1) {
    const profile = {
      'full-100': { finalCharge: 100, amps: battery.recommendedAmps, peakBase: 39, damage: 0.34 },
      'balanced-20-80': { finalCharge: 80, amps: battery.recommendedAmps * 0.9, peakBase: 33, damage: 0.095 },
      'low-amps': { finalCharge: 100, amps: battery.recommendedAmps * 0.5, peakBase: 31, damage: 0.18 },
      'risk-amps': { finalCharge: 100, amps: battery.recommendedAmps * 2, peakBase: 52, damage: 0.82 },
    }[scenario];

    const resistanceGrowth = (100 - health) * battery.internalResistanceOhm * 18;
    const peakTemp = profile.peakBase + resistanceGrowth + (scenario === 'risk-amps' ? cycle * 0.06 : 0);
    const voltageStress = profile.finalCharge === 100 ? 0.08 : 0;
    const heatStress = Math.max(0, peakTemp - 40) * 0.018;
    const ampStress = Math.max(0, profile.amps / battery.recommendedAmps - 1) * 0.16;

    health = Math.max(0, health - profile.damage - voltageStress - heatStress - ampStress);
    fireRisk = Math.min(100, Math.max(0, fireRisk + Math.max(0, peakTemp - 48) * 0.18 + ampStress * 5 - 0.12));

    const label =
      peakTemp > 78 || fireRisk > 92
        ? 'fire'
        : health <= 55
          ? 'dead'
          : profile.finalCharge === 80
            ? '20-80'
            : 'full';

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

function loadStoredHistory(): StoredHistory {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as StoredHistory : {};
  } catch {
    return {};
  }
}

export default function VirtualCharger() {
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(batteries[0] ?? null);
  const [currentAmps, setCurrentAmps] = useState(batteries[0]?.recommendedAmps ?? 1.0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [ambientTemp, setAmbientTemp] = useState(25);
  const [isCharging, setIsCharging] = useState(false);
  const [historyByBattery, setHistoryByBattery] = useState<StoredHistory>(() => loadStoredHistory());
  const [scriptedHealth, setScriptedHealth] = useState<BatteryHealthPoint[]>([]);
  const [simulationState, setSimulationState] = useState<SimulationState>(() =>
    createInitialState(batteries[0] ?? null, 25)
  );
  const [liveSnapshots, setLiveSnapshots] = useState<SimulationSnapshot[]>([]);
  const completingRef = useRef(false);

  const runHistory = useMemo(
    () => (selectedBattery ? historyByBattery[selectedBattery.id] ?? [] : []),
    [historyByBattery, selectedBattery]
  );

  const healthHistory = useMemo(
    () => scriptedHealth.length > 0 ? scriptedHealth : runHistory.map(buildHealthPoint).reverse(),
    [runHistory, scriptedHealth]
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(historyByBattery));
  }, [historyByBattery]);

  const completeCycle = useCallback((endedBy: RunMeta['endedBy'], finalState = simulationState, snapshots = liveSnapshots) => {
    if (!selectedBattery || snapshots.length < 2 || completingRef.current) return;
    completingRef.current = true;

    const peakTemp = getPeakTemp(snapshots, finalState.temperature);
    const damage = estimateCycleDamage({
      battery: selectedBattery,
      amps: currentAmps,
      peakTemp,
      finalCharge: finalState.soc,
      ambientTemp,
    });
    const nextHealth = Math.max(0, finalState.capacityHealthPercent - damage);
    const nextFireRisk = Math.min(
      100,
      finalState.fireRiskPercent + Math.max(0, peakTemp - 55) * 0.45 + (endedBy === 'fire' ? 35 : 0)
    );
    const previousRuns = historyByBattery[selectedBattery.id] ?? [];
    const cRate = currentAmps / selectedBattery.capacityAh;
    const meta: RunMeta = {
      batteryId: selectedBattery.id,
      batteryName: selectedBattery.name,
      amps: currentAmps,
      cRate: Number(cRate.toFixed(2)),
      peakTemp: Number(peakTemp.toFixed(1)),
      totalTimeMin: Number(finalState.timeElapsedMin.toFixed(1)),
      finalCharge: Number(finalState.soc.toFixed(1)),
      cycleNumber: previousRuns.length + 1,
      completedAt: new Date().toISOString(),
      capacityHealthPercent: Number(nextHealth.toFixed(1)),
      fireRiskPercent: Number(nextFireRisk.toFixed(1)),
      endedBy,
    };
    const run: SimRun = {
      id: `cycle-${selectedBattery.id}-${Date.now()}`,
      meta,
      snapshots,
    };

    setHistoryByBattery(prev => ({
      ...prev,
      [selectedBattery.id]: [run, ...(prev[selectedBattery.id] ?? [])],
    }));
    setLiveSnapshots([]);
    setIsCharging(false);
    setSimulationState(createInitialState(selectedBattery, ambientTemp, nextHealth));
    setScriptedHealth([]);
    window.setTimeout(() => {
      completingRef.current = false;
    }, 0);
  }, [ambientTemp, currentAmps, historyByBattery, liveSnapshots, selectedBattery, simulationState]);

  useEffect(() => {
    if (!isCharging || !selectedBattery || simulationState.isDead || simulationState.isOnFire) return;

    const interval = window.setInterval(() => {
      setSimulationState(prev => {
        const simulatedMinutes = TICK_MINUTES * speedMultiplier;
        const cRate = currentAmps / selectedBattery.capacityAh;
        const chargeEfficiency = Math.max(0.62, 0.9 - Math.max(0, cRate - 1) * 0.08);
        const chargeDelta = (currentAmps / selectedBattery.capacityAh) * chargeEfficiency * simulatedMinutes;
        const newCharge = Math.min(100, prev.soc + chargeDelta);
        const progress = newCharge / 100;
        const resistance = selectedBattery.internalResistanceOhm * (1 + (100 - prev.capacityHealthPercent) / 85);
        const jouleHeat = Math.pow(currentAmps, 2) * resistance * (TICK_MS / 1000) * speedMultiplier;
        const heatRise = (jouleHeat / selectedBattery.capacityAh) * 1.8;
        const cooling = 0.08 * (prev.temperature - ambientTemp) * Math.max(0.35, 1 - speedMultiplier / 90);
        const newTemp = Math.max(ambientTemp, Math.min(120, prev.temperature + heatRise - cooling));
        const highTempRisk = Math.max(0, newTemp - 55) * 0.05;
        const highAmpRisk = Math.max(0, currentAmps / selectedBattery.recommendedAmps - 1.5) * 0.75;
        const fireRiskPercent = Math.min(100, prev.fireRiskPercent + highTempRisk + highAmpRisk);
        const isOnFire = newTemp >= 92 || fireRiskPercent >= 98;
        const isDead = prev.capacityHealthPercent <= 55;

        const finalState: SimulationState = {
          ...prev,
          isCharging: true,
          currentAmps,
          voltage: Number((selectedBattery.nominalVoltage * (0.88 + progress * 0.29)).toFixed(2)),
          soc: Number(newCharge.toFixed(1)),
          timeElapsedMin: Number((prev.timeElapsedMin + simulatedMinutes).toFixed(1)),
          temperature: Number(newTemp.toFixed(1)),
          fireRiskPercent: Number(fireRiskPercent.toFixed(1)),
          isDead,
          isOnFire,
        };
        const snap = makeSnapshot(finalState);
        setLiveSnapshots(s => [...s, snap]);

        if (finalState.soc >= 100 || isOnFire || isDead) {
          window.setTimeout(() => completeCycle(isOnFire ? 'fire' : isDead ? 'dead' : 'full', finalState, [...liveSnapshots, snap]), 0);
        }

        return finalState;
      });
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [ambientTemp, completeCycle, currentAmps, isCharging, liveSnapshots, selectedBattery, simulationState.isDead, simulationState.isOnFire, speedMultiplier]);

  const handleBatterySelect = (battery: Battery) => {
    setSelectedBattery(battery);
    setCurrentAmps(battery.recommendedAmps);
    setIsCharging(false);
    setLiveSnapshots([]);
    setScriptedHealth([]);
    setSimulationState(createInitialState(battery, ambientTemp, getLatestHealth(historyByBattery[battery.id] ?? [])));
  };

  const toggleCharging = () => {
    if (!selectedBattery || simulationState.isDead || simulationState.isOnFire) return;
    setIsCharging(prev => !prev);
    setScriptedHealth([]);
  };

  const resetLiveCycle = () => {
    setIsCharging(false);
    setLiveSnapshots([]);
    setCurrentAmps(selectedBattery?.recommendedAmps || 1.0);
    setSpeedMultiplier(1);
    setSimulationState(createInitialState(selectedBattery, ambientTemp, getLatestHealth(runHistory)));
  };

  const startNewCycle = () => {
    if (liveSnapshots.length > 1) {
      completeCycle('manual');
    } else {
      resetLiveCycle();
    }
  };

  const clearBatteryHistory = () => {
    if (!selectedBattery) return;
    setHistoryByBattery(prev => {
      const next = { ...prev };
      delete next[selectedBattery.id];
      return next;
    });
    setScriptedHealth([]);
    setSimulationState(createInitialState(selectedBattery, ambientTemp));
  };

  const runScenario = (scenario: HealthScenarioId) => {
    if (!selectedBattery) return;
    setIsCharging(false);
    setLiveSnapshots([]);
    setScriptedHealth(createScriptedHistory(selectedBattery, scenario));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          IonStudio Virtual Charger
        </h1>
        <p className="text-gray-400">Learn safe charging through real physics and live simulation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <BatterySelector
            selectedBattery={selectedBattery}
            onSelect={handleBatterySelect}
          />
        </div>

        <div className="lg:col-span-4">
          <LiveSimulationPanel
            selectedBattery={selectedBattery}
            currentAmps={currentAmps}
            speedMultiplier={speedMultiplier}
            ambientTemp={ambientTemp}
            simulation={simulationState}
          />
        </div>

        <div className="lg:col-span-3">
          <SimulationControls
            currentAmps={currentAmps}
            isCharging={isCharging}
            speedMultiplier={speedMultiplier}
            ambientTemp={ambientTemp}
            onAmpsChange={setCurrentAmps}
            onSpeedChange={setSpeedMultiplier}
            onAmbientTempChange={setAmbientTemp}
            onToggleCharging={toggleCharging}
            onNewCycle={startNewCycle}
            onReset={resetLiveCycle}
            onScenario={runScenario}
            maxRecommendedAmps={selectedBattery?.recommendedAmps || 2}
            absoluteMaxAmps={selectedBattery?.maxChargeAmps || 5}
            disabled={!selectedBattery || simulationState.isDead || simulationState.isOnFire}
          />
        </div>
      </div>

      <SimulationChart
        runs={runHistory}
        liveSnapshots={liveSnapshots}
        isCharging={isCharging}
        healthHistory={healthHistory}
        selectedBatteryName={selectedBattery?.name ?? ''}
        onClearHistory={clearBatteryHistory}
      />
    </div>
  );
}
