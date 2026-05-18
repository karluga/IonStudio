export interface Battery {
  id: string;
  name: string;
  chemistry: 'LiPo' | 'LiIon' | 'LiFePO4' | 'NiMH';
  cells: number;           // 1S, 3S, 4S etc.
  capacityAh: number;
  nominalVoltage: number;
  maxChargeC: number;      // e.g. 1 for 1C, 2 for 2C
  maxChargeAmps: number;
  recommendedAmps: number;
  description: string;
}

export interface Charger {
  id: string;
  name: string;
  maxPowerW: number;
  maxAmps: number;
  supportsBalancing: boolean;
}

export interface SimulationState {
  isCharging: boolean;
  currentAmps: number;
  voltage: number;
  soc: number;           // State of Charge 0-100
  timeElapsedMin: number;
  temperature: number;
}