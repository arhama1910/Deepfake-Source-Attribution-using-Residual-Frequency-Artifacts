import React from 'react';
import { Sparkles, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface ExplainabilityCardProps {
  explanation: string;
  modelVersion?: string;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({ explanation, modelVersion }) => {
  // Format markdown-like bold and headers from the explanation
  const paragraphs = explanation.split('\n\n');

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-6">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Explainable AI Forensic Narrative</h3>
            <p className="text-xs text-slate-400">
              Grounded empirical reasoning synthesized from extracted frequency and residual fingerprints.
            </p>
          </div>
        </div>

        {modelVersion && (
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            Engine: {modelVersion}
          </span>
        )}
      </div>

      {/* Structured Text Content */}
      <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
        {paragraphs.map((para, idx) => {
          if (!para.trim()) return null;
          
          // Check if it's the disclaimer at the bottom
          const isDisclaimer = para.includes('[Forensic Disclaimer');
          
          if (isDisclaimer) {
            return (
              <div key={idx} className="mt-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-normal flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{para.replace(/\[Forensic Disclaimer:\s*|\s*\]/g, '')}</span>
              </div>
            );
          }

          // Parse markdown bold text (**text**)
          const formattedParts = para.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          return (
            <p key={idx} className="text-slate-300">
              {formattedParts}
            </p>
          );
        })}
      </div>

    </div>
  );
};
