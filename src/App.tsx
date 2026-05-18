import { useState } from 'react';
import VirtualCharger from './components/simulator/VirtualCharger';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'simulator' | 'calculator' | 'learn'>('simulator');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Navigation */}
      <nav className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center font-bold text-black">
              I
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">IonStudio</h1>
              <p className="text-[10px] text-gray-500 -mt-1">Master Battery Charging Physics</p>
            </div>
          </div>

          <div className="flex gap-2 bg-white/5 rounded-2xl p-1">
            <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')}>
              Home
            </NavButton>
            <NavButton active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')}>
              Simulator
            </NavButton>
            <NavButton active={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')}>
              Calculator
            </NavButton>
            <NavButton active={activeTab === 'learn'} onClick={() => setActiveTab('learn')}>
              Learn Basics
            </NavButton>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'home' && (
          <div className="text-center py-20">
            <h1 className="text-6xl font-bold mb-6">Welcome to IonStudio</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Learn how to safely charge batteries using real physics.<br />
              Understand amps, voltage, and C-rate through interactive simulation.
            </p>
          </div>
        )}

        {activeTab === 'simulator' && <VirtualCharger />}

        {activeTab === 'calculator' && (
          <div className="glass p-12 rounded-3xl text-center">
            <h2 className="text-4xl font-bold mb-4">Amperage Calculator</h2>
            <p className="text-gray-400">Coming soon — Full physics-based calculator with step-by-step explanations</p>
          </div>
        )}

        {activeTab === 'learn' && (
          <div className="glass p-12 rounded-3xl text-center">
            <h2 className="text-4xl font-bold mb-4">Learn the Basics</h2>
            <p className="text-gray-400">Educational modules about voltage, amps, C-rate, and battery chemistry coming soon</p>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          IonStudio — Educational Battery Charging Simulator • Understanding electricity through practice
        </div>
      </footer>
    </div>
  );
}

// Small reusable component
function NavButton({ children, active, onClick }: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl transition-all font-medium ${
        active 
          ? 'bg-accent text-black' 
          : 'hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

export default App;