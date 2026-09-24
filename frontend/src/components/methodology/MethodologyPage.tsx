import React from 'react';
import { Layers, Activity, GitBranch, ArrowDown, Cpu, Zap } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="site-container space-y-12 py-8">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E6] border border-[#D9DED4] text-[#0D4F43] text-xs font-semibold">
          <span>Theoretical Framework</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#083C33]">
          Research Methodology & Architecture
        </h1>
        <p className="text-[#3D5A52] text-sm max-w-2xl mx-auto leading-relaxed">
          How spatial-frequency decomposition isolates generator-specific artifacts beyond human visual perception.
        </p>
      </div>

      {/* Interactive System Flowchart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9DED4] shadow-sm space-y-6">
        <h3 className="text-base font-bold text-[#083C33] flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-[#0D4F43]" />
          <span>End-to-End System Pipeline</span>
        </h3>

        {/* System Diagram in Clinical Forest Green container */}
        <div className="p-8 rounded-2xl bg-[#083C33] border border-[#166355] overflow-x-auto text-[#F7F6F0]">
          <div className="min-w-[650px] flex flex-col items-center space-y-4 text-xs font-mono">
            
            {/* Input Layer */}
            <div className="flex items-center space-x-8">
              <div className="px-5 py-2.5 rounded-xl bg-[#0D4F43] border border-[#166355] text-white font-bold shadow-sm">
                Input Image (RGB)
              </div>
              <span className="text-[#D9DED4] font-sans font-bold">OR</span>
              <div className="px-5 py-2.5 rounded-xl bg-[#0D4F43] border border-[#166355] text-white font-bold shadow-sm">
                Input Video (MP4 / WebM)
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-[#D9DED4]" />

            {/* Preprocessing */}
            <div className="px-6 py-2.5 rounded-xl bg-[#0D4F43] border border-[#166355] text-[#F7F6F0] font-bold shadow-sm">
              Face Detection & ROI Normalization (512 x 512 Aligned)
            </div>

            <ArrowDown className="w-4 h-4 text-[#D9DED4]" />

            {/* Residual Extraction */}
            <div className="px-6 py-2.5 rounded-xl bg-[#125B4D] border border-[#1E7866] text-white font-bold shadow-sm">
              Spatial Residual Noise Extraction (SRM 3x3 Edge + Laplacian High-Pass)
            </div>

            <ArrowDown className="w-4 h-4 text-[#D9DED4]" />

            {/* Dual Branches */}
            <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
              <div className="p-4 rounded-xl bg-[#0D4F43] border border-[#166355] text-center space-y-1">
                <span className="text-[#F7F6F0] font-bold block">Spatial RGB Branch</span>
                <span className="text-[11px] text-[#D9DED4]">Vision Transformer / CNN Backbone</span>
              </div>

              <div className="p-4 rounded-xl bg-[#0D4F43] border border-[#166355] text-center space-y-1">
                <span className="text-[#F7F6F0] font-bold block">Frequency Branch</span>
                <span className="text-[11px] text-[#D9DED4]">2D FFT Spectrum + 2D DCT Matrices</span>
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-[#D9DED4]" />

            {/* Fusion */}
            <div className="px-8 py-3 rounded-xl bg-[#125B4D] border border-[#1E7866] text-white font-bold text-center shadow-sm">
              Spatial-Frequency Cross-Attention Fusion Layer
            </div>

            <ArrowDown className="w-4 h-4 text-[#D9DED4]" />

            {/* Dual Heads */}
            <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
              <div className="p-4 rounded-xl bg-[#0D4F43] border border-[#166355] text-center">
                <span className="text-[#F7F6F0] font-bold block">Binary Detection Head</span>
                <span className="text-[10px] text-[#D9DED4]">P(Synthetic vs Authentic)</span>
              </div>

              <div className="p-4 rounded-xl bg-[#0D4F43] border border-[#166355] text-center">
                <span className="text-[#F7F6F0] font-bold block">Source Attribution Head</span>
                <span className="text-[10px] text-[#D9DED4]">StyleGAN / Diffusion Classes</span>
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-[#D9DED4]" />

            {/* Explainable AI */}
            <div className="px-6 py-2.5 rounded-xl bg-[#0D4F43] border border-[#166355] text-[#D9DED4]">
              Explainable AI Narrative & PDF Forensic Case Sheet
            </div>

          </div>
        </div>
      </div>

      {/* Algorithmic Modules Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Module 1: SRM Residuals */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D9DED4] shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-[#0D4F43] font-bold text-sm">
            <Layers className="w-4 h-4" />
            <span>1. Spatial Rich Models (SRM)</span>
          </div>
          <p className="text-xs text-[#2D3F3A] leading-relaxed">
            Standard deepfake detectors inspect RGB pixels directly, which are susceptible to semantic bias.
            DeepTrace AI applies linear high-pass filters from digital image steganalysis:
          </p>
          <div className="p-3.5 rounded-xl bg-[#EBF0E6] font-mono text-[11px] text-[#083C33] border border-[#D9DED4]">
            K_edge = [[ -1,  2, -1 ],<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[  2, -4,  2 ],<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ -1,  2, -1 ]]
          </div>
          <p className="text-[11px] text-[#3D5A52] leading-relaxed">
            By subtracting the low-frequency image content, the residual highlights subtle sub-pixel noise variances.
          </p>
        </div>

        {/* Module 2: 2D FFT & Azimuthal Average */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D9DED4] shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-[#0D4F43] font-bold text-sm">
            <Activity className="w-4 h-4" />
            <span>2. 2D Fast Fourier Transform (FFT)</span>
          </div>
          <p className="text-xs text-[#2D3F3A] leading-relaxed">
            The 2D Discrete Fourier Transform maps spatial pixel coordinates (x, y) into spatial frequency domain (u, v):
          </p>
          <div className="p-3.5 rounded-xl bg-[#EBF0E6] font-mono text-[11px] text-[#083C33] border border-[#D9DED4]">
            F(u, v) = &sum; &sum; f(x, y) &bull; e^[-j2&pi;(ux/M + vy/N)]<br/>
            S(u, v) = log(1 + |F_shift(u, v)|)
          </div>
          <p className="text-[11px] text-[#3D5A52] leading-relaxed">
            We compute radial averages across concentric radius rings r = &radic;(u&sup2; + v&sup2;) to measure energy decay curves.
          </p>
        </div>

        {/* Module 3: 2D DCT */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D9DED4] shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-[#0D4F43] font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <span>3. 2D Discrete Cosine Transform (DCT)</span>
          </div>
          <p className="text-xs text-[#2D3F3A] leading-relaxed">
            Type-II orthonormal 2D DCT concentrates spatial image energy into orthogonal basis coefficients:
          </p>
          <div className="p-3.5 rounded-xl bg-[#EBF0E6] font-mono text-[11px] text-[#083C33] border border-[#D9DED4]">
            C(u, v) = &alpha;(u)&alpha;(v) &sum;&sum; f(x,y) cos(...) cos(...)
          </div>
          <p className="text-[11px] text-[#3D5A52] leading-relaxed">
            Low frequencies cluster at (0,0), while high diagonal frequencies quantify compression and generative artifacts.
          </p>
        </div>

        {/* Module 4: Temporal Stability */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D9DED4] shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-[#0D4F43] font-bold text-sm">
            <Zap className="w-4 h-4" />
            <span>4. Video Temporal Consistency</span>
          </div>
          <p className="text-xs text-[#2D3F3A] leading-relaxed">
            For video streams, frames are sampled uniformly across the timeline. We calculate the inter-frame spectral variance:
          </p>
          <div className="p-3.5 rounded-xl bg-[#EBF0E6] font-mono text-[11px] text-[#083C33] border border-[#D9DED4]">
            Jitter = std( &Delta; HF_Ratio_(t, t-1) )<br/>
            Consistency = max(0, 1.0 - 4 &bull; Jitter)
          </div>
          <p className="text-[11px] text-[#3D5A52] leading-relaxed">
            Frame-by-frame deepfake generators suffer from inter-frame frequency flicker that this metric isolates.
          </p>
        </div>

      </div>

    </div>
  );
};
