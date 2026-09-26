import React, { useState, useEffect } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring, 
  AnimatePresence 
} from 'framer-motion';
import { 
  Home, 
  Shield, 
  BookOpen, 
  BarChart3, 
  Cpu, 
  History, 
  Menu, 
  X,
  Zap
} from 'lucide-react';
import { useLenis } from 'lenis/react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavItemConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'landing', name: 'Overview', icon: Home },
  { id: 'analyze', name: 'Analyze', icon: Shield },
  { id: 'methodology', name: 'Methodology', icon: BookOpen },
  { id: 'metrics', name: 'Metrics', icon: BarChart3 },
  { id: 'models', name: 'Models', icon: Cpu },
  { id: 'history', name: 'History', icon: History },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const lenis = useLenis();

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // Track window resizing for responsive motion boundaries
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Framer Motion continuous scroll values
  const { scrollY } = useScroll();

  // Physics-based spring interpolation to achieve the physical fluid feel of Foresee
  const smoothScroll = useSpring(scrollY, {
    stiffness: 260,
    damping: 26,
    mass: 0.45,
    restDelta: 0.001
  });

  // Interpolate continuous morphing values over [0, 80] px of scroll
  // Top of page (0px): Integrated header at ceiling
  // Scrolled down (80px+): Compact floating capsule suspended below top
  const navY = useTransform(smoothScroll, [0, 80], [0, 10]);
  const navWidth = useTransform(
    smoothScroll, 
    [0, 80], 
    [isMobile ? '100%' : '100%', isMobile ? '96%' : '90%']
  );
  const navMaxWidth = useTransform(
    smoothScroll, 
    [0, 80], 
    ['1320px', isMobile ? '100%' : '1140px']
  );
  const navRadius = useTransform(smoothScroll, [0, 80], [14, 32]);
  const navPaddingY = useTransform(smoothScroll, [0, 80], [14, 8]);
  const navPaddingX = useTransform(
    smoothScroll, 
    [0, 80], 
    [isMobile ? 14 : 24, isMobile ? 12 : 20]
  );

  // Background and depth transitions
  const navBg = useTransform(
    smoothScroll,
    [0, 80],
    ['rgba(247, 246, 240, 0.95)', 'rgba(255, 255, 255, 0.88)']
  );

  const navBorderColor = useTransform(
    smoothScroll,
    [0, 80],
    ['rgba(217, 222, 212, 0.70)', 'rgba(13, 79, 67, 0.18)']
  );

  const navShadow = useTransform(
    smoothScroll,
    [0, 80],
    [
      '0 1px 2px rgba(8, 60, 51, 0.02)',
      '0 14px 34px -4px rgba(8, 60, 51, 0.12), 0 4px 12px -2px rgba(8, 60, 51, 0.04)'
    ]
  );

  const navBackdrop = useTransform(
    smoothScroll,
    [0, 80],
    ['blur(8px)', 'blur(20px)']
  );

  const logoScale = useTransform(smoothScroll, [0, 80], [1, 0.94]);
  const subtextOpacity = useTransform(smoothScroll, [0, 50], [1, 0]);

  return (
    <>
      {/* 
        DOCUMENT FLOW HEADER SPACER
        Reserves precise initial header height in standard document flow.
        Prevents layout shifts, content jumping, or hero stutter when the navbar transforms.
      */}
      <div className="h-[76px] sm:h-[80px] w-full shrink-0" aria-hidden="true" />

      {/* 
        FIXED VIEWPORT CONTAINER
        Positions the morphing navbar gracefully at top-0 with global DeepTrace container alignment.
      */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-3 sm:px-6">
        <motion.header
          style={{
            y: navY,
            width: navWidth,
            maxWidth: navMaxWidth,
            borderRadius: navRadius,
            backgroundColor: navBg,
            backdropFilter: navBackdrop,
            WebkitBackdropFilter: navBackdrop,
            boxShadow: navShadow,
            borderColor: navBorderColor,
            paddingTop: navPaddingY,
            paddingBottom: navPaddingY,
            paddingLeft: navPaddingX,
            paddingRight: navPaddingX,
          }}
          className="pointer-events-auto border flex items-center justify-between transition-colors duration-150 relative"
        >
          {/* Brand Logo & Title */}
          <div
            onClick={() => {
              handleNavClick('landing');
              setMobileOpen(false);
            }}
            className="flex items-center space-x-3 cursor-pointer group shrink-0 select-none"
          >
            <motion.div 
              style={{ scale: logoScale }}
              className="relative flex items-center justify-center w-10 h-10 shrink-0"
            >
              <img
                src="/logo.png"
                alt="DeepTrace AI Logo"
                className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#125B4D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0D4F43]"></span>
              </span>
            </motion.div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#083C33] group-hover:text-[#0D4F43] transition-colors">
                  DeepTrace <span className="text-[#0D4F43]">AI</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded-full border border-[#D9DED4] text-[#083C33] bg-[#EBF0E6]">
                  v1.0
                </span>
              </div>
              <motion.p 
                style={{ opacity: subtextOpacity }}
                className="text-[10px] text-[#3D5A52] font-medium hidden sm:block leading-none mt-0.5"
              >
                Residual Frequency Forensic Lab
              </motion.p>
            </div>
          </div>

          {/* Desktop Center Navigation Links with Foresee-Style Sliding Pill */}
          <nav className="hidden lg:flex items-center bg-[#EBF0E6]/60 border border-[#D9DED4]/70 rounded-full p-1 shadow-2xs">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors duration-200 z-10 flex items-center space-x-1.5 cursor-pointer ${
                    isActive 
                      ? 'text-[#0D4F43] font-bold' 
                      : 'text-[#3D5A52] hover:text-[#083C33]'
                  }`}
                >
                  {/* Sliding active pill indicator (exact Foresee layoutId mechanic) */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-xs border border-[#0D4F43]/15 -z-10"
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Forensic Engine Status Badge & Mobile Hamburger */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Engine Status Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#EBF0E6] border border-[#D9DED4] text-[#083C33] text-[11px] font-medium shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#0D4F43] animate-pulse"></span>
              <span className="font-semibold text-[#083C33]">Forensic Engine Active</span>
            </div>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#EBF0E6] hover:bg-[#D9DED4] text-[#083C33] border border-[#D9DED4] transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Dropdown Panel with AnimatePresence */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white/95 backdrop-blur-xl border border-[#D9DED4] rounded-2xl shadow-xl p-4 space-y-2 lg:hidden z-50 pointer-events-auto"
              >
                <div className="pb-2 border-b border-[#D9DED4] flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-[#3D5A52] font-semibold tracking-wider">
                    Navigation Menu
                  </span>
                  <div className="flex items-center space-x-1.5 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Engine Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleNavClick(item.id);
                          setMobileOpen(false);
                        }}
                        className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#0D4F43] text-white shadow-xs'
                            : 'bg-[#F7F6F0] text-[#083C33] hover:bg-[#EBF0E6]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      </div>
    </>
  );
};
