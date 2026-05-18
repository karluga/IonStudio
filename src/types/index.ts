export interface Battery {
  id: string;
  name: string;
  chemistry: string;
  cells: number;
  capacityAh: number;
  nominalVoltage: number;
  maxChargeC: number;
  maxChargeAmps: number;
  recommendedAmps: number;
  internalResistanceOhm: number;
  description: string;
}

export interface SimulationState {
  isCharging: boolean;
  currentAmps: number;
  voltage: number;
  soc: number;           // State of Charge 0-100
  timeElapsedMin: number;
  temperature: number;
}

export interface SimulationSnapshot {
  timeMin: number;
  soc: number;
  voltage: number;
  temperature: number;
  amps: number;
}