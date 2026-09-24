import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface ExplainabilityCardProps {
  explanation: string;
  modelVersion?: string;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({ explanation, modelVersion }) => {
  // Format markdown-like bold and headers from the explanation
  const paragraphs = explanation.split('\n\n');

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9DED4] shadow-sm space-y-6">
      
      <div className="flex items-center justify-between pb-4 border-b border-[#D9DED4]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF0E6] border border-[#D9DED4] flex items-center justify-center text-[#0D4F43]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#083C33]">Explainable AI Forensic Narrative</h3>
            <p className="text-xs text-[#3D5A52]">
              Grounded empirical reasoning synthesized from extracted frequency and residual fingerprints.
            </p>
          </div>
        </div>

        {modelVersion && (
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#EBF0E6] border border-[#D9DED4] text-[11px] font-mono text-[#083C33] font-semibold">
            Engine: {modelVersion}
          </span>
        )}
      </div>

      {/* Structured Text Content */}
      <div className="space-y-4 text-xs sm:text-sm text-[#2D3F3A] leading-relaxed">
        {paragraphs.map((para, idx) => {
          if (!para.trim()) return null;
          
          // Check if it's the disclaimer at the bottom
          const isDisclaimer = para.includes('[Forensic Disclaimer');
          
          if (isDisclaimer) {
            return (
              <div key={idx} className="mt-6 p-4 rounded-2xl bg-[#FDF9F0] border border-[#E6DAC0] text-[11px] text-[#7A612D] leading-normal flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 text-[#8C6D27] shrink-0 mt-0.5" />
                <span>{para.replace(/\[Forensic Disclaimer:\s*|\s*\]/g, '')}</span>
              </div>
            );
          }

          // Parse markdown bold text (**text**)
          const formattedParts = para.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-[#083C33]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          return (
            <p key={idx} className="text-[#2D3F3A]">
              {formattedParts}
            </p>
          );
        })}
      </div>

    </div>
  );
};
