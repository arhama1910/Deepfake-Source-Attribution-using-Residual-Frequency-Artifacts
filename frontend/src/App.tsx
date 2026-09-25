import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactLenis } from 'lenis/react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroSection } from './components/landing/HeroSection';
import { UploadZone } from './components/analyze/UploadZone';
import { ResultsDashboard } from './components/results/ResultsDashboard';
import { MethodologyPage } from './components/methodology/MethodologyPage';
import { MetricsPage } from './components/metrics/MetricsPage';
import { ModelsPage } from './components/models/ModelsPage';
import { HistoryPage } from './components/history/HistoryPage';
import KineticDotsLoader from './components/ui/kinetic-dots-loader';
import type { AnalysisResult } from './types/forensics';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Smooth preloader delay to allow forensic telemetry and assets to calibrate
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const handleStartAnalysis = () => {
    setCurrentResult(null);
    setActiveTab('analyze');
  };

  const handleExploreMethodology = () => {
    setActiveTab('methodology');
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setCurrentResult(result);
  };

  const handleSelectCaseFromHistory = (result: AnalysisResult) => {
    setCurrentResult(result);
    setActiveTab('analyze');
  };

  const handleResetAnalysis = () => {
    setCurrentResult(null);
  };

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {/* Forensic Engine Preloader */}
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F7F6F0] forensic-grid select-none"
          >
            <div className="flex flex-col items-center space-y-5 text-center px-4 max-w-sm">
              {/* Brand Logo with pulse ping */}
              <div className="relative flex items-center justify-center w-14 h-14">
                <img
                  src="/logo.png"
                  alt="DeepTrace AI"
                  className="w-14 h-14 object-contain drop-shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#125B4D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0D4F43]"></span>
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <h1 className="text-xl font-extrabold text-[#083C33] tracking-tight">
                    DeepTrace <span className="text-[#0D4F43]">AI</span>
                  </h1>
                  <span className="px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded-full border border-[#D9DED4] text-[#083C33] bg-[#EBF0E6]">
                    v1.0
                  </span>
                </div>
                <p className="text-[11px] text-[#3D5A52] font-mono tracking-wider uppercase">
                  Residual Frequency Forensic Engine
                </p>
              </div>

              {/* Kinetic Dots Loader Component */}
              <KineticDotsLoader variant="emerald" className="min-h-[110px] p-2" />

              {/* Status pill */}
              <div className="inline-flex items-center space-x-2 text-[10px] font-mono font-semibold text-[#0D4F43] bg-[#EBF0E6] px-3.5 py-1.5 rounded-full border border-[#D9DED4]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D4F43] animate-pulse" />
                <span>Calibrating Dual-Stream Forensics...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen flex flex-col bg-[#F7F6F0] text-[#083C33] forensic-grid selection:bg-[#0D4F43]/20 selection:text-[#083C33]">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />



      <main className="flex-1">
        {activeTab === 'landing' && (
          <HeroSection
            onStartAnalysis={handleStartAnalysis}
            onExploreMethodology={handleExploreMethodology}
          />
        )}

        {activeTab === 'analyze' && (
          <div className="w-full">
            {!currentResult ? (
              <UploadZone onAnalysisComplete={handleAnalysisComplete} />
            ) : (
              <div className="site-container py-10">
                <ResultsDashboard result={currentResult} onReset={handleResetAnalysis} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'methodology' && <MethodologyPage />}

        {activeTab === 'metrics' && <MetricsPage />}

        {activeTab === 'models' && <ModelsPage />}

        {activeTab === 'history' && (
          <HistoryPage onSelectCase={handleSelectCaseFromHistory} />
        )}
      </main>

      <Footer />
      </div>
    </ReactLenis>
  );
};

export default App;

