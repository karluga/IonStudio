import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const thermalData = [
  { cRate: 0.5, temp: 32, status: "Safe" },
  { cRate: 1.0, temp: 38, status: "Optimal" },
  { cRate: 1.5, temp: 46, status: "Warning" },
  { cRate: 2.0, temp: 55, status: "Risk" },
  { cRate: 3.0, temp: 68, status: "Danger" },
];

export default function LearnThermal() {
  return (
    <div className="glass p-8 rounded-3xl">
      <h2 className="text-4xl font-bold mb-2 text-orange-400 flex items-center gap-3">
        🔥 Battery Thermal Physics
      </h2>
      <p className="text-gray-400 mb-8">How charging speed dramatically affects temperature and battery health</p>

      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4">Temperature Rise vs C-Rate</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={thermalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                dataKey="cRate"
                label={{ value: 'Charging C-Rate', position: 'bottom' }}
                stroke="#888"
              />
              <YAxis
                label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
                stroke="#888"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }}
              />
              <Line
                type="natural"
                dataKey="temp"
                stroke="#f97316"
                strokeWidth={4}
                dot={{ fill: '#f97316', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 text-sm">
        <div>
          <h4 className="font-semibold text-lg mb-3 text-orange-400">Why Heat Increases So Fast</h4>
          <p className="leading-relaxed text-gray-300">
            Heat follows <strong>Joule's Law</strong>: Heat ∝ Current² × Time.<br /><br />
            Doubling the current doesn't double the heat — it <strong>quadruples</strong> it. This is why fast charging needs careful management.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-3">Temperature Danger Zones</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-emerald-500/10 p-4 rounded-xl">
              <span className="text-2xl">🟢</span>
              <div><strong>Below 40°C</strong> — Safe &amp; best for longevity</div>
            </div>
            <div className="flex items-center gap-3 bg-amber-500/10 p-4 rounded-xl">
              <span className="text-2xl">🟠</span>
              <div><strong>45–55°C</strong> — Accelerated aging</div>
            </div>
            <div className="flex items-center gap-3 bg-red-500/10 p-4 rounded-xl">
              <span className="text-2xl">🔴</span>
              <div><strong>Above 60°C</strong> — Risk of thermal runaway and fire</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}