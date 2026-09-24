import React from 'react';
import { Shield, Cpu, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 py-10 mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>DeepTrace AI</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Deepfake Source Attribution Using Residual Frequency Artifacts
            </p>
            <p className="text-cyan-400/80 text-[11px] font-mono mt-0.5">
              “Tracing Synthetic Media Beyond the Surface.”
            </p>
          </div>

          <div className="flex items-center space-x-6 text-[11px] font-mono text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dual Spatial-Frequency Architecture</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Permanent Retention</span>
            </span>
          </div>
        </div>

        {/* Forensic & Research Integrity Statement */}
        <div className="rounded-xl p-4 bg-slate-900/40 border border-slate-800/60 text-[11px] leading-relaxed text-slate-400 space-y-2">
          <p className="font-semibold text-slate-300 flex items-center space-x-1.5">
            <span>Research Integrity & Legal Admissibility Disclaimer:</span>
          </p>
          <p>
            DeepTrace AI performs mathematical source attribution based on empirical frequency representations (2D FFT, 2D DCT) and high-pass noise residuals (Spatial Rich Models). 
            Predictions indicate learned similarity to known generative architectures (StyleGAN, Diffusion, etc.) within trained dataset distributions and do not constitute absolute device-level physical provenance.
            Uploaded media is processed ephemerally in accordance with privacy safeguards and automatically purged.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] font-mono">
          <p>© {new Date().getFullYear()} DeepTrace AI Research Project. M.Tech Thesis Implementation.</p>
          <p className="mt-2 sm:mt-0">FastAPI • PyTorch • OpenCV • React • TypeScript</p>
        </div>

      </div>
    </footer>
  );
};
