import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { Film } from 'lucide-react';
import type { FrameItem, TemporalSummary } from '../../types/forensics';

interface FrameTimelineProps {
  frames: FrameItem[];
  temporalSummary?: TemporalSummary;
}

export const FrameTimeline: React.FC<FrameTimelineProps> = ({ frames, temporalSummary }) => {
  const [selectedFrame, setSelectedFrame] = useState<FrameItem>(frames[0]);

  const chartData = frames.map((f) => ({
    frame: `F${f.frame_number}`,
    time: `${f.timestamp_sec}s`,
    hf_ratio: Number((f.high_frequency_ratio * 100).toFixed(2)),
    entropy: Number(f.spectral_entropy.toFixed(3)),
    residual_energy: Number(f.residual_energy.toFixed(3)),
    frameObj: f
  }));

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#D9DED4] shadow-sm space-y-6">
      
      {/* Header with temporal statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9DED4]">
        <div>
          <h3 className="text-base font-bold text-[#083C33] flex items-center space-x-2">
            <Film className="w-4 h-4 text-[#0D4F43]" />
            <span>Video Temporal Consistency & Inter-Frame Coherence</span>
          </h3>
          <p className="text-xs text-[#3D5A52] mt-0.5">
            Inter-frame frequency jitter and spectral entropy trajectory across sampled video frames.
          </p>
        </div>

        {temporalSummary && (
          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#EBF0E6] border border-[#D9DED4]">
              <span className="text-[#3D5A52] block text-[10px]">Temporal Consistency</span>
              <span className="font-bold text-[#0D4F43]">
                {(temporalSummary.temporal_consistency_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#EBF0E6] border border-[#D9DED4]">
              <span className="text-[#3D5A52] block text-[10px]">Inter-frame Jitter</span>
              <span className="font-bold text-[#083C33]">
                {temporalSummary.temporal_jitter.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Trajectory Line Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#3D5A52]">
          <span>Click any frame point to inspect frame-level forensic artifacts:</span>
          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0D4F43]"></span>
              <span>High-Frequency Ratio (%)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2A6E5F]"></span>
              <span>Spectral Entropy (bits)</span>
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedFrame(e.activePayload[0].payload.frameObj);
                }
              }}
              margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
            >
              <XAxis dataKey="frame" stroke="#7A918B" fontSize={11} tickLine={false} />
              <YAxis stroke="#7A918B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9DED4', borderRadius: '0.75rem', fontSize: '11px', color: '#083C33' }}
                labelStyle={{ color: '#3D5A52' }}
              />
              <Line type="monotone" dataKey="hf_ratio" stroke="#0D4F43" strokeWidth={2} dot={{ r: 4, fill: '#0D4F43' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="entropy" stroke="#2A6E5F" strokeWidth={2} dot={{ r: 3, fill: '#2A6E5F' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Frame Inspector Drawer */}
      {selectedFrame && (
        <div className="rounded-2xl p-5 bg-[#F7F6F0] border border-[#D9DED4] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full bg-[#0D4F43] text-white font-mono text-xs font-bold">
                Frame #{selectedFrame.frame_number}
              </span>
              <span className="text-xs text-[#3D5A52] font-mono">
                Timestamp: {selectedFrame.timestamp_sec}s
              </span>
            </div>

            <div className="text-[11px] font-mono text-[#3D5A52] flex items-center space-x-4">
              <span>HF Ratio: <b className="text-[#083C33]">{(selectedFrame.high_frequency_ratio * 100).toFixed(1)}%</b></span>
              <span>Spectral Entropy: <b className="text-[#083C33]">{selectedFrame.spectral_entropy.toFixed(3)}</b></span>
            </div>
          </div>

          {/* 4-Panel snapshot of the clicked frame */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-[#3D5A52] font-mono block">Aligned ROI</span>
              <div className="aspect-square rounded-xl bg-[#083C33] overflow-hidden border border-[#D9DED4]">
                {selectedFrame.thumbnail_url && (
                  <img src={selectedFrame.thumbnail_url} alt="ROI" className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#083C33] font-mono block font-semibold">SRM Residual</span>
              <div className="aspect-square rounded-xl bg-[#083C33] overflow-hidden border border-[#D9DED4]">
                {selectedFrame.residual_url && (
                  <img src={selectedFrame.residual_url} alt="Residual" className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#0D4F43] font-mono block font-semibold">2D FFT Spectrum</span>
              <div className="aspect-square rounded-xl bg-[#083C33] overflow-hidden border border-[#D9DED4]">
                {selectedFrame.fft_url && (
                  <img src={selectedFrame.fft_url} alt="FFT" className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#083C33] font-mono block font-semibold">2D DCT Matrix</span>
              <div className="aspect-square rounded-xl bg-[#083C33] overflow-hidden border border-[#D9DED4]">
                {selectedFrame.dct_url && (
                  <img src={selectedFrame.dct_url} alt="DCT" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
