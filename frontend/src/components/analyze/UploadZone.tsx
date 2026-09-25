import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileVideo,
  FileImage,
  ShieldAlert,
  Check,
  Loader2,
  Play,
  X,
  Layers,
  Film,
  Cpu,
  FileText,
  Activity,
  ArrowRight,
  Maximize2
} from 'lucide-react';
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

const SUPPORTED_FORMATS = ['JPG', 'PNG', 'WEBP', 'MP4', 'MOV', 'AVI', 'WEBM'];

const EXAMPLE_SAMPLES = [
  {
    id: 'sample-1',
    name: 'sample-1.jpg',
    displayName: 'StyleGAN2_Synthesized.jpg',
    label: 'GAN Synthesis',
    sublabel: 'High-pass grid artifacts',
    type: 'image/jpeg',
    src: '/examples/sample-1.jpg?v=2'
  },
  {
    id: 'sample-2',
    name: 'sample-2.jpg',
    displayName: 'LatentDiffusion_Portrait.jpg',
    label: 'Diffusion Model',
    sublabel: 'Spectral power falloff',
    type: 'image/jpeg',
    src: '/examples/sample-2.jpg?v=2'
  },
  {
    id: 'sample-3',
    name: 'sample-3.jpg',
    displayName: 'FaceForensics_Deepfake.jpg',
    label: 'FaceSwap ROI',
    sublabel: 'Boundary residual seam',
    type: 'image/jpeg',
    src: '/examples/sample-3.jpg?v=2'
  },
  {
    id: 'sample-4',
    name: 'sample-4.jpg',
    displayName: 'Temporal_MultiFrame.jpg',
    label: 'Video Frame Sequence',
    sublabel: 'Frame-to-frame variance',
    type: 'image/jpeg',
    src: '/examples/sample-4.jpg?v=2'
  }
];

export const UploadZone: React.FC<UploadZoneProps> = ({ onAnalysisComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'full'>('full');
  const [videoFrames, setVideoFrames] = useState<number>(16);

  // Real metadata
  const [imageDimensions, setImageDimensions] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);

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

    if (!isVideo) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions(`${img.naturalWidth} × ${img.naturalHeight} px`);
      };
      img.src = url;
      setVideoDuration(null);
    } else {
      setImageDimensions(null);
    }
  };

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (vid.duration) {
      const mins = Math.floor(vid.duration / 60);
      const secs = Math.floor(vid.duration % 60);
      setVideoDuration(`${mins}:${secs < 10 ? '0' : ''}${secs} (${vid.videoWidth} × ${vid.videoHeight})`);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageDimensions(null);
    setVideoDuration(null);
    setErrorMessage(null);
    setIsProcessing(false);
    setCurrentStageIndex(-1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadExampleSample = async (sample: typeof EXAMPLE_SAMPLES[0]) => {
    if (isProcessing) return;
    try {
      const response = await fetch(sample.src);
      if (!response.ok) throw new Error('Sample fetch failed');
      const blob = await response.blob();
      const file = new File([blob], sample.displayName, { type: sample.type });
      processSelectedFile(file);
    } catch (err) {
      console.warn('Could not load sample file directly, fallback to manual selection', err);
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStageIndex(0);

    // Realistic pipeline stage progress simulation during network transmission & ML inference
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
      setErrorMessage(err.message || 'Forensic analysis failed. Please verify media format.');
    }
  };

  return (
    <div className="relative w-full pb-16 pt-2 sm:pt-4 px-4 sm:px-6 lg:px-8 selection:bg-[#0D5145]/20 selection:text-[#083C33]">
      
      {/* ========================================================================= */}
      {/* 2. PAGE BACKGROUND: SUBTLE FORENSIC GRID & TECHNICAL GRAPHICS            */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Subtle coordinate ticks and plotting marks */}
        <div className="absolute top-10 left-8 text-[10px] font-mono text-[#52706A]/35 tracking-widest hidden md:block">
          + LAT_ALIGN: 34.0522° N // LONG: -118.2437° W
        </div>
        <div className="absolute top-10 right-8 text-[10px] font-mono text-[#52706A]/35 tracking-widest hidden md:block">
          + SPECTRAL_GRID // DUAL_ATTN_FUSION: ACTIVE
        </div>
        <div className="absolute top-64 left-6 text-[10px] font-mono text-[#52706A]/25 tracking-widest hidden lg:block">
          [SRM_3x3_FILTER_BANK]
        </div>
        <div className="absolute top-96 right-8 text-[10px] font-mono text-[#52706A]/25 tracking-widest hidden lg:block">
          [AZIMUTHAL_INTEGRAL: 2D_FFT]
        </div>
        
        {/* Subtle radial FFT rings in background */}
        <svg
          className="absolute -top-36 -right-36 w-[520px] h-[520px] text-[#0D5145]/5"
          viewBox="0 0 400 400"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="200" cy="200" r="55" strokeWidth="1" strokeDasharray="3 5" />
          <circle cx="200" cy="200" r="105" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="200" cy="200" r="155" strokeWidth="0.8" strokeDasharray="2 8" />
          <circle cx="200" cy="200" r="195" strokeWidth="0.5" strokeDasharray="6 6" />
          <line x1="200" y1="10" x2="200" y2="390" strokeWidth="0.75" strokeDasharray="3 5" />
          <line x1="10" y1="200" x2="390" y2="200" strokeWidth="0.75" strokeDasharray="3 5" />
        </svg>

        {/* Subtle left-side coordinate cross & waveform trace */}
        <svg
          className="absolute top-48 -left-20 w-80 h-80 text-[#0D5145]/5"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
        >
          <path d="M 0 100 Q 50 40, 100 100 T 200 100" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="40" strokeWidth="0.8" strokeDasharray="2 4" />
          <line x1="100" y1="20" x2="100" y2="180" strokeWidth="0.5" strokeDasharray="2 4" />
          <line x1="20" y1="100" x2="180" y2="100" strokeWidth="0.5" strokeDasharray="2 4" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto space-y-2 sm:space-y-3">

        {/* ========================================================================= */}
        {/* 3. HERO HEADER & 4. DECORATIVE FORENSIC VISUALS                           */}
        {/* ========================================================================= */}
        <div className="relative flex flex-col items-center justify-center">

          {/* CENTER HERO HEADING */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto px-4 space-y-2"
          >
            {/* Small Technical Eyebrow */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-0.5 rounded-full border border-[#D5D9D1] bg-white/80 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D5145] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#0D5145] font-semibold">
                FORENSIC MEDIA ANALYSIS
              </span>
            </div>

            {/* Large Bold Editorial Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-[#083C33] tracking-tight leading-[1.12] font-serif">
              Forensic Media Inspection
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#52706A] max-w-2xl mx-auto leading-relaxed">
              Upload an image or video to extract SRM high-pass residuals, 2D FFT spectra, 2D DCT matrices, and temporal stability.
            </p>
          </motion.div>

        </div>

        {/* ========================================================================= */}
        {/* 4. FLOATING FORMAT BUBBLES (LEFT) + FORENSIC TELEMETRY CARD (RIGHT)        */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between w-full -mb-5 sm:-mb-7 px-2 sm:px-6 z-20 relative pointer-events-none gap-3">
          
          {/* LEFT: Floating Transparent Format Bubbles (Outside the Box in Background) */}
          <div className="flex items-center flex-wrap justify-center md:justify-start gap-1.5 pointer-events-auto">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#52706A] font-bold mr-1">
              FORMATS //
            </span>
            {SUPPORTED_FORMATS.map((fmt, i) => (
              <motion.span
                key={fmt}
                animate={{ y: [0, (i % 2 === 0 ? -4 : 4), 0] }}
                transition={{ duration: 4.2 + (i * 0.35), repeat: Infinity, ease: 'easeInOut' }}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider bg-white/80 backdrop-blur-xs border border-[#D5D9D1] text-[#083C33] shadow-[0_2px_10px_rgba(8,60,51,0.03)] hover:border-[#0D5145] transition-colors"
              >
                {fmt}
              </motion.span>
            ))}
          </div>

          {/* RIGHT: Forensic Telemetry Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white/95 backdrop-blur-xs rounded-[24px] border border-[#D5D9D1] p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(8,60,51,0.05)] w-full max-w-[340px] pointer-events-auto"
          >
            <div className="flex items-center space-x-3 sm:space-x-3.5">
              
              {/* LEFT: Forensic Fingerprint Biometric Scan */}
              <div className="relative w-[85px] sm:w-[95px] aspect-[4/5] bg-[#F7F8F4] rounded-2xl border border-[#DCE2D8] flex items-center justify-center p-1.5 shrink-0">
                <svg
                  className="w-full h-full text-[#4D7268]"
                  viewBox="0 0 100 130"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                >
                  {/* Cardinal crosshairs */}
                  <line x1="50" y1="3" x2="50" y2="10" stroke="#8CA39C" strokeWidth="0.8" />
                  <line x1="50" y1="120" x2="50" y2="127" stroke="#8CA39C" strokeWidth="0.8" />
                  <line x1="3" y1="65" x2="10" y2="65" stroke="#8CA39C" strokeWidth="0.8" />
                  <line x1="90" y1="65" x2="97" y2="65" stroke="#8CA39C" strokeWidth="0.8" />

                  {/* Corner brackets */}
                  <path d="M 8 16 L 8 8 L 16 8" stroke="#8CA39C" strokeWidth="1" />
                  <path d="M 92 16 L 92 8 L 84 8" stroke="#8CA39C" strokeWidth="1" />
                  <path d="M 8 114 L 8 122 L 16 122" stroke="#8CA39C" strokeWidth="1" />
                  <path d="M 92 114 L 92 122 L 84 122" stroke="#8CA39C" strokeWidth="1" />

                  {/* Concentric Biometric Loops */}
                  <path d="M 50 78 C 47 78 45 74 45 68 C 45 60 48 55 50 55 C 52 55 55 60 55 68 C 55 74 53 78 50 78" strokeWidth="1.8" />
                  <path d="M 44 85 C 41 82 39 76 39 68 C 39 56 44 49 50 49 C 56 49 61 56 61 68 C 61 76 59 82 56 85" strokeWidth="1.8" />
                  <path d="M 38 92 C 34 88 33 78 33 68 C 33 52 40 43 50 43 C 60 43 67 52 67 68 C 67 78 66 88 62 92" strokeWidth="1.8" />
                  <path d="M 32 98 C 28 92 27 80 27 68 C 27 48 37 37 50 37 C 63 37 73 48 73 68 C 73 80 72 92 68 98" strokeWidth="1.8" />
                  <path d="M 27 105 C 22 96 21 82 21 68 C 21 44 34 31 50 31 C 66 31 79 44 79 68 C 79 82 78 96 73 105" strokeWidth="1.8" />
                  <path d="M 22 111 C 17 100 16 84 16 68 C 16 40 31 25 50 25 C 69 25 84 40 84 68 C 84 84 83 100 78 111" strokeWidth="1.8" />
                  <path d="M 17 116 C 12 104 11 86 11 68 C 11 36 28 20 50 20 C 72 20 89 36 89 68 C 89 86 88 104 83 116" strokeWidth="1.8" />
                  <path d="M 48 83 C 48 95 44 105 38 112" strokeWidth="1.8" />
                  <path d="M 52 83 C 52 95 56 105 62 112" strokeWidth="1.8" />
                  <path d="M 50 88 L 50 118" strokeWidth="1.8" />
                </svg>
              </div>

              {/* RIGHT: Waveform & Signal Levels */}
              <div className="flex-1 flex flex-col justify-between space-y-2">
                
                {/* Waveform Box */}
                <div className="h-10 bg-[#F7F8F4] rounded-xl border border-[#DCE2D8] flex items-center justify-center px-1.5 overflow-hidden">
                  <svg
                    className="w-full h-full text-[#5E857C]"
                    viewBox="0 0 160 44"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="22" x2="160" y2="22" stroke="#D5DCD3" strokeWidth="0.8" strokeDasharray="3 2" />
                    <path
                      d="M 0 22 L 10 22 L 16 16 L 22 28 L 28 8 L 34 34 L 40 16 L 46 27 L 52 5 L 58 39 L 64 14 L 70 30 L 76 8 L 82 36 L 88 18 L 94 25 L 100 4 L 106 40 L 112 12 L 118 32 L 124 7 L 130 37 L 136 17 L 142 27 L 148 22 L 160 22"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Signal Bars */}
                <div className="space-y-1 font-mono text-[9px] text-[#405C55]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold tracking-wider">SRM</span>
                    <div className="w-18 sm:w-20 h-1.5 bg-[#E5EAE3] rounded-full overflow-hidden p-[1px]">
                      <div className="w-[82%] h-full bg-[#5E857C] rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold tracking-wider">FFT</span>
                    <div className="w-18 sm:w-20 h-1.5 bg-[#E5EAE3] rounded-full overflow-hidden p-[1px]">
                      <div className="w-[70%] h-full bg-[#5E857C] rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold tracking-wider">DCT</span>
                    <div className="w-18 sm:w-20 h-1.5 bg-[#E5EAE3] rounded-full overflow-hidden p-[1px]">
                      <div className="w-[62%] h-full bg-[#5E857C] rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold tracking-wider">TEMPORAL</span>
                    <div className="w-18 sm:w-20 h-1.5 bg-[#E5EAE3] rounded-full overflow-hidden p-[1px]">
                      <div className="w-[45%] h-full bg-[#5E857C] rounded-full" />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* 5. MAIN UPLOAD AREA CONTAINER (70–75% LEFT / 25–30% RIGHT)                */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-[28px] sm:rounded-[32px] border border-[#D5D9D1] shadow-[0_10px_40px_rgba(8,60,51,0.06)] overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">

            {/* --------------------------------------------------------------------- */}
            {/* LEFT COLUMN: UPLOAD ZONE (approx 72% on lg screens)                    */}
            {/* --------------------------------------------------------------------- */}
            <div className="lg:col-span-8 p-5 sm:p-6 lg:p-7 flex flex-col justify-between relative">
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/webm"
                className="hidden"
                onChange={handleChange}
              />

              {/* STATE 1: EMPTY OR DRAGGING */}
              {!selectedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex-1 min-h-[260px] sm:min-h-[280px] rounded-[24px] border-2 border-dashed transition-all duration-300 p-6 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden ${
                    dragActive
                      ? 'border-[#0D5145] bg-[#EBF0E6]/70 scale-[0.995]'
                      : 'border-[#D5D9D1] bg-[#FAFAF7]/50 hover:bg-white hover:border-[#0D5145] hover:shadow-xs'
                  }`}
                >


                  {/* Subtle decorative forensic waveform along the lower portion */}
                  <svg
                    className="absolute bottom-0 left-0 right-0 w-full h-24 pointer-events-none opacity-20 overflow-hidden"
                    viewBox="0 0 800 120"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,85 C140,45 200,115 320,70 C440,25 500,95 620,55 C710,25 760,85 800,65 L800,120 L0,120 Z"
                      fill="none"
                      stroke="#0D5145"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <path
                      d="M0,95 C160,65 240,118 370,80 C480,45 560,105 700,65 C750,50 780,82 800,75"
                      fill="none"
                      stroke="#0D5145"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M0,108 C90,90 180,114 270,98 C390,75 470,118 590,92 C680,72 740,108 800,88"
                      fill="none"
                      stroke="#0D5145"
                      strokeWidth="0.8"
                      opacity="0.6"
                    />
                  </svg>

                  {/* Centered Upload Icon Badge */}
                  <div className="relative z-10 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#EBF0E6] border border-[#D5D9D1] flex items-center justify-center text-[#0D5145] transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 shadow-xs mb-3">
                    <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
                  </div>

                  {/* Headline & Description */}
                  <div className="relative z-10 space-y-1 max-w-md">
                    <h3 className="text-lg sm:text-xl font-bold text-[#083C33] tracking-tight">
                      Drag & drop forensic media, or <span className="text-[#0D5145] underline underline-offset-4 decoration-[#0D5145]/40 hover:decoration-[#0D5145]">browse</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[#52706A] leading-relaxed">
                      Images (JPG, PNG, WEBP) or Videos (MP4, MOV, AVI, WEBM) up to 100MB
                    </p>
                  </div>

                  {/* Prominent Forest Green "Choose File →" Button */}
                  <div className="relative z-10 mt-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center space-x-2 rounded-full bg-[#0D5145] hover:bg-[#083C33] text-white px-6 py-2.5 text-xs sm:text-sm font-semibold tracking-wide shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Choose File</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                  </div>

                  {/* Active Drag Overlay Notice */}
                  {dragActive && (
                    <div className="absolute inset-0 bg-[#EBF0E6]/90 backdrop-blur-xs flex items-center justify-center z-20">
                      <div className="text-center space-y-2">
                        <UploadCloud className="w-10 h-10 text-[#0D5145] mx-auto animate-bounce" />
                        <p className="text-sm font-bold text-[#083C33]">
                          Drop media to initiate forensic stream
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* STATE 2: FILE SELECTED OR PROCESSING */
                <div className="space-y-6">
                  
                  {/* File Header Bar */}
                  <div className="flex items-center justify-between bg-[#FAFAF7] border border-[#D5D9D1] rounded-2xl p-4">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#EBF0E6] flex items-center justify-center text-[#0D5145] shrink-0">
                        {mediaType === 'image' ? (
                          <FileImage className="w-5 h-5 stroke-[2]" />
                        ) : (
                          <FileVideo className="w-5 h-5 stroke-[2]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#083C33] truncate max-w-xs sm:max-w-md">
                          {selectedFile.name}
                        </h4>
                        <p className="text-[11px] font-mono text-[#52706A] flex items-center space-x-2">
                          <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                          <span>•</span>
                          <span className="uppercase font-semibold text-[#0D5145]">{mediaType}</span>
                          {imageDimensions && (
                            <>
                              <span>•</span>
                              <span>{imageDimensions}</span>
                            </>
                          )}
                          {videoDuration && (
                            <>
                              <span>•</span>
                              <span>{videoDuration}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {!isProcessing && (
                      <button
                        onClick={clearSelection}
                        title="Remove file"
                        className="p-2 rounded-full text-[#52706A] hover:text-[#083C33] hover:bg-[#EBF0E6] transition-colors shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Media Visual Preview Canvas */}
                  <div className="relative aspect-video max-h-72 w-full rounded-2xl overflow-hidden bg-[#083C33] border border-[#D5D9D1] flex items-center justify-center shadow-inner">
                    {mediaType === 'image' && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Media Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : previewUrl ? (
                      <video
                        src={previewUrl}
                        controls
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        className="w-full h-full object-contain"
                      />
                    ) : null}

                    {/* Laser scanning beam overlay when processing */}
                    {isProcessing && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#F7F6F0] to-transparent animate-scan shadow-sm" />
                        <div className="absolute inset-0 bg-[#083C33]/25" />
                        <div className="absolute top-3 left-3 bg-[#083C33]/80 backdrop-blur-xs text-[#F7F6F0] px-3 py-1 rounded-full text-[10px] font-mono flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-ping" />
                          <span>EXTRACTING RESIDUAL FREQUENCIES...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Configurable Analysis Parameters (Hidden while processing) */}
                  {!isProcessing && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      
                      {/* Analysis Mode Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#083C33] uppercase font-mono tracking-wider">
                          Analysis Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAnalysisMode('quick')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                              analysisMode === 'quick'
                                ? 'border-[#0D5145] bg-[#0D5145] text-white shadow-xs'
                                : 'border-[#D5D9D1] bg-[#FAFAF7] text-[#083C33] hover:bg-[#EBF0E6]'
                            }`}
                          >
                            Quick Spectrum
                          </button>
                          <button
                            type="button"
                            onClick={() => setAnalysisMode('full')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                              analysisMode === 'full'
                                ? 'border-[#0D5145] bg-[#0D5145] text-white shadow-xs'
                                : 'border-[#D5D9D1] bg-[#FAFAF7] text-[#083C33] hover:bg-[#EBF0E6]'
                            }`}
                          >
                            Full Dual-Stream (SRM+FFT+DCT)
                          </button>
                        </div>
                      </div>

                      {/* Video Frame Sampling Config (Only for video) */}
                      {mediaType === 'video' ? (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#083C33] uppercase font-mono tracking-wider">
                            Sampled Video Frames
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[8, 16, 32, 64].map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setVideoFrames(cnt)}
                                className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                                  videoFrames === cnt
                                    ? 'border-[#0D5145] bg-[#0D5145] text-white shadow-xs'
                                    : 'border-[#D5D9D1] bg-[#FAFAF7] text-[#083C33] hover:bg-[#EBF0E6]'
                                }`}
                              >
                                {cnt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#083C33] uppercase font-mono tracking-wider">
                            Engine Pipeline
                          </label>
                          <div className="py-2.5 px-3 rounded-xl bg-[#FAFAF7] border border-[#D5D9D1] text-[11px] font-mono text-[#52706A] flex items-center justify-between">
                            <span>SRM 3x3 High-Pass + 2D FFT/DCT</span>
                            <span className="text-[#0D5145] font-semibold">Ready</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Primary Trigger Button */}
                  {!isProcessing ? (
                    <button
                      onClick={startAnalysis}
                      className="w-full py-3.5 rounded-full bg-[#0D5145] hover:bg-[#083C33] text-white font-semibold text-sm tracking-wide shadow-sm hover:shadow-md transition-all hover:scale-[1.005] active:scale-[0.99] flex items-center justify-center space-x-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Forensic Assessment</span>
                      <ArrowRight className="w-4 h-4 stroke-[2]" />
                    </button>
                  ) : (
                    /* Real Processing Sequence Progress Tracker */
                    <div className="space-y-3 pt-3 border-t border-[#D5D9D1]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0D5145] flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#0D5145]" />
                          <span>Executing Forensic Engine...</span>
                        </span>
                        <span className="font-mono text-[#52706A]">
                          Stage {currentStageIndex + 1} of {PIPELINE_STAGES.length}
                        </span>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {PIPELINE_STAGES.map((stage, idx) => {
                          const isDone = idx < currentStageIndex;
                          const isCurrent = idx === currentStageIndex;
                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl transition-all ${
                                isCurrent
                                  ? 'bg-[#EBF0E6] border border-[#0D5145]/40 text-[#083C33] font-bold'
                                  : isDone
                                  ? 'text-[#0D5145]'
                                  : 'text-[#52706A]/50'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                {isDone ? (
                                  <Check className="w-3.5 h-3.5 text-[#0D5145] stroke-[2.5]" />
                                ) : isCurrent ? (
                                  <span className="w-2 h-2 rounded-full bg-[#0D5145] animate-ping" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D5D9D1]" />
                                )}
                                <span>{stage}</span>
                              </div>
                              <span className="text-[9px] font-mono uppercase font-semibold">
                                {isDone ? 'Completed' : isCurrent ? 'Running...' : 'Pending'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Error Notification Alert */}
                  {errorMessage && (
                    <div className="p-4 rounded-2xl bg-[#FDF2F2] border border-[#E0B4B4] text-[#9E3A3A] text-xs flex items-center space-x-3">
                      <ShieldAlert className="w-5 h-5 text-[#9E3A3A] shrink-0" />
                      <span className="font-medium">{errorMessage}</span>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* --------------------------------------------------------------------- */}
            {/* RIGHT COLUMN: SUPPORTED ANALYSIS PANEL (approx 28% on lg screens)     */}
            {/* --------------------------------------------------------------------- */}
            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#D5D9D1] bg-[#FAFAF7]/70 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              
              <div className="space-y-6">
                
                {/* Header */}
                <div className="space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#52706A] font-semibold">
                    CAPABILITIES
                  </div>
                  <h4 className="text-base font-bold text-[#083C33] tracking-tight">
                    Supported Analysis
                  </h4>
                </div>

                {/* Capability Item 1: IMAGE FORENSICS */}
                <div className="space-y-1 pb-5 border-b border-[#D5D9D1]/70">
                  <div className="flex items-center space-x-2.5 text-[#0D5145]">
                    <Layers className="w-4 h-4 stroke-[2]" />
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#083C33]">
                      IMAGE FORENSICS
                    </span>
                  </div>
                  <p className="text-xs text-[#52706A] pl-6.5 leading-relaxed">
                    SRM residuals, FFT/DCT spectra
                  </p>
                </div>

                {/* Capability Item 2: VIDEO MULTI-FRAME SAMPLING */}
                <div className="space-y-1 pb-5 border-b border-[#D5D9D1]/70">
                  <div className="flex items-center space-x-2.5 text-[#0D5145]">
                    <Film className="w-4 h-4 stroke-[2]" />
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#083C33]">
                      VIDEO MULTI-FRAME SAMPLING
                    </span>
                  </div>
                  <p className="text-xs text-[#52706A] pl-6.5 leading-relaxed">
                    Temporal consistency analysis
                  </p>
                </div>

                {/* Capability Item 3: GENERATOR ATTRIBUTION */}
                <div className="space-y-1 pb-5 border-b border-[#D5D9D1]/70">
                  <div className="flex items-center space-x-2.5 text-[#0D5145]">
                    <Cpu className="w-4 h-4 stroke-[2]" />
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#083C33]">
                      GENERATOR ATTRIBUTION
                    </span>
                  </div>
                  <p className="text-xs text-[#52706A] pl-6.5 leading-relaxed">
                    GAN & Diffusion model classification
                  </p>
                </div>

                {/* Capability Item 4: EXPLAINABLE REPORT */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5 text-[#0D5145]">
                    <FileText className="w-4 h-4 stroke-[2]" />
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#083C33]">
                      EXPLAINABLE REPORT
                    </span>
                  </div>
                  <p className="text-xs text-[#52706A] pl-6.5 leading-relaxed">
                    Forensic insights with visualization
                  </p>
                </div>

              </div>

              {/* Bottom Research Integrity Note */}
              <div className="pt-6 mt-6 border-t border-[#D5D9D1]/60 text-[11px] font-mono text-[#52706A] flex items-center space-x-2">
                <Activity className="w-3.5 h-3.5 text-[#0D5145] shrink-0" />
                <span>Zero synthetic simulation prior to upload</span>
              </div>

            </div>

          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* 9. SUPPORTED FORMATS & EXAMPLE INPUTS (SECONDARY HORIZONTAL PANEL)        */}
        {/* ========================================================================= */}
        {/* 9. EXAMPLE INPUTS GALLERY (HORIZONTAL PANEL)                              */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-[24px] border border-[#D5D9D1] p-5 sm:p-6 shadow-[0_4px_24px_rgba(8,60,51,0.04)]"
        >
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D5145]" />
                <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#083C33] font-bold">
                  EXAMPLE INPUTS
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#52706A]/80 hidden sm:inline">
                Click any specimen to load into forensic stream
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {EXAMPLE_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => loadExampleSample(sample)}
                  title={`Load ${sample.label} (${sample.sublabel})`}
                  className="group relative rounded-xl border border-[#D5D9D1] overflow-hidden aspect-[4/3] bg-[#083C33] hover:border-[#0D5145] hover:shadow-xs transition-all duration-200 focus:outline-hidden text-left"
                >
                  <img
                    src={sample.src}
                    alt={sample.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#083C33]/90 via-transparent to-transparent flex flex-col justify-end p-2 opacity-90 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono font-bold text-white truncate leading-tight">
                      {sample.label}
                    </span>
                    <span className="text-[8px] font-mono text-[#D5D9D1]/90 truncate">
                      {sample.sublabel}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
