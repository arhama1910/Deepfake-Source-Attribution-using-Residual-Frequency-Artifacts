import React from 'react';
import { Layers, Activity, GitBranch, ArrowDown, Cpu, Zap } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8 px-4 sm:px-6">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <span>Theoretical Framework</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Research Methodology & Architecture
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
          How spatial-frequency decomposition isolates generator-specific artifacts beyond human visual perception.
        </p>
      </div>

      {/* Interactive System Flowchart */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          <span>End-to-End System Pipeline</span>
        </h3>

        {/* SVG Flowchart Diagram */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 overflow-x-auto">
          <div className="min-w-[650px] flex flex-col items-center space-y-4 text-xs font-mono">
            
            {/* Input Layer */}
            <div className="flex items-center space-x-8">
              <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold">
                Input Image (RGB)
              </div>
              <span className="text-slate-500 font-sans">OR</span>
              <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold">
                Input Video (MP4 / WebM)
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-cyan-400" />

            {/* Preprocessing */}
            <div className="px-5 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-bold">
              Face Detection & ROI Normalization (512 x 512 Aligned)
            </div>

            <ArrowDown className="w-4 h-4 text-cyan-400" />

            {/* Residual Extraction */}
            <div className="px-5 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-bold">
              Spatial Residual Noise Extraction (SRM 3x3 Edge + Laplacian High-Pass)
            </div>

            <ArrowDown className="w-4 h-4 text-cyan-400" />

            {/* Dual Branches */}
            <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-center space-y-1">
                <span className="text-indigo-400 font-bold block">Spatial RGB Branch</span>
                <span className="text-[11px] text-slate-400">Vision Transformer / CNN Backbone</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-center space-y-1">
                <span className="text-cyan-400 font-bold block">Frequency Branch</span>
                <span className="text-[11px] text-slate-400">2D FFT Spectrum + 2D DCT Matrices</span>
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-cyan-400" />

            {/* Fusion */}
            <div className="px-6 py-3 rounded-xl bg-indigo-950/50 border border-indigo-500/40 text-indigo-300 font-bold text-center">
              Spatial-Frequency Cross-Attention Fusion Layer
            </div>

            <ArrowDown className="w-4 h-4 text-cyan-400" />

            {/* Dual Heads */}
            <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-center">
                <span className="text-emerald-400 font-bold block">Binary Detection</span>
                <span className="text-[10px] text-slate-400">P(Synthetic vs Authentic)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/30 text-center">
                <span className="text-purple-400 font-bold block">Source Attribution</span>
                <span className="text-[10px] text-slate-400">StyleGAN / Diffusion Classes</span>
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-cyan-400" />

            {/* Explainable AI */}
            <div className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
              Explainable AI Narrative & PDF Forensic Case Sheet
            </div>

          </div>
        </div>
      </div>

      {/* Algorithmic Modules Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Module 1: SRM Residuals */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
            <Layers className="w-4 h-4" />
            <span>1. Spatial Rich Models (SRM)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Standard deepfake detectors inspect RGB pixels directly, which are susceptible to semantic bias.
            DeepTrace AI applies linear high-pass filters from digital image steganalysis:
          </p>
          <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-900">
            K_edge = [[ -1,  2, -1 ],<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[  2, -4,  2 ],<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ -1,  2, -1 ]]
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            By subtracting the low-frequency image content, the residual highlights subtle sub-pixel noise variances.
          </p>
        </div>

        {/* Module 2: 2D FFT & Azimuthal Average */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
            <Activity className="w-4 h-4" />
            <span>2. 2D Fast Fourier Transform (FFT)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The 2D Discrete Fourier Transform maps spatial pixel coordinates (x, y) into spatial frequency domain (u, v):
          </p>
          <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-indigo-300 border border-slate-900">
            F(u, v) = &sum; &sum; f(x, y) &bull; e^[-j2&pi;(ux/M + vy/N)]<br/>
            S(u, v) = log(1 + |F_shift(u, v)|)
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            We compute radial averages across concentric radius rings r = &radic;(u&sup2; + v&sup2;) to measure energy decay curves.
          </p>
        </div>

        {/* Module 3: 2D DCT */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <span>3. 2D Discrete Cosine Transform (DCT)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Type-II orthonormal 2D DCT concentrates spatial image energy into orthogonal basis coefficients:
          </p>
          <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-purple-300 border border-slate-900">
            C(u, v) = &alpha;(u)&alpha;(v) &sum;&sum; f(x,y) cos(...) cos(...)
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Low frequencies cluster at (0,0), while high diagonal frequencies quantify compression and generative artifacts.
          </p>
        </div>

        {/* Module 4: Temporal Stability */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
            <Zap className="w-4 h-4" />
            <span>4. Video Temporal Consistency</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            For video streams, frames are sampled uniformly across the timeline. We calculate the inter-frame spectral variance:
          </p>
          <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-sky-300 border border-slate-900">
            Jitter = std( &Delta; HF_Ratio_(t, t-1) )<br/>
            Consistency = max(0, 1.0 - 4 &bull; Jitter)
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Frame-by-frame deepfake generators suffer from inter-frame frequency flicker that this metric isolates.
          </p>
        </div>

      </div>

    </div>
  );
};
