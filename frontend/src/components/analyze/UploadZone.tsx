import React, { useState, useRef } from 'react';
import { UploadCloud, FileVideo, FileImage, ShieldAlert, Check, Loader2, Play, X } from 'lucide-react';
import { apiService } from '../../services/api';
import type { AnalysisResult } from '../../types/forensics';

interface UploadZoneProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

const PIPELINE_STAGES = [
  'File Validation & Magic Bytes',
  'Media Preprocessing & Normalization',
  'Face Detection & Aligned ROI Crop',
  'Spatial Residual Extraction (SRM 3x3 Edge)',
  '2D Fast Fourier Transform (FFT) Power Spectrum',
  '2D Discrete Cosine Transform (DCT) Matrix',
  'Spatial Feature Extraction (ViT / CNN)',
  'Frequency Feature Branch Embedding',
  'Spatial-Frequency Cross-Attention Fusion',
  'Source Generator Attribution Head',
  'Video Temporal Coherence Analysis',
  'Grounded Explainability Synthesis',
  'Forensic Case Report Generation'
];

export const UploadZone: React.FC<UploadZoneProps> = ({ onAnalysisComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'full'>('full');
  const [videoFrames, setVideoFrames] = useState<number>(16);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setErrorMessage(null);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(file.name);
    setMediaType(isVideo ? 'video' : 'image');
    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setErrorMessage(null);
    setIsProcessing(false);
    setCurrentStageIndex(-1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStageIndex(0);

    // Realistic pipeline stage progress simulation during network transmission & processing
    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < PIPELINE_STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      let result: AnalysisResult;
      if (mediaType === 'image') {
        result = await apiService.analyzeImage(selectedFile, analysisMode);
      } else {
        result = await apiService.analyzeVideo(selectedFile, videoFrames, analysisMode);
      }

      clearInterval(stageInterval);
      setCurrentStageIndex(PIPELINE_STAGES.length - 1);
      setTimeout(() => {
        setIsProcessing(false);
        onAnalysisComplete(result);
      }, 500);
    } catch (err: any) {
      clearInterval(stageInterval);
      setIsProcessing(false);
      setErrorMessage(err.message || 'Forensic analysis failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Upload Drop Zone Card */}
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-[32px] border-2 border-dashed p-12 sm:p-16 text-center cursor-pointer transition-all bg-white shadow-sm ${
            dragActive
              ? 'border-[#0D4F43] bg-[#EBF0E6]'
              : 'border-[#D9DED4] hover:border-[#0D4F43] hover:shadow-md'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/webm"
            className="hidden"
            onChange={handleChange}
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EBF0E6] border border-[#D9DED4] flex items-center justify-center text-[#0D4F43] transition-transform hover:scale-105">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#083C33]">
                Drag & drop forensic media, or <span className="text-[#0D4F43] underline underline-offset-4">browse</span>
              </h3>
              <p className="text-xs text-[#3D5A52] max-w-md">
                Images (JPG, PNG, WEBP) or Videos (MP4, MOV, AVI, WEBM) up to 100MB
              </p>
            </div>

            <div className="flex items-center space-x-4 pt-2 text-[11px] font-mono text-[#3D5A52]">
              <span className="flex items-center space-x-1.5">
                <FileImage className="w-3.5 h-3.5 text-[#0D4F43]" />
                <span>Image Forensics</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1.5">
                <FileVideo className="w-3.5 h-3.5 text-[#0D4F43]" />
                <span>Video Multi-Frame Sampling</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Media Preview & Options Card */
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#D9DED4] shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF0E6] flex items-center justify-center text-[#0D4F43]">
                {mediaType === 'image' ? <FileImage className="w-6 h-6" /> : <FileVideo className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#083C33] truncate max-w-sm sm:max-w-md">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-[#3D5A52] font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {mediaType.toUpperCase()}
                </p>
              </div>
            </div>

            {!isProcessing && (
              <button
                onClick={clearSelection}
                className="p-2 rounded-full text-[#3D5A52] hover:text-[#083C33] hover:bg-[#EBF0E6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Visual Preview */}
          <div className="relative aspect-video max-h-72 w-full rounded-2xl overflow-hidden bg-[#083C33] border border-[#D9DED4] flex items-center justify-center">
            {mediaType === 'image' && previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            ) : previewUrl ? (
              <video src={previewUrl} controls className="w-full h-full object-contain" />
            ) : null}

            {/* Scanning beam overlay when processing */}
            {isProcessing && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#F7F6F0] to-transparent animate-scan shadow-sm"></div>
                <div className="absolute inset-0 bg-[#083C33]/20"></div>
              </div>
            )}
          </div>

          {/* Configurable Analysis Parameters */}
          {!isProcessing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#083C33]">Analysis Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAnalysisMode('quick')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      analysisMode === 'quick'
                        ? 'border-[#0D4F43] bg-[#0D4F43] text-white shadow-sm'
                        : 'border-[#D9DED4] bg-[#EBF0E6] text-[#083C33] hover:bg-[#D9DED4]'
                    }`}
                  >
                    Quick Spectrum
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalysisMode('full')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      analysisMode === 'full'
                        ? 'border-[#0D4F43] bg-[#0D4F43] text-white shadow-sm'
                        : 'border-[#D9DED4] bg-[#EBF0E6] text-[#083C33] hover:bg-[#D9DED4]'
                    }`}
                  >
                    Full Forensic (SRM+FFT+DCT)
                  </button>
                </div>
              </div>

              {mediaType === 'video' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#083C33]">Sampled Frames</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[8, 16, 32, 64].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setVideoFrames(cnt)}
                        className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                          videoFrames === cnt
                            ? 'border-[#0D4F43] bg-[#0D4F43] text-white shadow-sm'
                            : 'border-[#D9DED4] bg-[#EBF0E6] text-[#083C33] hover:bg-[#D9DED4]'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Trigger - Deep Emerald Pill Button */}
          {!isProcessing ? (
            <button
              onClick={startAnalysis}
              className="w-full py-4 rounded-full bg-[#0D4F43] hover:bg-[#125B4D] text-white font-semibold text-sm tracking-wide shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Forensic Assessment</span>
            </button>
          ) : (
            /* Live Step-by-Step Pipeline Progress */
            <div className="space-y-4 pt-4 border-t border-[#D9DED4]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0D4F43] flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0D4F43]" />
                  <span>Executing Forensic Engine...</span>
                </span>
                <span className="font-mono text-[#3D5A52]">
                  Stage {currentStageIndex + 1} of {PIPELINE_STAGES.length}
                </span>
              </div>

              <div className="space-y-2">
                {PIPELINE_STAGES.map((stage, idx) => {
                  const isDone = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-[#EBF0E6] border border-[#0D4F43]/40 text-[#083C33] font-bold'
                          : isDone
                          ? 'text-[#0D4F43]'
                          : 'text-[#3D5A52]/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        {isDone ? (
                          <Check className="w-4 h-4 text-[#0D4F43] stroke-[2.5]" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-[#0D4F43] animate-ping"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#D9DED4]"></span>
                        )}
                        <span>{stage}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase font-semibold">
                        {isDone ? 'Completed' : isCurrent ? 'Processing...' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#FDF2F2] border border-[#E0B4B4] text-[#9E3A3A] text-xs flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 text-[#9E3A3A] shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
