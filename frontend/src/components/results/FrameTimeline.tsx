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
    <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6">
      
      {/* Header with temporal statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Film className="w-4 h-4 text-cyan-400" />
            <span>Video Temporal Consistency & Inter-Frame Coherence</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Inter-frame frequency jitter and spectral entropy trajectory across sampled video frames.
          </p>
        </div>

        {temporalSummary && (
          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Temporal Consistency</span>
              <span className="font-bold text-cyan-400">
                {(temporalSummary.temporal_consistency_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Inter-frame Jitter</span>
              <span className="font-bold text-indigo-400">
                {temporalSummary.temporal_jitter.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Trajectory Line Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Click any frame point to inspect frame-level forensic artifacts:</span>
          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>High-Frequency Ratio (%)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
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
              <XAxis dataKey="frame" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="hf_ratio" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4, fill: '#38bdf8' }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="entropy" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Frame Inspector Drawer */}
      {selectedFrame && (
        <div className="rounded-2xl p-4 bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/20">
                Frame #{selectedFrame.frame_number}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Timestamp: {selectedFrame.timestamp_sec}s
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-4">
              <span>HF Ratio: <b>{(selectedFrame.high_frequency_ratio * 100).toFixed(1)}%</b></span>
              <span>Spectral Entropy: <b>{selectedFrame.spectral_entropy.toFixed(3)}</b></span>
            </div>
          </div>

          {/* 4-Panel snapshot of the clicked frame */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono block">Aligned ROI</span>
              <div className="aspect-square rounded-xl bg-slate-900 overflow-hidden border border-slate-800">
                {selectedFrame.thumbnail_url && (
                  <img src={selectedFrame.thumbnail_url} alt="ROI" className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-amber-400 font-mono block">SRM Residual</span>
              <div className="aspect-square rounded-xl bg-slate-900 overflow-hidden border border-slate-800">
                {selectedFrame.residual_url && (
                  <img src={selectedFrame.residual_url} alt="Residual" className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-cyan-400 font-mono block">2D FFT Spectrum</span>
              <div className="aspect-square rounded-xl bg-slate-900 overflow-hidden border border-slate-800">
                {selectedFrame.fft_url && (
                  <img src={selectedFrame.fft_url} alt="FFT" className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-purple-400 font-mono block">2D DCT Matrix</span>
              <div className="aspect-square rounded-xl bg-slate-900 overflow-hidden border border-slate-800">
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
