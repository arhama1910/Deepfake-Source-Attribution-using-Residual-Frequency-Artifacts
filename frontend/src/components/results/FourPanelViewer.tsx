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
      badgeColor: 'border-[#D9DED4] text-[#083C33] bg-[#EBF0E6]'
    },
    {
      id: 'residual',
      title: 'Residual Noise (SRM 3x3 Edge)',
      desc: 'High-Pass Sensor & Generative Artifacts',
      url: artifacts.residual,
      badgeColor: 'border-[#D9DED4] text-[#083C33] bg-[#EBF0E6]'
    },
    {
      id: 'fft',
      title: '2D FFT Power Spectrum',
      desc: 'Log-Scaled Radial Frequency Profile',
      url: artifacts.fft,
      badgeColor: 'border-[#D9DED4] text-[#0D4F43] bg-[#EBF0E6]'
    },
    {
      id: 'dct',
      title: '2D DCT Coefficient Matrix',
      desc: 'Orthonormal Cosine Basis Distribution',
      url: artifacts.dct,
      badgeColor: 'border-[#D9DED4] text-[#083C33] bg-[#EBF0E6]'
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
          <h3 className="text-base font-bold text-[#083C33] flex items-center space-x-2">
            <span>Dual-Domain Forensic Evidence Gallery</span>
          </h3>
          <p className="text-xs text-[#3D5A52]">
            Synchronized decomposition across spatial, high-pass residual, and orthogonal frequency domains.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {panels.map((p) => (
          <div
            key={p.id}
            className="group relative rounded-2xl bg-white border border-[#D9DED4] shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#0D4F43] hover:shadow-md transition-all"
          >
            {/* Panel Header */}
            <div className="p-3 border-b border-[#D9DED4] flex items-center justify-between bg-white">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${p.badgeColor}`}>
                {p.title}
              </span>

              {p.url && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setModalImage({ title: p.title, url: p.url! })}
                    title="Fullscreen inspection"
                    className="p-1 rounded-lg hover:bg-[#EBF0E6] text-[#3D5A52] hover:text-[#083C33]"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownload(p.url!, p.title)}
                    title="Download artifact"
                    className="p-1 rounded-lg hover:bg-[#EBF0E6] text-[#3D5A52] hover:text-[#083C33]"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Image Frame */}
            <div className="relative aspect-square w-full bg-[#083C33] flex items-center justify-center overflow-hidden">
              {p.url ? (
                <img
                  src={p.url}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
                  onClick={() => setModalImage({ title: p.title, url: p.url! })}
                />
              ) : (
                <div className="text-xs text-[#D9DED4] font-mono">Artifact Pending</div>
              )}
            </div>

            {/* Footer description */}
            <div className="p-3 bg-[#F7F6F0] border-t border-[#D9DED4] text-[11px] text-[#3D5A52]">
              {p.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Inspection Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="relative max-w-4xl w-full bg-white rounded-[28px] p-6 border border-[#D9DED4] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9DED4]">
              <h4 className="text-sm font-bold text-[#083C33] font-mono">{modalImage.title}</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(modalImage.url, modalImage.title)}
                  className="px-4 py-2 rounded-full bg-[#0D4F43] hover:bg-[#125B4D] text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setModalImage(null)}
                  className="p-2 rounded-full text-[#3D5A52] hover:text-[#083C33] hover:bg-[#EBF0E6]"
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
