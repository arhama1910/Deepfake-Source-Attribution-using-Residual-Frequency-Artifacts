import React, { useEffect, useRef } from 'react';
import { Shield, ArrowRight, Activity, Layers, FileSearch, Zap, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onStartAnalysis: () => void;
  onExploreMethodology: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartAnalysis, onExploreMethodology }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated forensic frequency canvas simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      t += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = '#070a12';
      ctx.fillRect(0, 0, w, h);

      // Fine forensic grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
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

      // Concentric FFT frequency rings
      const numRings = 7;
      for (let i = 1; i <= numRings; i++) {
        const radius = (i * 28) + Math.sin(t + i) * 3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(129, 140, 248, 0.2)';
        ctx.setLineDash([4, 6]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Generative frequency spikes (simulating GAN checkerboard spectral peaks)
      const numSpikes = 8;
      for (let s = 0; s < numSpikes; s++) {
        const angle = (s * (Math.PI / 4)) + (t * 0.15);
        const spikeDist = 110 + Math.sin(t * 2 + s) * 20;
        const px = cx + Math.cos(angle) * spikeDist;
        const py = cy + Math.sin(angle) * spikeDist;

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Line to center
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.stroke();
      }

      // Dynamic scanning beam
      const scanY = (Math.sin(t * 0.8) * 0.5 + 0.5) * h;
      const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.25)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 20, w, 40);

      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="space-y-24 py-12">
      
      {/* Hero Header */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>M.Tech Multimedia Forensics & Attribution Lab</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Trace the <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Fingerprint</span> Behind Synthetic Media.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
              DeepTrace AI investigates spatial, residual noise, and 2D frequency-domain artifacts 
              to investigate the likely generative source architecture of AI-synthesized images and videos.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStartAnalysis}
                className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Shield className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Launch Media Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreMethodology}
                className="flex items-center space-x-2 px-5 py-3.5 rounded-xl glass-panel glass-panel-hover text-slate-200 text-sm font-semibold border border-slate-700/80 hover:bg-slate-800/80 transition-all"
              >
                <FileSearch className="w-4 h-4 text-cyan-400" />
                <span>Explore Methodology</span>
              </button>
            </div>

            {/* Quick badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-mono">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Spatial Rich Models (SRM)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>2D FFT & 2D DCT Analysis</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Video Temporal Stability</span>
              </span>
            </div>
          </div>

          {/* Forensic Visual Animation Canvas */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden glass-panel border border-cyan-500/20 shadow-2xl p-1">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={460}
                  className="w-full h-full object-cover"
                />
                
                {/* HUD overlays */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-cyan-400 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <span>SPECTRAL_RESIDUAL_MONITOR</span>
                </div>

                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400">
                  DOMAIN: 2D-FFT / SRM
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Research Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-1">
            <span className="text-xs text-slate-400 font-mono">Model Accuracy</span>
            <p className="text-lg font-bold text-cyan-400">Pending Evaluation</p>
            <p className="text-[11px] text-slate-400">Research integrity benchmark</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-1">
            <span className="text-xs text-slate-400 font-mono">Supported Media</span>
            <p className="text-lg font-bold text-white">Image + Video</p>
            <p className="text-[11px] text-slate-400">Multi-frame temporal consistency</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-1">
            <span className="text-xs text-slate-400 font-mono">Analysis Domains</span>
            <p className="text-lg font-bold text-indigo-400">Spatial + Freq + Temporal</p>
            <p className="text-[11px] text-slate-400">Cross-attention fusion network</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-1">
            <span className="text-xs text-slate-400 font-mono">Attribution Classes</span>
            <p className="text-lg font-bold text-emerald-400">Dataset Dependent</p>
            <p className="text-[11px] text-slate-400">GAN & Diffusion model families</p>
          </div>
        </div>
      </section>

      {/* How It Works - Pipeline Diagram */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Forensic Analysis Pipeline
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From raw input media through dual-domain feature extraction to source attribution.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { step: '01', title: 'Media Upload', desc: 'MIME validation & magic bytes checking' },
            { step: '02', title: 'Preprocess', desc: 'Face detection & facial ROI alignment' },
            { step: '03', title: 'Extract Residual', desc: 'SRM 3x3 edge & Laplacian high-pass noise' },
            { step: '04', title: 'FFT + DCT', desc: '2D Fourier spectrum & DCT coefficient energies' },
            { step: '05', title: 'Feature Fusion', desc: 'Spatial-frequency cross-attention embedding' },
            { step: '06', title: 'Attribution', desc: 'Likely generator architecture classification' },
            { step: '07', title: 'Explain & Report', desc: 'Grounded LLM report & downloadable PDF' },
          ].map((item, index) => (
            <div key={index} className="glass-panel rounded-xl p-4 border border-slate-800/80 relative flex flex-col justify-between hover:border-cyan-500/30 transition-all">
              <span className="text-xs font-mono font-bold text-cyan-400/80">{item.step}</span>
              <div className="my-2">
                <h4 className="text-xs font-bold text-white leading-tight">{item.title}</h4>
                <p className="text-[10px] text-slate-400 leading-snug mt-1">{item.desc}</p>
              </div>
              <div className="h-0.5 w-full bg-slate-800 rounded mt-2">
                <div className="h-full bg-cyan-500/40 rounded" style={{ width: `${(index + 1) * 14}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Research Focus Deep Dive */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Core Research Domains
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Why frequency and residual artifacts expose synthetic generators when spatial pixels appear seamless.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-3 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Residual Steganalysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Natural camera sensors possess physical PRNU (Photo-Response Non-Uniformity). In synthetic generators, SRM (Spatial Rich Model) 
              high-pass filters strip semantic facial content, isolating structural noise artifacts left by neural upsamplers.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-3 hover:border-indigo-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">2D FFT & DCT Fingerprints</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Convolutional transposed layers and latent diffusion decoders create periodic pixel repetitions that project into distinct, 
              quantifiable radial peaks and high-frequency coefficient distributions in the Fourier and Cosine transform spectra.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-3 hover:border-sky-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Temporal Consistency</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Video deepfakes synthesized frame-by-frame often exhibit subtle sub-pixel flickering between frames. 
              Our temporal analyzer samples frame sequences and measures inter-frame spectral variance to detect high temporal jitter.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
