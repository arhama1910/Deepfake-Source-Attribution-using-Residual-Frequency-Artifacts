import React, { useState } from 'react';
import { Download, Maximize2, X } from 'lucide-react';
import type { VisualArtifacts } from '../../types/forensics';

interface FourPanelViewerProps {
  artifacts: VisualArtifacts;
  filename: string;
}

export const FourPanelViewer: React.FC<FourPanelViewerProps> = ({ artifacts, filename }) => {
  const [modalImage, setModalImage] = useState<{ title: string; url: string } | null>(null);

  const panels = [
    {
      id: 'original',
      title: 'Original Aligned ROI',
      desc: 'RGB Spatial Face / Object Region',
      url: artifacts.original,
      badgeColor: 'border-slate-700 text-slate-300 bg-slate-900/60'
    },
    {
      id: 'residual',
      title: 'Residual Noise (SRM 3x3 Edge)',
      desc: 'High-Pass Sensor & Generative Artifacts',
      url: artifacts.residual,
      badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-950/40'
    },
    {
      id: 'fft',
      title: '2D FFT Power Spectrum',
      desc: 'Log-Scaled Radial Frequency Profile',
      url: artifacts.fft,
      badgeColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/40'
    },
    {
      id: 'dct',
      title: '2D DCT Coefficient Matrix',
      desc: 'Orthonormal Cosine Basis Distribution',
      url: artifacts.dct,
      badgeColor: 'border-purple-500/30 text-purple-300 bg-purple-950/40'
    }
  ];

  const handleDownload = (url: string, title: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${title.toLowerCase().replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Dual-Domain Forensic Evidence Gallery</span>
          </h3>
          <p className="text-xs text-slate-400">
            Synchronized decomposition across spatial, high-pass residual, and orthogonal frequency domains.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {panels.map((p) => (
          <div
            key={p.id}
            className="group relative rounded-2xl glass-panel border border-slate-800/80 overflow-hidden flex flex-col justify-between hover:border-cyan-500/30 transition-all"
          >
            {/* Panel Header */}
            <div className="p-3 border-b border-slate-800/60 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${p.badgeColor}`}>
                {p.title}
              </span>

              {p.url && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setModalImage({ title: p.title, url: p.url! })}
                    title="Fullscreen inspection"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownload(p.url!, p.title)}
                    title="Download artifact"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Image Frame */}
            <div className="relative aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              {p.url ? (
                <img
                  src={p.url}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
                  onClick={() => setModalImage({ title: p.title, url: p.url! })}
                />
              ) : (
                <div className="text-xs text-slate-600 font-mono">Artifact Pending</div>
              )}
            </div>

            {/* Footer description */}
            <div className="p-2.5 bg-slate-950/60 border-t border-slate-900 text-[11px] text-slate-400">
              {p.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Inspection Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative max-w-4xl w-full glass-panel rounded-3xl p-4 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white font-mono">{modalImage.title}</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(modalImage.url, modalImage.title)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setModalImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative max-h-[75vh] w-full flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden p-2">
              <img
                src={modalImage.url}
                alt={modalImage.title}
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
