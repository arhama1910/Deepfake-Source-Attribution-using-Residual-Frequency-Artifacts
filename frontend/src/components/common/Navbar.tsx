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
      <header className="sticky top-0 z-40 border-b border-[#D9DED4] bg-[#F7F6F0]/95 backdrop-blur-md">
        <div className="navbar-inner h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
          >
            <div className="relative flex items-center justify-center w-11 h-11 shrink-0">
              <img
                src="/logo.png"
                alt="DeepTrace AI Logo"
                className="w-11 h-11 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
              />
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
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-[#3D5A52] font-medium hidden sm:block">
                Residual Frequency Forensic Lab
              </p>
            </div>
          </div>

          {/* Navigation Links in Center on Desktop */}
          <div className="hidden lg:flex items-center justify-center">
            <NavBar
              items={navItems}
              activeTab={tabNameMap[activeTab] || 'Overview'}
              onTabChange={(name) => {
                if (reverseTabMap[name]) {
                  setActiveTab(reverseTabMap[name]);
                }
              }}
              className="static p-0 m-0"
            />
          </div>

          {/* Engine Status Badge */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#EBF0E6] border border-[#D9DED4] text-[#083C33] text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#0D4F43] animate-pulse"></span>
              <span className="hidden sm:inline">Forensic Engine Active</span>
              <span className="sm:hidden">Engine Active</span>
            </div>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <NavBar
            items={navItems}
            activeTab={tabNameMap[activeTab] || 'Overview'}
            onTabChange={(name) => {
              if (reverseTabMap[name]) {
                setActiveTab(reverseTabMap[name]);
              }
            }}
            className="static p-0 m-0 shadow-lg"
          />
        </div>
      </header>
    </>
  );
};
