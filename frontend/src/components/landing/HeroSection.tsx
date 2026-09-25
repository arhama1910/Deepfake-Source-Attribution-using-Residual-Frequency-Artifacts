import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Activity, Layers, FileSearch, Zap, CheckCircle2 } from 'lucide-react';
import { ForensicFingerprintVisual } from './ForensicFingerprintVisual';

// Hand-drawn editorial curved connector arrow matching reference style
const CurvedHorizontalArrow: React.FC<{ className?: string }> = ({ className = "w-full max-w-[60px] h-6" }) => (
  <svg 
    viewBox="0 0 80 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-hidden="true"
  >
    <path 
      d="M 6 22 C 16 10, 24 28, 36 16 C 46 6, 56 16, 72 11" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M 62 5 L 73 11 L 64 18" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

const CurvedVerticalArrow: React.FC<{ className?: string }> = ({ className = "w-6 h-10 mx-auto my-3" }) => (
  <svg 
    viewBox="0 0 32 60" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-hidden="true"
  >
    <path 
      d="M 12 6 C 24 16, 8 28, 18 40 C 22 45, 18 48, 16 54" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M 10 46 L 16 55 L 22 47" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

const PIPELINE_STAGES = [
  { step: '01', title: 'Media Upload', desc: 'MIME validation & magic bytes checking' },
  { step: '02', title: 'Preprocess', desc: 'Face detection & facial ROI alignment' },
  { step: '03', title: 'Extract Residual', desc: 'SRM 3×3 edge & high-pass noise' },
  { step: '04', title: 'FFT + DCT', desc: '2D Fourier spectrum & DCT energies' },
  { step: '05', title: 'Feature Fusion', desc: 'Spatial-frequency cross-attention' },
  { step: '06', title: 'Attribution', desc: 'Likely generator classification' },
  { step: '07', title: 'Explain & Report', desc: 'Grounded narrative & official PDF' },
];

const pipelineContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.12,
    },
  },
};

const pipelineStepVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const DIAGNOSTIC_METRICS = [
  {
    num: '01',
    label: 'MODEL ACCURACY',
    value: 'Pending Evaluation',
    desc: 'Research integrity benchmark',
  },
  {
    num: '02',
    label: 'SUPPORTED MEDIA',
    value: 'Image + Video',
    desc: 'Multi-frame temporal consistency',
  },
  {
    num: '03',
    label: 'ANALYSIS DOMAINS',
    value: 'Spatial + Freq + Temporal',
    desc: 'Cross-attention fusion network',
  },
  {
    num: '04',
    label: 'ATTRIBUTION CLASSES',
    value: 'Dataset Dependent',
    desc: 'GAN & Diffusion model families',
  },
];

const diagnosticContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const diagnosticItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const RESEARCH_DOMAINS = [
  {
    num: '01',
    title: 'Residual Steganalysis',
    desc: 'Natural camera sensors possess physical PRNU (Photo-Response Non-Uniformity). In synthetic generators, SRM high-pass filters isolate structural artifacts left by neural upsamplers and convolution kernels.',
  },
  {
    num: '02',
    title: '2D FFT & DCT Fingerprints',
    desc: 'Convolutional transposed layers and latent diffusion decoders induce periodic grid repetitions that project into distinct, quantifiable radial peaks and high-frequency coefficient distributions in Fourier and Cosine spectra.',
  },
  {
    num: '03',
    title: 'Temporal Consistency',
    desc: 'Video deepfakes synthesized frame-by-frame often exhibit subtle sub-pixel flickering between frames. Our temporal analyzer samples frame sequences and measures inter-frame spectral variance to detect high jitter.',
  },
];

const researchContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const researchItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};





interface HeroSectionProps {
  onStartAnalysis: () => void;
  onExploreMethodology: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartAnalysis, onExploreMethodology }) => {
  return (
    <div className="space-y-16 py-8">
      
      {/* Hero Header on Warm Ivory Background */}
      <section className="relative site-container py-6 lg:py-10">
        <div className="hero-grid grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)] gap-8 lg:gap-[clamp(32px,5vw,80px)] items-center min-h-[clamp(560px,calc(100vh-130px),760px)]">
          
          <div className="hero-content max-w-[680px] space-y-6 min-w-0">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E6] border border-[#D9DED4] text-[#0D4F43] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0D4F43] animate-pulse"></span>
              <span>Multimedia Forensics & Attribution Lab</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-[clamp(36px,4.2vw,68px)] font-extrabold tracking-tight text-[#083C33] leading-[1.08]">
                DeepTrace Forensic Intelligence
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#1B4D3E]">
                Diagnose Authenticity. Attribute Provenance.
              </p>
            </div>

            <p className="text-sm sm:text-base lg:text-lg text-[#3D5A52] leading-relaxed font-normal">
              Advanced multi-domain implementation for deepfake source attribution. We translate high-pass noise residuals 
              and 2D Fourier frequency artifacts into rigorous, explainable forensic evidence.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
              <button
                onClick={onStartAnalysis}
                className="flex items-center space-x-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#0D4F43] hover:bg-[#125B4D] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Shield className="w-4 h-4 stroke-[2.5]" />
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreMethodology}
                className="flex items-center space-x-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-[#D9DED4] hover:bg-[#CAD2C4] text-[#083C33] text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileSearch className="w-4 h-4 text-[#0D4F43]" />
                <span>View Methodology</span>
              </button>
            </div>

            {/* Quick badges */}
            <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#3D5A52] font-medium">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D4F43] shrink-0" />
                <span>Spatial Rich Models (SRM)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D4F43] shrink-0" />
                <span>2D FFT & 2D DCT Analysis</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D4F43] shrink-0" />
                <span>Video Temporal Stability</span>
              </span>
            </div>
          </div>

          {/* Research Visual: Forensic Frequency Fingerprint Engine */}
          <div className="w-full flex items-center justify-center min-w-0">
            <ForensicFingerprintVisual />
          </div>

        </div>
      </section>

      {/* Signature Deep Forest Green Section matching reference image */}
      <section className="site-container">
        <div className="deep-forest-panel rounded-[36px] p-8 sm:p-14 space-y-16 border border-[#166355] shadow-sm">
          
          {/* Section Header */}
          <div className="max-w-3xl space-y-3">
            <span className="text-xs uppercase font-mono tracking-wider text-[#D9DED4]">
              Empirical Diagnostic Infrastructure
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F7F6F0] leading-tight">
              Rigorous Mathematical Attribution Across Spatial and Frequency Dimensions
            </h2>
            <p className="text-sm sm:text-base text-[#D9DED4]/90 leading-relaxed">
              Standard detectors rely on RGB pixel artifacts that vanish after compression. DeepTrace evaluates 
              the high-pass sensor residue and Fourier cosine coefficients where generator signatures remain indelible.
            </p>
          </div>

          {/* Empirical Diagnostic Matrix - Clean 4-Column Scientific Capability Readout */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={diagnosticContainerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-y border-[#166355]/40 py-2"
          >
            {DIAGNOSTIC_METRICS.map((item, index) => (
              <motion.div
                key={item.num}
                variants={diagnosticItemVariants}
                className={`flex flex-col justify-between py-6 sm:py-8 px-2 sm:px-6 lg:px-8 xl:px-10 transition-colors ${
                  index < 3 ? 'border-b border-[#166355]/30' : 'border-b-0'
                } ${
                  index % 2 === 0 ? 'md:border-r md:border-[#166355]/40' : 'md:border-r-0'
                } ${
                  index < 2 ? 'md:border-b md:border-[#166355]/40' : 'md:border-b-0'
                } ${
                  index < 3 ? 'lg:border-r lg:border-[#166355]/40' : 'lg:border-r-0'
                } lg:border-b-0`}
              >
                {/* Top: Standalone Serif Number & Monospace Label */}
                <div className="space-y-3">
                  <span className="font-serif text-3xl sm:text-4xl xl:text-5xl font-light text-[#F7F6F0] tracking-tight block select-none leading-none">
                    {item.num}
                  </span>
                  <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#A3C2B8] block font-semibold">
                    {item.label}
                  </span>
                </div>

                {/* Bottom: Main Value Focus & Supporting Technical Annotation */}
                <div className="space-y-2 pt-6 sm:pt-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#F7F6F0] leading-tight tracking-tight uppercase">
                    {item.value}
                  </h3>
                  <p className="text-xs text-[#D9DED4]/75 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Forensic Analysis Pipeline - Crisp White Editorial Panel with Subtle Sage Border */}
      <section className="site-container">
        <div className="bg-white rounded-[36px] p-8 sm:p-14 space-y-8 border border-[#D9DED4] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#D9DED4] pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#083C33]">
                Forensic Analysis Pipeline
              </h3>
              <p className="text-xs sm:text-sm text-[#3D5A52] mt-1">
                Seven-stage dual-branch verification architecture.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#0D4F43] bg-[#EBF0E6] border border-[#D9DED4] px-3 py-1 rounded-full self-start sm:self-auto">
              End-to-End Execution
            </span>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={pipelineContainerVariants}
          >
            {/* Desktop Horizontal 7-Stage Flow (lg & xl) */}
            <div className="hidden lg:grid lg:grid-cols-7 gap-2 xl:gap-4 items-start relative pt-6 pb-2">
              {PIPELINE_STAGES.map((item, index) => (
                <motion.div
                  key={item.step}
                  variants={pipelineStepVariants}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* Standalone Large Serif Number + Hand-drawn Connector */}
                  <div className="relative w-full flex items-center justify-center">
                    <span className="font-serif text-4xl xl:text-5xl 2xl:text-6xl font-light text-[#083C33] tracking-tight transition-transform duration-300 group-hover:scale-105 group-hover:text-[#0D4F43] select-none leading-none">
                      {item.step}
                    </span>

                    {/* Curved Hand-Drawn Arrow between numbers */}
                    {index < PIPELINE_STAGES.length - 1 && (
                      <div className="absolute left-[calc(50%+26px)] right-[calc(-50%+26px)] top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                        <CurvedHorizontalArrow className="w-full max-w-[56px] xl:max-w-[70px] h-6 text-[#0D4F43]/85" />
                      </div>
                    )}
                  </div>

                  {/* Step Title */}
                  <h4 className="mt-4 text-xs xl:text-sm font-bold text-[#083C33] leading-snug tracking-tight">
                    {item.title}
                  </h4>

                  {/* Step Description */}
                  <p className="mt-1.5 text-[11px] xl:text-xs text-[#3D5A52] leading-relaxed max-w-[130px] xl:max-w-[155px]">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Tablet Controlled 2-Row Flow (sm & md) */}
            <div className="hidden sm:block lg:hidden space-y-10 pt-4 pb-2">
              {/* Row 1: Stages 01 to 04 */}
              <div className="grid grid-cols-4 gap-3 items-start">
                {PIPELINE_STAGES.slice(0, 4).map((item, index) => (
                  <motion.div
                    key={item.step}
                    variants={pipelineStepVariants}
                    className="relative flex flex-col items-center text-center group"
                  >
                    <div className="relative w-full flex items-center justify-center">
                      <span className="font-serif text-4xl font-light text-[#083C33] tracking-tight select-none leading-none group-hover:text-[#0D4F43] transition-colors">
                        {item.step}
                      </span>
                      {index < 3 && (
                        <div className="absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                          <CurvedHorizontalArrow className="w-full max-w-[52px] h-5 text-[#0D4F43]/85" />
                        </div>
                      )}
                    </div>
                    <h4 className="mt-3.5 text-xs font-bold text-[#083C33] leading-snug">
                      {item.title}
                    </h4>
                    <p className="mt-1.5 text-[11px] text-[#3D5A52] leading-relaxed max-w-[135px]">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Row 2: Stages 05 to 07 */}
              <div className="grid grid-cols-3 max-w-2xl mx-auto gap-4 items-start">
                {PIPELINE_STAGES.slice(4).map((item, index) => (
                  <motion.div
                    key={item.step}
                    variants={pipelineStepVariants}
                    className="relative flex flex-col items-center text-center group"
                  >
                    <div className="relative w-full flex items-center justify-center">
                      <span className="font-serif text-4xl font-light text-[#083C33] tracking-tight select-none leading-none group-hover:text-[#0D4F43] transition-colors">
                        {item.step}
                      </span>
                      {index < 2 && (
                        <div className="absolute left-[calc(50%+24px)] right-[calc(-50%+24px)] top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                          <CurvedHorizontalArrow className="w-full max-w-[56px] h-5 text-[#0D4F43]/85" />
                        </div>
                      )}
                    </div>
                    <h4 className="mt-3.5 text-xs font-bold text-[#083C33] leading-snug">
                      {item.title}
                    </h4>
                    <p className="mt-1.5 text-[11px] text-[#3D5A52] leading-relaxed max-w-[145px]">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile Vertical Flow (< 640px) */}
            <div className="sm:hidden space-y-3 pt-3 pb-2">
              {PIPELINE_STAGES.map((item, index) => (
                <motion.div
                  key={item.step}
                  variants={pipelineStepVariants}
                  className="flex flex-col items-center text-center"
                >
                  <span className="font-serif text-4xl font-light text-[#083C33] tracking-tight select-none leading-none">
                    {item.step}
                  </span>
                  <h4 className="mt-2 text-sm font-bold text-[#083C33]">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs text-[#3D5A52] max-w-xs leading-relaxed">
                    {item.desc}
                  </p>

                  {index < PIPELINE_STAGES.length - 1 && (
                    <CurvedVerticalArrow className="w-6 h-9 text-[#0D4F43]/85 my-2" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Research Domains - Deep Forest Panel */}
      <section className="site-container">
        <div className="deep-forest-panel rounded-[36px] p-8 sm:p-14 space-y-8 border border-[#166355] shadow-sm">
          <div className="border-b border-[#166355] pb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-[#F7F6F0]">
              Core Research Domains
            </h3>
            <p className="text-xs sm:text-sm text-[#D9DED4]/80 mt-1">
              Deconstructing how high-frequency anomalies expose synthetic generators when spatial pixels appear seamless.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={researchContainerVariants}
            className="grid grid-cols-1 md:grid-cols-3 pt-2"
          >
            {RESEARCH_DOMAINS.map((domain, index) => (
              <motion.div
                key={domain.num}
                variants={researchItemVariants}
                className={`group flex flex-col justify-between py-6 sm:py-8 px-0 md:px-8 xl:px-12 transition-all ${
                  index < 2 ? 'md:border-r md:border-[#166355]/40 border-b md:border-b-0 border-[#166355]/30 pb-8 md:pb-8' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Large Editorial Serif Number */}
                  <span className="font-serif text-3xl sm:text-4xl xl:text-5xl font-light text-[#D9DED4]/90 block select-none tracking-tight transition-transform duration-300 group-hover:-translate-y-0.5 leading-none">
                    {domain.num}
                  </span>

                  {/* Subtle technical accent line */}
                  <div className="w-8 h-px bg-[#166355] group-hover:w-12 group-hover:bg-[#A3C2B8] transition-all duration-300" />

                  {/* Domain Title */}
                  <h4 className="text-lg sm:text-xl font-bold text-[#F7F6F0] leading-snug tracking-tight uppercase pt-1 group-hover:text-white transition-colors duration-200">
                    {domain.title}
                  </h4>

                  {/* Research Explanation */}
                  <p className="text-xs sm:text-[13px] text-[#D9DED4]/85 leading-relaxed font-normal">
                    {domain.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


    </div>
  );
};
