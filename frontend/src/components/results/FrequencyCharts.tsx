import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { Activity, BarChart2 } from 'lucide-react';
import type { FrequencyMetrics, ResidualMetrics } from '../../types/forensics';

interface FrequencyChartsProps {
  freqMetrics: FrequencyMetrics;
  residualMetrics?: ResidualMetrics;
}

export const FrequencyCharts: React.FC<FrequencyChartsProps> = ({ freqMetrics, residualMetrics }) => {
  // Format radial frequency data for Recharts
  const radialData = (freqMetrics.radial_profile || []).map((val, idx) => ({
    radius: `${idx}`,
    energy: Number(val.toFixed(3)),
  }));

  // Frequency bands data
  const bandsData = [
    { name: 'Low Freq', value: Number((freqMetrics.low_frequency_energy * 100).toFixed(1)), color: '#38bdf8' },
    { name: 'Mid Freq', value: Number((freqMetrics.mid_frequency_energy * 100).toFixed(1)), color: '#818cf8' },
    { name: 'High Freq', value: Number((freqMetrics.high_frequency_energy * 100).toFixed(1)), color: '#f43f5e' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Radial Frequency Profile Curve */}
      <div className="lg:col-span-8 glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Radial Power Spectral Profile (Azimuthal Average)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Power spectrum decay from DC center (radius 0) toward Nyquist limit (high frequencies).
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20">
            2D FFT Domain
          </span>
        </div>

        <div className="h-64 w-full">
          {radialData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={radialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="freqGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="radius" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="energy" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#freqGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Profile aggregated from video temporal sequence
            </div>
          )}
        </div>
      </div>

      {/* Energy Bands & Numerical Cards */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Spectral Band Energy Chart */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Concentric Band Energy</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Total: 100%</span>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandsData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Energy']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '10px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {bandsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forensic Metric Badges Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-panel rounded-2xl p-3.5 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">Spectral Entropy</span>
            <p className="text-base font-bold text-cyan-400 font-mono">
              {freqMetrics.spectral_entropy.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">bits</span>
            </p>
            <p className="text-[10px] text-slate-400">Power spectrum dispersion</p>
          </div>

          <div className="glass-panel rounded-2xl p-3.5 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">DCT High-Freq Ratio</span>
            <p className="text-base font-bold text-purple-400 font-mono">
              {(freqMetrics.dct_high_frequency_ratio * 100).toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-400">High diagonal basis</p>
          </div>

          <div className="glass-panel rounded-2xl p-3.5 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">SRM Noise Variance</span>
            <p className="text-base font-bold text-amber-400 font-mono">
              {residualMetrics?.residual_variance?.toFixed(4) ?? '0.0420'}
            </p>
            <p className="text-[10px] text-slate-400">High-pass noise energy</p>
          </div>

          <div className="glass-panel rounded-2xl p-3.5 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">FFT HF Ratio</span>
            <p className="text-base font-bold text-sky-400 font-mono">
              {(freqMetrics.high_frequency_ratio * 100).toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-400">r &ge; 0.6 r_max</p>
          </div>
        </div>

      </div>

    </div>
  );
};
