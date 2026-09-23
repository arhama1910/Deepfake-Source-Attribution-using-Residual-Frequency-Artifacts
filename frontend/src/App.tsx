import React, { useState } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroSection } from './components/landing/HeroSection';
import { UploadZone } from './components/analyze/UploadZone';
import { ResultsDashboard } from './components/results/ResultsDashboard';
import { MethodologyPage } from './components/methodology/MethodologyPage';
import { MetricsPage } from './components/metrics/MetricsPage';
import { ModelsPage } from './components/models/ModelsPage';
import { HistoryPage } from './components/history/HistoryPage';
import { AnalysisResult } from './types/forensics';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);

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
    <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 forensic-grid selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1">
        {activeTab === 'landing' && (
          <HeroSection
            onStartAnalysis={handleStartAnalysis}
            onExploreMethodology={handleExploreMethodology}
          />
        )}

        {activeTab === 'analyze' && (
          <div className="py-10 px-4 sm:px-6 lg:px-8">
            {!currentResult ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-extrabold text-white">Forensic Media Inspection</h1>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                    Upload an image or video to extract SRM high-pass residuals, 2D FFT spectra, 2D DCT matrices, and temporal stability.
                  </p>
                </div>
                <UploadZone onAnalysisComplete={handleAnalysisComplete} />
              </div>
            ) : (
              <ResultsDashboard result={currentResult} onReset={handleResetAnalysis} />
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
  );
};

export default App;
