import React from 'react';
import { Activity, Shield, Cpu, BookOpen, BarChart3, Database, History, Terminal } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-indigo-500/20 border border-cyan-500/30 group-hover:border-cyan-400 transition-all">
            {/* SVG Forensic Fingerprint + Spectrum Logo */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-cyan-400 stroke-current fill-none stroke-[1.75]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 0-10 10c0 4.4 2.9 8.2 7 9.5" />
              <path d="M12 6a6 6 0 0 0-6 6c0 2.6 1.7 4.9 4.2 5.7" />
              <path d="M12 10a2 2 0 0 0-2 2c0 .9.6 1.6 1.4 1.9" />
              <path d="M18 12c0-3.3-2.7-6-6-6" />
              <path d="M22 12c0-5.5-4.5-10-10-10" />
              <circle cx="12" cy="12" r="1" className="fill-cyan-400" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                DeepTrace <span className="text-cyan-400 font-mono">AI</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-medium rounded border border-cyan-500/30 text-cyan-300 bg-cyan-950/40">
                v1.0-MTech
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Residual Frequency Forensic Lab
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'landing'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'analyze'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'text-slate-200 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Analyze Media</span>
          </button>

          <button
            onClick={() => setActiveTab('methodology')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'methodology'
                ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Methodology</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'metrics'
                ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Research Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'models'
                ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Model Registry</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">History</span>
          </button>
        </nav>

        {/* Engine Status Badge */}
        <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-800">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Forensic Engine Active</span>
          </div>
        </div>

      </div>
    </header>
  );
};
