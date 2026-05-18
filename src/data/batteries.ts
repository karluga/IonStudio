import type { Battery } from '../types';

export const batteries: Battery[] = [
  {
    id: "lipo-1s-1000",
    name: "LiPo 1S 1000mAh",
    chemistry: "LiPo",
    cells: 1,
    capacityAh: 1.0,
    nominalVoltage: 3.7,
    maxChargeC: 2,
    maxChargeAmps: 2.0,
    recommendedAmps: 1.0,
    description: "Small single-cell battery used in tiny whoop drones and small gadgets"
  },
  {
    id: "lipo-3s-2200",
    name: "LiPo 3S 2200mAh",
    chemistry: "LiPo",
    cells: 3,
    capacityAh: 2.2,
    nominalVoltage: 11.1,
    maxChargeC: 1,
    maxChargeAmps: 4.4,
    recommendedAmps: 2.2,
    description: "Very popular for RC planes, quadcopters, and beginner FPV drones"
  },
  {
    id: "lipo-4s-5000",
    name: "LiPo 4S 5000mAh",
    chemistry: "LiPo",
    cells: 4,
    capacityAh: 5.0,
    nominalVoltage: 14.8,
    maxChargeC: 1,
    maxChargeAmps: 10.0, // Some high-discharge packs allow higher
    recommendedAmps: 5.0,
    description: "High-capacity battery for RC cars, large drones, and FPV racing"
  },
  {
    id: "lipo-6s-1300",
    name: "LiPo 6S 1300mAh",
    chemistry: "LiPo",
    cells: 6,
    capacityAh: 1.3,
    nominalVoltage: 22.2,
    maxChargeC: 1,
    maxChargeAmps: 2.6,
    recommendedAmps: 1.3,
    description: "High voltage battery for long-range FPV drones and cinematic rigs"
  },
  {
    id: "lipo-8s-4000",
    name: "LiPo 8S 4000mAh",
    chemistry: "LiPo",
    cells: 8,
    capacityAh: 4.0,
    nominalVoltage: 29.6,
    maxChargeC: 1,
    maxChargeAmps: 8.0,
    recommendedAmps: 4.0,
    description: "High-power battery for large industrial drones and heavy-lift applications"
  },
  {
    id: "liion-21700-5000",
    name: "Li-ion 21700 5000mAh (Single Cell)",
    chemistry: "LiIon",
    cells: 1,
    capacityAh: 5.0,
    nominalVoltage: 3.6,
    maxChargeC: 0.5,
    maxChargeAmps: 2.5,
    recommendedAmps: 2.0,
    description: "Common in power banks, flashlights, and e-bikes (safer than LiPo)"
  },
  {
    id: "lifepo4-4s-100",
    name: "LiFePO4 4S 100Ah",
    chemistry: "LiFePO4",
    cells: 4,
    capacityAh: 100,
    nominalVoltage: 12.8,
    maxChargeC: 0.5,
    maxChargeAmps: 50,
    recommendedAmps: 20,
    description: "Large battery used in solar energy storage and off-grid systems"
  },
  {
    id: "nimh-6s-2000",
    name: "NiMH 6S 2000mAh",
    chemistry: "NiMH",
    cells: 6,
    capacityAh: 2.0,
    nominalVoltage: 7.2,
    maxChargeC: 0.5,
    maxChargeAmps: 1.0,
    recommendedAmps: 0.5,
    description: "Older technology still used in some RC cars and transmitters"
  },
  {
    id: "lifepo4-4s-100",
    name: "LiFePO4 4S 100Ah",
    chemistry: "LiFePO4",
    cells: 4,
    capacityAh: 100,
    nominalVoltage: 12.8,
    maxChargeC: 0.5,
    maxChargeAmps: 50,
    recommendedAmps: 20,        // Conservative safe value for beginners
    description: "Large battery commonly used in solar energy storage, off-grid systems, and electric vehicles"
  },
];