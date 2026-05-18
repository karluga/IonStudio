import { useState } from 'react';

interface Property {
  id: string;
  title: string;
  shortDesc: string;
  analogy: string;
  formula: string;
  example: string;
}

const properties: Property[] = [
  {
    id: "voltage",
    title: "Voltage (V)",
    shortDesc: "Electrical pressure",
    analogy: "Voltage is like water pressure in a hose. Higher voltage = stronger push.",
    formula: "V = I × R (Ohm's Law)",
    example: "A 3S LiPo battery has 3 cells × 3.7V = 11.1V nominal"
  },
  {
    id: "current",
    title: "Current (Amps)",
    shortDesc: "Flow rate of electricity",
    analogy: "Amps are like how fast water flows through the hose. Too much flow = burst pipe (overheating).",
    formula: "Charging Current (A) = Capacity (Ah) × C-rate",
    example: "For 2200mAh (2.2Ah) battery at 1C → 2.2A"
  },
  {
    id: "capacity",
    title: "Capacity (Ah / mAh)",
    shortDesc: "Size of the energy tank",
    analogy: "Capacity is the total volume of the water tank. Bigger tank = longer runtime.",
    formula: "Energy (Wh) = Voltage (V) × Capacity (Ah)",
    example: "A 4S 5000mAh battery at 14.8V stores ~74Wh"
  },
  {
    id: "c-rate",
    title: "C-Rate",
    shortDesc: "Relative charging speed",
    analogy: "1C = full tank in 1 hour. 2C = full tank in 30 minutes (more stressful).",
    formula: "C-rate = Current (A) / Capacity (Ah)",
    example: "Charging 2.2Ah battery at 4.4A = 2C rate"
  },
  {
    id: "cells",
    title: "Cells (1S, 3S, 4S...)",
    shortDesc: "How cells are arranged",
    analogy: "Like connecting water tanks in series — more cells increase total pressure (voltage).",
    formula: "Total Voltage = Single Cell Voltage × Number of Cells",
    example: "4S LiPo = 4 × 3.7V = 14.8V nominal"
  },
  {
    id: "chemistry",
    title: "Battery Chemistry",
    shortDesc: "LiPo vs LiFePO4 vs Li-ion",
    analogy: "Different materials = different personalities. LiPo is powerful but sensitive, LiFePO4 is safe but heavier.",
    formula: "Each chemistry has different safe C-rates and voltage limits",
    example: "LiPo: max 1-2C | LiFePO4: safer, can handle more abuse"
  }
];

export default function LearnBasics() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <h2 className="text-3xl font-semibold mb-6">Core Battery Properties</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {properties.map((prop) => (
          <div
            key={prop.id}
            onClick={() => setExpanded(expanded === prop.id ? null : prop.id)}
            className="glass p-6 rounded-2xl cursor-pointer hover:border-accent/50 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-accent group-hover:text-cyan-300 transition-colors">
                  {prop.title}
                </h3>
                <p className="text-gray-400 mt-1">{prop.shortDesc}</p>
              </div>
              <span className="text-3xl text-gray-600 group-hover:text-accent transition-colors">
                {expanded === prop.id ? '−' : '+'}
              </span>
            </div>

            {expanded === prop.id && (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-5">
                <div>
                  <div className="text-emerald-400 font-medium mb-1">Real-World Analogy</div>
                  <p className="text-gray-300">{prop.analogy}</p>
                </div>
                <div>
                  <div className="text-emerald-400 font-medium mb-1">Physics Formula</div>
                  <p className="font-mono bg-black/40 p-3 rounded-lg">{prop.formula}</p>
                </div>
                <div>
                  <div className="text-emerald-400 font-medium mb-1">Example</div>
                  <p className="text-gray-300">{prop.example}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}