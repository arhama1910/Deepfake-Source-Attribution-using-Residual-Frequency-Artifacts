import React from 'react';
import { Shield, ArrowRight, Activity, Layers, FileSearch, Zap, CheckCircle2 } from 'lucide-react';
import { ForensicFingerprintVisual } from './ForensicFingerprintVisual';

interface HeroSectionProps {
  onStartAnalysis: () => void;
  onExploreMethodology: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartAnalysis, onExploreMethodology }) => {
  return (
    <div className="space-y-16 py-8">
      
      {/* Hero Header on Warm Ivory Background */}
      <section className="relative site-container py-6 lg:py-10">
        <div className="hero-grid grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)] gap-8 lg:gap-[clamp(32px,5vw,80px)] items-center min-h-[clamp(560px,calc(100vh-130px),760px)]">
          
          <div className="hero-content max-w-[680px] space-y-6 min-w-0">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E6] border border-[#D9DED4] text-[#0D4F43] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0D4F43] animate-pulse"></span>
              <span>Multimedia Forensics & Attribution Lab</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-[clamp(36px,4.2vw,68px)] font-extrabold tracking-tight text-[#083C33] leading-[1.08]">
                DeepTrace Forensic Intelligence
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#1B4D3E]">
                Diagnose Authenticity. Attribute Provenance.
              </p>
            </div>

            <p className="text-sm sm:text-base lg:text-lg text-[#3D5A52] leading-relaxed font-normal">
              Advanced multi-domain implementation for deepfake source attribution. We translate high-pass noise residuals 
              and 2D Fourier frequency artifacts into rigorous, explainable forensic evidence.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
              <button
                onClick={onStartAnalysis}
                className="flex items-center space-x-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#0D4F43] hover:bg-[#125B4D] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Shield className="w-4 h-4 stroke-[2.5]" />
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreMethodology}
                className="flex items-center space-x-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-[#D9DED4] hover:bg-[#CAD2C4] text-[#083C33] text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileSearch className="w-4 h-4 text-[#0D4F43]" />
                <span>View Methodology</span>
              </button>
            </div>

            {/* Quick badges */}
            <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#3D5A52] font-medium">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D4F43] shrink-0" />
                <span>Spatial Rich Models (SRM)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D4F43] shrink-0" />
                <span>2D FFT & 2D DCT Analysis</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D4F43] shrink-0" />
                <span>Video Temporal Stability</span>
              </span>
            </div>
          </div>

          {/* Research Visual: Forensic Frequency Fingerprint Engine */}
          <div className="w-full flex items-center justify-center min-w-0">
            <ForensicFingerprintVisual />
          </div>

        </div>
      </section>

      {/* Signature Deep Forest Green Section matching reference image */}
      <section className="site-container">
        <div className="deep-forest-panel rounded-[36px] p-8 sm:p-14 space-y-16 border border-[#166355] shadow-sm">
          
          {/* Section Header */}
          <div className="max-w-3xl space-y-3">
            <span className="text-xs uppercase font-mono tracking-wider text-[#D9DED4]">
              Empirical Diagnostic Infrastructure
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F7F6F0] leading-tight">
              Rigorous Mathematical Attribution Across Spatial and Frequency Dimensions
            </h2>
            <p className="text-sm sm:text-base text-[#D9DED4]/90 leading-relaxed">
              Standard detectors rely on RGB pixel artifacts that vanish after compression. DeepTrace evaluates 
              the high-pass sensor residue and Fourier cosine coefficients where generator signatures remain indelible.
            </p>
          </div>

          {/* Research Statistics Grid in Translucent Forest Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#0D4F43]/70 rounded-2xl p-5 border border-[#166355] space-y-1">
              <span className="text-xs text-[#D9DED4] font-mono">Model Accuracy</span>
              <p className="text-xl font-bold text-[#F7F6F0]">Pending Evaluation</p>
              <p className="text-[11px] text-[#D9DED4]/80">Research integrity benchmark</p>
            </div>

            <div className="bg-[#0D4F43]/70 rounded-2xl p-5 border border-[#166355] space-y-1">
              <span className="text-xs text-[#D9DED4] font-mono">Supported Media</span>
              <p className="text-xl font-bold text-[#F7F6F0]">Image + Video</p>
              <p className="text-[11px] text-[#D9DED4]/80">Multi-frame temporal consistency</p>
            </div>

            <div className="bg-[#0D4F43]/70 rounded-2xl p-5 border border-[#166355] space-y-1">
              <span className="text-xs text-[#D9DED4] font-mono">Analysis Domains</span>
              <p className="text-xl font-bold text-[#F7F6F0]">Spatial + Freq + Temporal</p>
              <p className="text-[11px] text-[#D9DED4]/80">Cross-attention fusion network</p>
            </div>

            <div className="bg-[#0D4F43]/70 rounded-2xl p-5 border border-[#166355] space-y-1">
              <span className="text-xs text-[#D9DED4] font-mono">Attribution Classes</span>
              <p className="text-xl font-bold text-[#F7F6F0]">Dataset Dependent</p>
              <p className="text-[11px] text-[#D9DED4]/80">GAN & Diffusion model families</p>
            </div>
          </div>

          {/* 7-Step Forensic Pipeline */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#166355] pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#F7F6F0]">
                  Forensic Analysis Pipeline
                </h3>
                <p className="text-xs sm:text-sm text-[#D9DED4]/80 mt-1">
                  Seven-stage dual-branch verification architecture.
                </p>
              </div>
              <span className="text-xs font-mono text-[#D9DED4]">End-to-End Execution</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { step: '01', title: 'Media Upload', desc: 'MIME validation & magic bytes checking' },
                { step: '02', title: 'Preprocess', desc: 'Face detection & facial ROI alignment' },
                { step: '03', title: 'Extract Residual', desc: 'SRM 3x3 edge & high-pass noise' },
                { step: '04', title: 'FFT + DCT', desc: '2D Fourier spectrum & DCT energies' },
                { step: '05', title: 'Feature Fusion', desc: 'Spatial-frequency cross-attention' },
                { step: '06', title: 'Attribution', desc: 'Likely generator classification' },
                { step: '07', title: 'Explain & Report', desc: 'Grounded narrative & official PDF' },
              ].map((item, index) => (
                <div key={index} className="bg-[#0D4F43]/60 rounded-2xl p-4 border border-[#166355] flex flex-col justify-between hover:border-[#D9DED4] transition-all">
                  <span className="text-xs font-mono font-bold text-[#D9DED4]">{item.step}</span>
                  <div className="my-2">
                    <h4 className="text-xs font-bold text-[#F7F6F0] leading-tight">{item.title}</h4>
                    <p className="text-[10px] text-[#D9DED4]/80 leading-snug mt-1">{item.desc}</p>
                  </div>
                  <div className="h-1 w-full bg-[#083C33] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#D9DED4] rounded-full" style={{ width: `${(index + 1) * 14.28}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Focus Deep Dive */}
          <div className="space-y-6">
            <div className="border-b border-[#166355] pb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-[#F7F6F0]">
                Core Research Domains
              </h3>
              <p className="text-xs sm:text-sm text-[#D9DED4]/80 mt-1">
                Deconstructing how high-frequency anomalies expose synthetic generators when spatial pixels appear seamless.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0D4F43]/50 rounded-2xl p-6 border border-[#166355] space-y-3 hover:border-[#D9DED4] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#EBF0E6] flex items-center justify-center text-[#083C33]">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#F7F6F0]">Residual Steganalysis</h4>
                <p className="text-xs text-[#D9DED4]/90 leading-relaxed">
                  Natural camera sensors possess physical PRNU (Photo-Response Non-Uniformity). In synthetic generators, SRM 
                  high-pass filters isolate structural artifacts left by neural upsamplers and convolution kernels.
                </p>
              </div>

              <div className="bg-[#0D4F43]/50 rounded-2xl p-6 border border-[#166355] space-y-3 hover:border-[#D9DED4] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#EBF0E6] flex items-center justify-center text-[#083C33]">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#F7F6F0]">2D FFT & DCT Fingerprints</h4>
                <p className="text-xs text-[#D9DED4]/90 leading-relaxed">
                  Convolutional transposed layers and latent diffusion decoders induce periodic grid repetitions that project into distinct, 
                  quantifiable radial peaks and high-frequency coefficient distributions in Fourier and Cosine spectra.
                </p>
              </div>

              <div className="bg-[#0D4F43]/50 rounded-2xl p-6 border border-[#166355] space-y-3 hover:border-[#D9DED4] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#EBF0E6] flex items-center justify-center text-[#083C33]">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#F7F6F0]">Temporal Consistency</h4>
                <p className="text-xs text-[#D9DED4]/90 leading-relaxed">
                  Video deepfakes synthesized frame-by-frame often exhibit subtle sub-pixel flickering between frames. 
                  Our temporal analyzer samples frame sequences and measures inter-frame spectral variance to detect high jitter.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
