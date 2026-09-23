import React, { useState } from 'react';
import {
  Download, FileText, ChevronDown, ChevronUp, ShieldCheck, ShieldAlert,
  AlertTriangle, Cpu, Layers, HardDrive, Clock, CheckCircle2, RefreshCw
} from 'lucide-react';
import { AnalysisResult } from '../../types/forensics';
import { FourPanelViewer } from './FourPanelViewer';
import { FrequencyCharts } from './FrequencyCharts';
import { FrameTimeline } from './FrameTimeline';
import { ExplainabilityCard } from './ExplainabilityCard';
import { apiService } from '../../services/api';

interface ResultsDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, onReset }) => {
  const [showMetadata, setShowMetadata] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const pred = result.prediction;
  const isLoaded = pred?.model_status === 'loaded';

  const downloadPdf = () => {
    setIsDownloadingPdf(true);
    const url = apiService.getReportDownloadUrl(result.id);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeepTrace_Report_${result.id.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingPdf(false), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Forensic Case Report: <span className="font-mono text-cyan-400">{result.filename}</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 text-slate-300">
              {result.media_type}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Case Ref: {result.id} • Processed: {new Date(result.created_at).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={downloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold shadow-[0_0_15px_rgba(56,189,248,0.15)] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF Report'}</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Top 4 Primary Verdict Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. MEDIA STATUS */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Media Status
          </span>
          {isLoaded ? (
            pred?.is_synthetic ? (
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span className="text-lg font-bold text-rose-400">Deepfake / Synthetic</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-lg font-bold text-emerald-400">Authentic Media</span>
              </div>
            )
          ) : (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-base font-bold text-amber-400">Research Demo Mode</span>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            {isLoaded ? 'Classification via neural head' : 'Preprocessing completed without fake scores'}
          </p>
        </div>

        {/* 2. ATTRIBUTED SOURCE */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Attributed Source Class
          </span>
          <p className="text-lg font-bold text-white truncate">
            {isLoaded ? pred?.source_class : 'Model Unweighted'}
          </p>
          <p className="text-[11px] text-slate-400">
            {isLoaded ? 'Target generative architecture' : 'Awaiting trained checkpoint weights'}
          </p>
        </div>

        {/* 3. CONFIDENCE */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Attribution Confidence
          </span>
          <p className="text-lg font-bold text-cyan-400 font-mono">
            {isLoaded && pred?.source_confidence !== null ? `${pred.source_confidence}%` : 'Pending Evaluation'}
          </p>
          <p className="text-[11px] text-slate-400">
            {isLoaded ? 'Posterior class probability' : 'Zero hallucinated probabilities'}
          </p>
        </div>

        {/* 4. ACTIVE MODEL */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Active Architecture
          </span>
          <p className="text-sm font-bold text-indigo-400 truncate">
            {pred?.model_name || 'DeepTrace-SpatialFreq-ViT'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Version: {pred?.model_version || 'v1.0.0'}
          </p>
        </div>

      </div>

      {/* Honest Research Integrity Banner when unweighted */}
      {!isLoaded && (
        <div className="rounded-2xl p-4 bg-slate-900/60 border border-cyan-500/20 text-xs text-slate-300 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-white">Research Integrity Guarantee</h4>
            <p className="text-slate-400 leading-relaxed">
              Full mathematical forensic feature extraction (SRM 3x3 high-pass residuals, 2D FFT power spectrum, 2D DCT coefficient matrices, 
              and inter-frame temporal consistency) has completed on this media. Because deep neural attribution weights have not yet been mounted 
              into the model registry, no arbitrary or fabricated attribution probabilities are displayed.
            </p>
          </div>
        </div>
      )}

      {/* 4-Panel Synchronized Forensic Inspector */}
      <FourPanelViewer artifacts={result.visual_artifacts} filename={result.filename} />

      {/* Frequency Domain Charts & Metrics */}
      <FrequencyCharts freqMetrics={result.frequency_metrics} residualMetrics={result.residual_metrics} />

      {/* Video Temporal Timeline (if video) */}
      {result.media_type === 'video' && result.frames && result.frames.length > 0 && (
        <FrameTimeline frames={result.frames} temporalSummary={result.temporal_metrics} />
      )}

      {/* Explainable AI Forensic Narrative */}
      <ExplainabilityCard explanation={result.explanation} modelVersion={pred?.model_version} />

      {/* Technical Metadata Drawer */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden">
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="w-full p-4 flex items-center justify-between text-xs font-semibold text-slate-300 hover:bg-slate-900/50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Forensic Metadata & Cryptographic Hashes</span>
          </div>
          {showMetadata ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMetadata && (
          <div className="p-6 border-t border-slate-800 bg-slate-950/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Analysis Identifier:</span>
              <span className="text-white break-all">{result.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Media Resolution:</span>
              <span className="text-white">{result.resolution || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">File Size:</span>
              <span className="text-white">{(result.file_size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Facial ROI Detected:</span>
              <span className="text-white">{result.face_detected ? `Yes (${result.face_count} face)` : 'No (Full Center ROI)'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">High-Pass Filter:</span>
              <span className="text-white">{result.residual_metrics?.filter_type || 'SRM 3x3 Edge'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Processing Pipeline:</span>
              <span className="text-white">Spatial-Frequency Dual Stream</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
