import React from 'react';
import { Shield, Cpu, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#166355] bg-[#083C33] py-12 mt-20 text-[#D9DED4] text-xs">
      <div className="site-container space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#166355]">
          <div>
            <div className="flex items-center space-x-3 text-[#F7F6F0] font-bold text-sm">
              <img src="/logo.png" alt="DeepTrace AI Logo" className="w-6 h-6 object-contain" />
              <span>DeepTrace AI</span>
            </div>
            <p className="text-[#D9DED4]/90 text-xs mt-1">
              Deepfake Source Attribution Using Residual Frequency Artifacts
            </p>
            <p className="text-[#D9DED4]/70 text-[11px] font-mono mt-0.5">
              “Tracing Synthetic Media Beyond the Surface.”
            </p>
          </div>

          <div className="flex items-center space-x-6 text-[11px] font-mono text-[#D9DED4]">
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#D9DED4]" />
              <span>Dual Spatial-Frequency Architecture</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-[#D9DED4]" />
              <span>Zero Permanent Retention</span>
            </span>
          </div>
        </div>

        {/* Forensic & Research Integrity Statement */}
        <div className="rounded-2xl p-5 bg-[#0D4F43]/60 border border-[#166355] text-[11px] leading-relaxed text-[#D9DED4]/90 space-y-2">
          <p className="font-semibold text-[#F7F6F0] flex items-center space-x-1.5">
            <span>Research Integrity & Legal Admissibility Disclaimer:</span>
          </p>
          <p>
            DeepTrace AI performs mathematical source attribution based on empirical frequency representations (2D FFT, 2D DCT) and high-pass noise residuals (Spatial Rich Models).
            Predictions indicate learned similarity to known generative architectures (StyleGAN, Diffusion, etc.) within trained dataset distributions and do not constitute absolute device-level physical provenance.
            Uploaded media is processed ephemerally in accordance with privacy safeguards and automatically purged.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[#D9DED4]/70 text-[11px] font-mono pt-2">
          <p>© {new Date().getFullYear()} DeepTrace AI Research Project by Ansari Arhama Najmul Kalam.</p>
          <p className="mt-2 sm:mt-0">FastAPI • PyTorch • OpenCV • React • TypeScript</p>
        </div>

      </div>
    </footer>
  );
};
