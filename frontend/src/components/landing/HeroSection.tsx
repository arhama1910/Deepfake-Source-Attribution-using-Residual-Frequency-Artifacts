import React, { useEffect, useRef } from 'react';
import { Shield, ArrowRight, Activity, Layers, FileSearch, Zap, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onStartAnalysis: () => void;
  onExploreMethodology: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartAnalysis, onExploreMethodology }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated forensic frequency canvas in sophisticated forest green & warm ivory
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      t += 0.015;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Deep forest background
      ctx.fillStyle = '#083C33';
      ctx.fillRect(0, 0, w, h);

      // Fine clinical forensic grid
      ctx.strokeStyle = 'rgba(217, 222, 212, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Concentric FFT frequency rings in ivory & sage
      const numRings = 7;
      for (let i = 1; i <= numRings; i++) {
        const radius = (i * 28) + Math.sin(t + i) * 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(247, 246, 240, 0.28)' : 'rgba(217, 222, 212, 0.18)';
        ctx.setLineDash([4, 6]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Generative frequency spikes (simulating spectral peaks in Fourier space)
      const numSpikes = 8;
      for (let s = 0; s < numSpikes; s++) {
        const angle = (s * (Math.PI / 4)) + (t * 0.12);
        const spikeDist = 110 + Math.sin(t * 1.5 + s) * 16;
        const px = cx + Math.cos(angle) * spikeDist;
        const py = cy + Math.sin(angle) * spikeDist;

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#F7F6F0';
        ctx.fill();

        // Line to center
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = 'rgba(217, 222, 212, 0.15)';
        ctx.stroke();
      }

      // Restrained scanning sweep in soft emerald
      const scanY = (Math.sin(t * 0.6) * 0.5 + 0.5) * h;
      const grad = ctx.createLinearGradient(0, scanY - 24, 0, scanY + 24);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, 'rgba(18, 91, 77, 0.35)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 24, w, 48);

      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.strokeStyle = 'rgba(247, 246, 240, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="space-y-16 py-8">
      
      {/* Hero Header on Warm Ivory Background */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E6] border border-[#D9DED4] text-[#0D4F43] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0D4F43] animate-pulse"></span>
              <span>M.Tech Multimedia Forensics & Attribution Lab</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#083C33] leading-[1.12]">
                DeepTrace Forensic Intelligence
              </h1>
              <p className="text-xl sm:text-2xl font-semibold text-[#1B4D3E]">
                Diagnose Authenticity. Attribute Provenance.
              </p>
            </div>

            <p className="text-base sm:text-lg text-[#3D5A52] leading-relaxed font-normal max-w-2xl">
              Advanced multi-domain implementation for deepfake source attribution. We translate high-pass noise residuals 
              and 2D Fourier frequency artifacts into rigorous, explainable forensic evidence.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStartAnalysis}
                className="flex items-center space-x-2.5 px-7 py-3.5 rounded-full bg-[#0D4F43] hover:bg-[#125B4D] text-white font-semibold text-sm tracking-wide shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Shield className="w-4 h-4 stroke-[2.5]" />
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreMethodology}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-[#D9DED4] hover:bg-[#CAD2C4] text-[#083C33] text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileSearch className="w-4 h-4 text-[#0D4F43]" />
                <span>View Methodology</span>
              </button>
            </div>

            {/* Quick badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#3D5A52] font-medium">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D4F43]" />
                <span>Spatial Rich Models (SRM)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D4F43]" />
                <span>2D FFT & 2D DCT Analysis</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D4F43]" />
                <span>Video Temporal Stability</span>
              </span>
            </div>
          </div>

          {/* Research Visual Container with Reference-Inspired Badges */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[32px] bg-[#EBF0E6] border border-[#D9DED4] p-3.5 shadow-sm">
              <div className="relative aspect-square w-full rounded-[24px] overflow-hidden bg-[#083C33] border border-[#166355]">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={460}
                  className="w-full h-full object-cover"
                />
                
                {/* Spectral Domain Label */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#083C33]/85 backdrop-blur-md border border-[#166355] text-[10px] font-mono text-[#F7F6F0] flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9DED4] animate-ping"></span>
                  <span>SPECTRAL_RESIDUAL_MONITOR</span>
                </div>
              </div>

              {/* Sample benchmark chip at bottom-left */}
              <div className="absolute -bottom-4 left-6 flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#D9DED4] shadow-sm text-xs font-semibold text-[#083C33]">
                <div className="flex -space-x-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#0D4F43] text-white text-[10px] flex items-center justify-center font-bold">FF</span>
                  <span className="w-6 h-6 rounded-full bg-[#125B4D] text-white text-[10px] flex items-center justify-center font-bold">GI</span>
                  <span className="w-6 h-6 rounded-full bg-[#2A6E5F] text-white text-[10px] flex items-center justify-center font-bold">DF</span>
                </div>
                <span className="pl-1">2.4k+ Benchmarked</span>
              </div>

              {/* Reference-matching Live Monitoring Badge at bottom-right */}
              <div className="absolute -bottom-4 right-6 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-[#D9DED4] shadow-sm text-left">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#083C33]">
                  <span className="w-2 h-2 rounded-full bg-[#0D4F43] animate-pulse"></span>
                  <span>Live Monitoring</span>
                </div>
                <div className="text-[10px] text-[#4A635D] font-mono mt-0.5">
                  Dual-Stream Analysis...
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Signature Deep Forest Green Section matching reference image */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
