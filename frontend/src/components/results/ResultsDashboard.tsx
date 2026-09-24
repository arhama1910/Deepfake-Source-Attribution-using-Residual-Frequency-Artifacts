import React, { useState } from 'react';
import {
  Download, ChevronDown, ChevronUp, ShieldCheck, ShieldAlert,
  AlertTriangle, HardDrive, RefreshCw
} from 'lucide-react';
import type { AnalysisResult } from '../../types/forensics';
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#083C33]">
              Forensic Case Report: <span className="font-mono text-[#0D4F43]">{result.filename}</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#EBF0E6] border border-[#D9DED4] text-[#083C33] font-semibold">
              {result.media_type}
            </span>
          </div>
          <p className="text-xs text-[#3D5A52] font-mono mt-1">
            Case Ref: {result.id} • Processed: {new Date(result.created_at).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={downloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#0D4F43] hover:bg-[#125B4D] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF Report'}</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#D9DED4] hover:bg-[#CAD2C4] text-[#083C33] text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Top 4 Primary Verdict Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. MEDIA STATUS */}
        <div className="bg-white rounded-2xl p-5 border border-[#D9DED4] shadow-sm space-y-1">
          <span className="text-[11px] font-mono text-[#3D5A52] uppercase tracking-wider block">
            Media Status
          </span>
          {isLoaded ? (
            pred?.is_synthetic ? (
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-[#9E3A3A]" />
                <span className="text-lg font-bold text-[#9E3A3A]">Deepfake / Synthetic</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#0D4F43]" />
                <span className="text-lg font-bold text-[#0D4F43]">Authentic Media</span>
              </div>
            )
          ) : (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-[#B57424]" />
              <span className="text-base font-bold text-[#B57424]">Research Demo Mode</span>
            </div>
          )}
          <p className="text-[11px] text-[#3D5A52]">
            {isLoaded ? 'Classification via neural head' : 'Preprocessing completed without fake scores'}
          </p>
        </div>

        {/* 2. ATTRIBUTED SOURCE */}
        <div className="bg-white rounded-2xl p-5 border border-[#D9DED4] shadow-sm space-y-1">
          <span className="text-[11px] font-mono text-[#3D5A52] uppercase tracking-wider block">
            Attributed Source Class
          </span>
          <p className="text-lg font-bold text-[#083C33] truncate">
            {isLoaded ? pred?.source_class : 'Model Unweighted'}
          </p>
          <p className="text-[11px] text-[#3D5A52]">
            {isLoaded ? 'Target generative architecture' : 'Awaiting trained checkpoint weights'}
          </p>
        </div>

        {/* 3. CONFIDENCE */}
        <div className="bg-white rounded-2xl p-5 border border-[#D9DED4] shadow-sm space-y-1">
          <span className="text-[11px] font-mono text-[#3D5A52] uppercase tracking-wider block">
            Attribution Confidence
          </span>
          <p className="text-lg font-bold text-[#0D4F43] font-mono">
            {isLoaded && pred?.source_confidence !== null ? `${pred.source_confidence}%` : 'Pending Evaluation'}
          </p>
          <p className="text-[11px] text-[#3D5A52]">
            {isLoaded ? 'Posterior class probability' : 'Zero hallucinated probabilities'}
          </p>
        </div>

        {/* 4. ACTIVE MODEL */}
        <div className="bg-white rounded-2xl p-5 border border-[#D9DED4] shadow-sm space-y-1">
          <span className="text-[11px] font-mono text-[#3D5A52] uppercase tracking-wider block">
            Active Architecture
          </span>
          <p className="text-sm font-bold text-[#083C33] truncate">
            {pred?.model_name || 'DeepTrace-SpatialFreq-ViT'}
          </p>
          <p className="text-[11px] text-[#3D5A52] font-mono">
            Version: {pred?.model_version || 'v1.0.0'}
          </p>
        </div>

      </div>

      {/* Honest Research Integrity Banner when unweighted */}
      {!isLoaded && (
        <div className="rounded-2xl p-5 bg-[#EBF0E6] border border-[#D9DED4] text-xs text-[#083C33] flex items-start space-x-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-[#0D4F43] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-[#083C33]">Research Integrity Guarantee</h4>
            <p className="text-[#3D5A52] leading-relaxed">
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
      <div className="bg-white rounded-[28px] border border-[#D9DED4] shadow-sm overflow-hidden">
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="w-full p-4 flex items-center justify-between text-xs font-semibold text-[#083C33] hover:bg-[#EBF0E6] transition-colors"
        >
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-[#0D4F43]" />
            <span>Forensic Metadata & Cryptographic Hashes</span>
          </div>
          {showMetadata ? <ChevronUp className="w-4 h-4 text-[#083C33]" /> : <ChevronDown className="w-4 h-4 text-[#083C33]" />}
        </button>

        {showMetadata && (
          <div className="p-6 border-t border-[#D9DED4] bg-[#F7F6F0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#3D5A52] block text-[10px]">Analysis Identifier:</span>
              <span className="text-[#083C33] font-semibold break-all">{result.id}</span>
            </div>
            <div>
              <span className="text-[#3D5A52] block text-[10px]">Media Resolution:</span>
              <span className="text-[#083C33] font-semibold">{result.resolution || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#3D5A52] block text-[10px]">File Size:</span>
              <span className="text-[#083C33] font-semibold">{(result.file_size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
            <div>
              <span className="text-[#3D5A52] block text-[10px]">Facial ROI Detected:</span>
              <span className="text-[#083C33] font-semibold">{result.face_detected ? `Yes (${result.face_count} face)` : 'No (Full Center ROI)'}</span>
            </div>
            <div>
              <span className="text-[#3D5A52] block text-[10px]">High-Pass Filter:</span>
              <span className="text-[#083C33] font-semibold">{result.residual_metrics?.filter_type || 'SRM 3x3 Edge'}</span>
            </div>
            <div>
              <span className="text-[#3D5A52] block text-[10px]">Processing Pipeline:</span>
              <span className="text-[#083C33] font-semibold">Spatial-Frequency Dual Stream</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
