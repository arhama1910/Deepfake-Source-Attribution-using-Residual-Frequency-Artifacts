import React from 'react';
import { Home, Shield, BookOpen, BarChart3, Cpu, History } from 'lucide-react';
import { NavBar, type NavItem } from '@/components/ui/tubelight-navbar';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabNameMap: Record<string, string> = {
    landing: 'Overview',
    analyze: 'Analyze',
    methodology: 'Methodology',
    metrics: 'Metrics',
    models: 'Models',
    history: 'History',
  };

  const reverseTabMap: Record<string, string> = {
    Overview: 'landing',
    Analyze: 'analyze',
    Methodology: 'methodology',
    Metrics: 'metrics',
    Models: 'models',
    History: 'history',
  };

  const navItems: NavItem[] = [
    { name: 'Overview', url: '#overview', icon: Home, onClick: () => setActiveTab('landing') },
    { name: 'Analyze', url: '#analyze', icon: Shield, onClick: () => setActiveTab('analyze') },
    { name: 'Methodology', url: '#methodology', icon: BookOpen, onClick: () => setActiveTab('methodology') },
    { name: 'Metrics', url: '#metrics', icon: BarChart3, onClick: () => setActiveTab('metrics') },
    { name: 'Models', url: '#models', icon: Cpu, onClick: () => setActiveTab('models') },
    { name: 'History', url: '#history', icon: History, onClick: () => setActiveTab('history') },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Title */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-indigo-500/20 border border-cyan-500/30 group-hover:border-cyan-400 transition-all">
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

          {/* Engine Status Badge */}
          <div className="flex items-center space-x-2 pl-4">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Forensic Engine Active</span>
            </div>
          </div>

        </div>
      </header>

      {/* Floating Tubelight Navigation Bar */}
      <NavBar
        items={navItems}
        activeTab={tabNameMap[activeTab] || 'Overview'}
        onTabChange={(name) => {
          if (reverseTabMap[name]) {
            setActiveTab(reverseTabMap[name]);
          }
        }}
        className="fixed top-2 sm:top-2 left-1/2 -translate-x-1/2 z-50 mb-0 sm:pt-0"
      />
    </>
  );
};
