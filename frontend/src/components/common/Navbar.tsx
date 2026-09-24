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
      <header className="sticky top-0 z-40 border-b border-[#D9DED4] bg-[#F7F6F0]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Title */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-[#0D4F43] text-white shadow-sm transition-all">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#F7F6F0] stroke-current fill-none stroke-[2]" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 0-10 10c0 4.4 2.9 8.2 7 9.5" />
                <path d="M12 6a6 6 0 0 0-6 6c0 2.6 1.7 4.9 4.2 5.7" />
                <path d="M12 10a2 2 0 0 0-2 2c0 .9.6 1.6 1.4 1.9" />
                <path d="M18 12c0-3.3-2.7-6-6-6" />
                <path d="M22 12c0-5.5-4.5-10-10-10" />
                <circle cx="12" cy="12" r="1" className="fill-[#F7F6F0]" />
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#125B4D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0D4F43]"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-[#083C33] group-hover:text-[#0D4F43] transition-colors">
                  DeepTrace <span className="text-[#0D4F43]">AI</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold rounded-full border border-[#D9DED4] text-[#083C33] bg-[#EBF0E6]">
                  v1.0-MTech
                </span>
              </div>
              <p className="text-[11px] text-[#3D5A52] font-medium hidden sm:block">
                Residual Frequency Forensic Lab
              </p>
            </div>
          </div>

          {/* Engine Status Badge */}
          <div className="flex items-center space-x-2 pl-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#EBF0E6] border border-[#D9DED4] text-[#083C33] text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#0D4F43] animate-pulse"></span>
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
