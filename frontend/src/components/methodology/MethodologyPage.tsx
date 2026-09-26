import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Activity, 
  GitBranch, 
  Cpu, 
  Zap, 
  Binary, 
  ShieldCheck, 
  Code2, 
  CheckCircle2, 
  BookOpen, 
  Sliders, 
  Server,
  ArrowRight,
  Database,
  Sparkles,
  Search,
  Maximize2,
  FileCode,
  Terminal,
  FileCheck,
  Camera,
  Waves
} from 'lucide-react';
import { apiService } from '../../services/api';
import type { ModelMetadata } from '../../types/forensics';

interface PipelineStageDetail {
  id: string;
  stepNumber: string;
  name: string;
  domain: string;
  tensorInput: string;
  tensorOutput: string;
  pytorchClass: string;
  mathFormula: string;
  formulaTitle: string;
  description: string;
  keyInsights: string[];
  codeSnippet: string;
}

const PIPELINE_STAGES: PipelineStageDetail[] = [
  {
    id: 'stage-1',
    stepNumber: '01',
    name: 'Media Ingestion & ROI Alignment',
    domain: 'Spatial Preprocessing',
    tensorInput: 'Raw Media [H, W, 3] uint8',
    tensorOutput: 'Aligned Crop [B, 3, 512, 512] float32',
    pytorchClass: 'detect_and_align_face(rgb_img, target_size=512)',
    mathFormula: '\\mathbf{B}_{ROI} = [x - 0.2w, y - 0.2h, w + 0.4w, h + 0.4h] \\rightarrow \\text{Resize}(512 \\times 512)',
    formulaTitle: 'Haar Cascade Face Detection & Margin ROI Extraction',
    description: 'Validates MIME magic bytes, detects facial bounding boxes using OpenCV Haar Cascade classifiers with a 20% contextual boundary margin, or seamlessly falls back to square center-cropping on general non-facial synthetic media before resizing to 512×512.',
    keyInsights: [
      'Extracts contextual face ROI with 20% margin to capture hairline and boundary blending artifacts',
      'Provides automatic square center-crop fallback for non-facial generative images (e.g. landscapes, objects)',
      'Standardizes resolution to preserve 2D FFT spectral bin scaling across media'
    ],
    codeSnippet: `aligned_roi, face_found, face_count, bboxes = detect_and_align_face(
    rgb_img, target_size=512
)
# Normalized to [0.0, 1.0] float32 PyTorch tensor:
rgb_tensor = torch.from_numpy(aligned_roi).permute(2, 0, 1).unsqueeze(0).float() / 255.0`
  },
  {
    id: 'stage-2',
    stepNumber: '02',
    name: 'Spatial Rich Models (SRM) Filtering',
    domain: 'High-Pass Steganalysis',
    tensorInput: 'Aligned ROI [B, 1, 512, 512] Grayscale',
    tensorOutput: 'Residual Maps [B, 3, 512, 512] float32',
    pytorchClass: 'extract_srm_residual() / cv2.filter2D',
    mathFormula: 'R(x, y) = I(x, y) - \\sum_{i=-k}^{k} \\sum_{j=-k}^{k} K_{srm}(i, j) \\cdot I(x+i, y+j)',
    formulaTitle: 'Steganographic High-Pass Residual Extraction',
    description: 'Applies discrete 1st-order, 2nd-order Laplacian, and 3×3/5×5 SRM steganographic high-pass convolution kernels. Suppresses low-frequency facial semantics to expose camera sensor PRNU noise versus synthetic generative artifacts.',
    keyInsights: [
      'Suppresses structural facial semantics (eyes, mouth, skin tone) by >85%',
      'Exposes generative deconvolution checkerboards in GAN upsampling layers',
      'Isolates sub-pixel sensor noise distributions unreplicable by AI models'
    ],
    codeSnippet: `# SRM 3x3 Edge Kernel
K_edge = np.array([
    [-1,  2, -1],
    [ 2, -4,  2],
    [-1,  2, -1]
], dtype=np.float32)
residual_srm = cv2.filter2D(gray_img, -1, K_edge)`
  },
  {
    id: 'stage-3',
    stepNumber: '03',
    name: '2D FFT & 2D DCT Spectral Analysis',
    domain: 'Frequency Domain Decomposition',
    tensorInput: 'Spatial Grayscale [512, 512]',
    tensorOutput: 'FFT & DCT Tensors [B, 2, 512, 512] float32',
    pytorchClass: 'compute_fft_spectrum() & compute_2d_dct()',
    mathFormula: 'F(u, v) = \\sum_{x=0}^{M-1} \\sum_{y=0}^{N-1} f(x, y) e^{-j 2\\pi \\left(\\frac{ux}{M} + \\frac{vy}{N}\\right)}, \\quad S(u, v) = \\ln(1 + |F_{shift}|)',
    formulaTitle: '2D Orthogonal Frequency Spectrum Projection',
    description: 'Computes shifted 2D Fast Fourier Transform magnitude spectra with 50-bin azimuthal radial integration and Shannon spectral entropy. Computes orthonormal Type-II 2D DCT to isolate 8×8 block compression energy distributions.',
    keyInsights: [
      'Detects Dirac-comb periodic frequency spikes characteristic of GAN decoders',
      'Calculates Shannon spectral entropy across 50 radial frequency bins',
      'Type-II DCT separates high-frequency diagonal noise from natural luminance'
    ],
    codeSnippet: `# 2D Fast Fourier Transform
f = np.fft.fft2(gray_img.astype(np.float32))
f_shift = np.fft.fftshift(f)
magnitude_spectrum = np.log1p(np.abs(f_shift))

# 2D Orthonormal DCT
dct_rows = scipy.fftpack.dct(gray_img, type=2, axis=0, norm='ortho')
dct_2d = scipy.fftpack.dct(dct_rows, type=2, axis=1, norm='ortho')`
  },
  {
    id: 'stage-4',
    stepNumber: '04',
    name: 'Frequency Feature Encoder',
    domain: 'Deep Feature Extraction',
    tensorInput: '5-Channel Frequency Tensor [B, 5, 512, 512]',
    tensorOutput: 'Frequency Embedding z_freq [B, 256]',
    pytorchClass: 'FrequencyFeatureBranch(in_channels=5, out_dim=256)',
    mathFormula: '\\mathbf{z}_{freq} = \\text{ReLU}\\left( \\mathbf{W}_{fc} \\cdot \\text{Pool}\\left( \\text{ConvLayers}(\\mathbf{X}_{freq}) \\right) \\right)',
    formulaTitle: 'Multimodal 5-Channel Convolutional Encoder',
    description: 'Ingests concatenated 5-channel frequency representations (3-channel SRM residual + 1-channel 2D FFT + 1-channel 2D DCT) through a 4-stage convolutional tower with BatchNorm, LeakyReLU(0.2), and AdaptiveAvgPool2d.',
    keyInsights: [
      'Jointly encodes spatial residuals, Fourier azimuthal energy, and DCT matrices',
      'Projects 512×512 high-dimensional frequency maps to a dense 256-D latent vector',
      'Maintains scale invariance across varying levels of image compression'
    ],
    codeSnippet: `class FrequencyFeatureBranch(nn.Module):
    def __init__(self, in_channels=5, out_dim=256):
        super().__init__()
        self.conv_net = nn.Sequential(
            nn.Conv2d(in_channels, 64, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Conv2d(128, 256, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.LeakyReLU(0.2, inplace=True),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(256, out_dim),
            nn.ReLU(inplace=True)
        )`
  },
  {
    id: 'stage-5',
    stepNumber: '05',
    name: 'Cross-Attention Fusion Layer',
    domain: 'Multi-Modal Attention',
    tensorInput: 'z_spatial [B, 256] & z_freq [B, 256]',
    tensorOutput: 'Fused Latent Representation z_fused [B, 256]',
    pytorchClass: 'SpatialFrequencyCrossAttention(dim=256)',
    mathFormula: '\\text{Attn}(Q, K, V) = \\text{Softmax}\\left(\\frac{Q K^T}{\\sqrt{d}}\\right) V, \\quad \\mathbf{z}_{fused} = \\mathbf{W}_o \\text{Attn} + \\mathbf{z}_{spatial}',
    formulaTitle: 'Bidirectional Cross-Attention Conditioning',
    description: 'Allows high-level spatial visual features to query fine-grained residual frequency artifact tokens. Frequency embeddings provide cross-attention guidance to identify localized manipulation artifacts.',
    keyInsights: [
      'Spatial features act as Queries (Q); Frequency artifacts act as Keys (K) & Values (V)',
      'Pinpoints localized face-swap boundaries that look visually plausible to human eyes',
      'Residual skip connection guarantees gradient stability throughout backpropagation'
    ],
    codeSnippet: `class SpatialFrequencyCrossAttention(nn.Module):
    def __init__(self, dim=256):
        super().__init__()
        self.query_proj = nn.Linear(dim, dim)
        self.key_proj = nn.Linear(dim, dim)
        self.value_proj = nn.Linear(dim, dim)
        self.out_proj = nn.Linear(dim, dim)
        self.scale = dim ** -0.5

    def forward(self, spatial_feat, freq_feat):
        q = self.query_proj(spatial_feat).unsqueeze(1)
        k = self.key_proj(freq_feat).unsqueeze(1)
        v = self.value_proj(freq_feat).unsqueeze(1)
        attn = torch.softmax(torch.bmm(q, k.transpose(1, 2)) * self.scale, dim=-1)
        out = torch.bmm(attn, v).squeeze(1)
        return self.out_proj(out) + spatial_feat`
  },
  {
    id: 'stage-6',
    stepNumber: '06',
    name: 'Multi-Task Forensic Classification Heads',
    domain: 'Attribution & Provenance',
    tensorInput: 'Fused Vector z_fused [B, 256]',
    tensorOutput: 'Binary Logits [B, 2] & Attribution Logits [B, 8]',
    pytorchClass: 'detection_head & attribution_head',
    mathFormula: '\\hat{y}_{det} = \\text{Softmax}(\\mathbf{W}_d \\mathbf{z}_{fused}), \\quad \\hat{y}_{attr} = \\text{Softmax}(\\mathbf{W}_a \\mathbf{z}_{fused})',
    formulaTitle: 'Dual Multi-Task Linear Projections',
    description: 'Dual linear multi-task classification heads trained with composite multi-task loss. Detection head outputs binary real/fake confidence; attribution head predicts probability distribution over known generative model families.',
    keyInsights: [
      'Trained with joint loss: L_total = L_binary + lambda * L_attribution',
      'Attribute generator family: StyleGAN2/3, ProGAN, SDXL, Midjourney, Latent Diffusion',
      'Provides grounded calibration confidence calibrated via Platt scaling'
    ],
    codeSnippet: `self.detection_head = nn.Sequential(
    nn.Linear(256, 64),
    nn.ReLU(inplace=True),
    nn.Linear(64, 2)  # [Real, Synthetic]
)
self.attribution_head = nn.Sequential(
    nn.Linear(256, 128),
    nn.ReLU(inplace=True),
    nn.Linear(128, num_classes) # [StyleGAN2, StyleGAN3, SDXL, ...]
)`
  }
];

export const MethodologyPage: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<PipelineStageDetail>(PIPELINE_STAGES[2]);
  const [modelRegistry, setModelRegistry] = useState<{
    image_model?: ModelMetadata;
    video_model?: ModelMetadata;
    attribution_classes?: string[];
  } | null>(null);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState<boolean>(true);
  const [activeFormulaTab, setActiveFormulaTab] = useState<'fft' | 'dct' | 'srm' | 'temporal'>('fft');

  useEffect(() => {
    let isMounted = true;
    apiService.getModelRegistry()
      .then((data) => {
        if (isMounted) {
          setModelRegistry(data);
          setIsLoadingRegistry(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load model registry:", err);
        if (isMounted) setIsLoadingRegistry(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="relative w-full pb-24 pt-6 sm:pt-10 px-4 sm:px-6 lg:px-8 selection:bg-[#0D5145]/20 selection:text-[#083C33]">
      
      {/* Background Subtle Forensic Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute top-12 left-10 text-[10px] font-mono text-[#52706A]/30 tracking-widest hidden md:block">
          + METHODOLOGY_REF // DUAL_STREAM_CROSS_ATTENTION
        </div>
        <div className="absolute top-12 right-10 text-[10px] font-mono text-[#52706A]/30 tracking-widest hidden md:block">
          + PYTORCH_MODEL_REGISTRY: ACTIVE
        </div>
        <svg
          className="absolute -top-32 -right-32 w-96 h-96 text-[#0D5145]/5"
          viewBox="0 0 400 400"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="200" cy="200" r="60" strokeWidth="1" strokeDasharray="3 5" />
          <circle cx="200" cy="200" r="120" strokeWidth="0.8" strokeDasharray="4 6" />
          <line x1="200" y1="20" x2="200" y2="380" strokeWidth="0.75" strokeDasharray="3 5" />
          <line x1="20" y1="200" x2="380" y2="200" strokeWidth="0.75" strokeDasharray="3 5" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto space-y-12 sm:space-y-16">

        {/* ========================================================================= */}
        {/* HERO HEADER: EDITORIAL SCIENTIFIC RESEARCH DOSSIER                        */}
        {/* ========================================================================= */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-[#D5D9D1] bg-white/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D5145] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#0D5145] font-semibold">
              RESEARCH METHODOLOGY & ARCHITECTURE
            </span>
          </div>

          {/* Editorial Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#083C33] tracking-tight leading-[1.12] font-serif">
            Residual Frequency Attribution Architecture
          </h1>

          {/* Subtitle Abstract */}
          <p className="text-sm sm:text-base text-[#52706A] max-w-3xl mx-auto leading-relaxed">
            DeepTrace AI isolates generative manipulation by decoupling low-frequency spatial semantics from high-frequency sensor noise residuals. Below is the authentic mathematical formulation, PyTorch neural network specifications, and signal processing architecture.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* LIVE SYSTEM STATUS BAR (EDITORIAL RESEARCH TELEMETRY)                     */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-[24px] border border-[#D5D9D1] p-5 sm:p-6 shadow-[0_8px_30px_rgba(8,60,51,0.04)]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <div className="md:col-span-8 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF0E6] border border-[#D5D9D1] flex items-center justify-center text-[#0D5145] shrink-0">
                <Server className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2.5">
                  <span className="text-sm font-bold text-[#083C33]">
                    {modelRegistry?.image_model?.model_name || 'DeepTrace-SpatialFreq-ViT'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#EBF0E6] text-[#0D5145] border border-[#D5D9D1]">
                    {modelRegistry?.image_model?.model_version || 'v1.0.0-unweighted'}
                  </span>
                </div>
                <p className="text-xs text-[#52706A] font-mono">
                  Hardware: <span className="font-semibold text-[#083C33]">{modelRegistry?.image_model?.inference_device?.toUpperCase() || 'CPU'}</span> • Resolution: 512×512 • 5-Channel Multimodal Frequency Representation
                </p>
              </div>
            </div>

            <div className="md:col-span-4 flex items-center md:justify-end space-x-3 text-xs font-mono">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#EBF0E6] border border-[#D5D9D1] text-[#0D5145]">
                <span className="w-2 h-2 rounded-full bg-[#0D5145] animate-ping" />
                <span className="font-semibold">PyTorch Engine Active</span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* CORE METHODOLOGY PILLARS (EDITORIAL 3-STRATA MATRIX)                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-[24px] border border-[#D5D9D1] p-6 shadow-[0_8px_30px_rgba(8,60,51,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#0D5145]">PILLAR 01</span>
              <Layers className="w-4 h-4 text-[#52706A]" />
            </div>
            <h3 className="text-lg font-bold text-[#083C33]">
              Spatial Decoupling
            </h3>
            <p className="text-xs text-[#52706A] leading-relaxed">
              Suppresses primary facial semantics (eyes, skin tone, background) using Spatial Rich Model (SRM) high-pass filtering to isolate sub-pixel sensor noise residuals.
            </p>
          </div>

          <div className="bg-white rounded-[24px] border border-[#D5D9D1] p-6 shadow-[0_8px_30px_rgba(8,60,51,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#0D5145]">PILLAR 02</span>
              <Activity className="w-4 h-4 text-[#52706A]" />
            </div>
            <h3 className="text-lg font-bold text-[#083C33]">
              Orthogonal Spectrum Projection
            </h3>
            <p className="text-xs text-[#52706A] leading-relaxed">
              Decomposes media into 2D Fast Fourier Transform magnitude spectra and 2D Discrete Cosine Transform matrices to detect periodic upsampling checkerboards.
            </p>
          </div>

          <div className="bg-white rounded-[24px] border border-[#D5D9D1] p-6 shadow-[0_8px_30px_rgba(8,60,51,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#0D5145]">PILLAR 03</span>
              <Cpu className="w-4 h-4 text-[#52706A]" />
            </div>
            <h3 className="text-lg font-bold text-[#083C33]">
              Cross-Attention Fusion
            </h3>
            <p className="text-xs text-[#52706A] leading-relaxed">
              Conditions high-level spatial visual representations against frequency residual tokens, enabling joint multi-task detection and generator family attribution.
            </p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE NEURAL PIPELINE ARCHITECTURE (SECTION 1)                     */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#D5D9D1] pb-4 gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0D5145] font-semibold">
                NEURAL ARCHITECTURE SPECIFICATION
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#083C33] tracking-tight font-serif mt-1">
                6-Stage Forensic Pipeline Flowchart
              </h2>
            </div>
            <span className="text-xs font-mono text-[#52706A]">
              Select stage to inspect tensors & PyTorch source
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Stage Selector List */}
            <div className="lg:col-span-5 space-y-3">
              {PIPELINE_STAGES.map((stage) => {
                const isSelected = selectedStage.id === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedStage(stage)}
                    className={`w-full text-left p-4 sm:p-5 rounded-[20px] border transition-all duration-200 focus:outline-hidden ${
                      isSelected
                        ? 'bg-white border-[#0D5145] shadow-[0_8px_30px_rgba(8,60,51,0.08)] scale-[1.01]'
                        : 'bg-white/60 border-[#D5D9D1] hover:bg-white hover:border-[#0D5145]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                        isSelected ? 'text-[#0D5145]' : 'text-[#52706A]'
                      }`}>
                        STAGE {stage.stepNumber} // {stage.domain}
                      </span>
                      <span className="text-[10px] font-mono text-[#52706A]/80">
                        {stage.tensorOutput.split(' ')[0]}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#083C33] mt-1.5">
                      {stage.name}
                    </h3>

                    <p className="text-xs text-[#52706A] mt-1 line-clamp-2 leading-relaxed">
                      {stage.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Active Stage Technical Blueprint */}
            <div className="lg:col-span-7 bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border border-[#D5D9D1] shadow-[0_10px_40px_rgba(8,60,51,0.06)] space-y-6">
              
              {/* Stage Header */}
              <div className="border-b border-[#D5D9D1] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-[#0D5145] font-bold uppercase tracking-wider">
                    STAGE {selectedStage.stepNumber} // {selectedStage.domain}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#083C33] font-serif">
                    {selectedStage.name}
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#EBF0E6] border border-[#D5D9D1] text-[11px] font-mono text-[#083C33] font-semibold self-start sm:self-auto">
                  Active Blueprint
                </div>
              </div>

              {/* Tensor Dimensions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#F7F8F4] border border-[#D5D9D1] space-y-1">
                  <span className="text-[10px] text-[#52706A] uppercase font-bold tracking-wider">INPUT TENSOR SHAPE</span>
                  <span className="font-bold text-[#083C33] block">{selectedStage.tensorInput}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F7F8F4] border border-[#D5D9D1] space-y-1">
                  <span className="text-[10px] text-[#52706A] uppercase font-bold tracking-wider">OUTPUT TENSOR SHAPE</span>
                  <span className="font-bold text-[#0D5145] block">{selectedStage.tensorOutput}</span>
                </div>
              </div>

              {/* Mathematical Formulation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#083C33] font-mono uppercase tracking-wider flex items-center space-x-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#0D5145]" />
                    <span>{selectedStage.formulaTitle}</span>
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#083C33] text-[#F7F6F0] font-mono text-xs overflow-x-auto border border-[#166355] shadow-inner">
                  {selectedStage.mathFormula}
                </div>
              </div>

              {/* Architectural Description & Key Insights */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-[#083C33] font-mono uppercase tracking-wider">
                  ARCHITECTURAL RATIONALE & INSIGHTS
                </span>
                <p className="text-xs sm:text-sm text-[#2D3F3A] leading-relaxed">
                  {selectedStage.description}
                </p>
                <div className="space-y-1.5 pt-1">
                  {selectedStage.keyInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-[#52706A]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0D5145] shrink-0 mt-0.5" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PyTorch Code Implementation */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#083C33]">
                  <span className="flex items-center space-x-1.5 font-mono">
                    <Code2 className="w-4 h-4 text-[#0D5145]" />
                    <span>PyTorch Class Signature</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#52706A] bg-[#EBF0E6] px-2 py-0.5 rounded border border-[#D5D9D1]">
                    {selectedStage.pytorchClass.split('(')[0]}
                  </span>
                </div>
                <pre className="p-4 rounded-2xl bg-[#052923] text-[#D9DED4] font-mono text-[11px] overflow-x-auto border border-[#166355] leading-relaxed shadow-inner">
                  <code>{selectedStage.codeSnippet}</code>
                </pre>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* MATHEMATICAL FOUNDATIONS & SIGNAL PROCESSING THEORY (SECTION 2)          */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          
          <div className="border-b border-[#D5D9D1] pb-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0D5145] font-semibold">
              THEORETICAL DERIVATION
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#083C33] tracking-tight font-serif mt-1">
              Mathematical Foundations & Signal Processing Theory
            </h2>
            <p className="text-xs sm:text-sm text-[#52706A] mt-1 max-w-3xl leading-relaxed">
              Why residual frequency decomposition circumvents spatial semantic camouflage used by modern GANs and Diffusion models.
            </p>
          </div>

          {/* Interactive Theory Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'fft', label: '1. 2D Fourier Transform (FFT)', icon: Activity },
              { id: 'dct', label: '2. Discrete Cosine Transform (DCT)', icon: Cpu },
              { id: 'srm', label: '3. Steganographic Residuals (SRM)', icon: Layers },
              { id: 'temporal', label: '4. Video Temporal Jitter (ΔHF)', icon: Zap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFormulaTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFormulaTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                    isActive
                      ? 'bg-[#0D4F43] border-[#0D4F43] text-white shadow-xs'
                      : 'bg-white border-[#D5D9D1] text-[#083C33] hover:bg-[#EBF0E6]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Theory Tab Card */}
          <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border border-[#D5D9D1] shadow-[0_10px_40px_rgba(8,60,51,0.06)] space-y-6">
            
            {activeFormulaTab === 'fft' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#083C33] font-serif">2D Discrete Fourier Transform & Spectral Artifacts</h3>
                  <p className="text-xs sm:text-sm text-[#2D3F3A] leading-relaxed">
                    Generative models that utilize deconvolutional layers (transposed convolutions) or latent diffusion decoders exhibit spatial periodicities. By projecting spatial signals into the orthogonal frequency domain, these periodic grid patterns manifest as distinct, quantifiable high-frequency spikes (Dirac-comb artifacts).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-2xl bg-[#083C33] text-[#F7F6F0] border border-[#166355] space-y-2">
                    <span className="text-[#76A08A] font-bold block text-[11px]">2D Forward Fourier Transform</span>
                    <div className="text-xs sm:text-sm">
                      {"F(u, v) = \u2211_{x=0}^{M-1} \u2211_{y=0}^{N-1} f(x, y) \u00B7 e^{-j 2\u03C0 (ux/M + vy/N)}"}
                    </div>
                    <span className="text-[11px] text-[#D9DED4]/80 block pt-1">
                      {"Log-Magnitude Spectrum: S(u, v) = ln(1 + |F_{shift}(u, v)|)"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#083C33] text-[#F7F6F0] border border-[#166355] space-y-2">
                    <span className="text-[#76A08A] font-bold block text-[11px]">Azimuthal Radial Profile Integration</span>
                    <div className="text-xs sm:text-sm">
                      {"P(r) = (1 / |A_r|) \u2211_{(u,v) \u2208 A_r} S(u, v)"}
                    </div>
                    <span className="text-[11px] text-[#D9DED4]/80 block pt-1">
                      {"where A_r = { (u, v) : r \u2264 \u221A(u\u00B2 + v\u00B2) < r + \u0394r }"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#EBF0E6] border border-[#D5D9D1] text-xs text-[#083C33] space-y-2">
                  <span className="font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0D4F43]" />
                    <span>Shannon Spectral Entropy Formulation:</span>
                  </span>
                  <p className="text-[#2D3F3A] leading-relaxed">
                    {"DeepTrace computes normalized spectral density probability p_i = S(u_i, v_i)\u00B2 / \u2211 S(u_k, v_k)\u00B2, yielding Shannon Entropy H(S) = -\u2211 p_i \u00B7 log\u2082(p_i). Authentic photographs possess smooth, continuous spectral decay with high entropy, whereas deepfakes with upsampling grid artifacts exhibit localized spectral spikes and lower entropy."}
                  </p>
                </div>
              </div>
            )}

            {activeFormulaTab === 'dct' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#083C33] font-serif">2D Discrete Cosine Transform (DCT Type-II)</h3>
                  <p className="text-xs sm:text-sm text-[#2D3F3A] leading-relaxed">
                    Unlike Fourier transform which relies on complex exponentials, DCT expresses images purely in real orthogonal cosine basis functions. This isolates block-based spatial compression boundaries (e.g. 8×8 block artifacts from JPEG compression and neural autoencoder bottlenecks).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#083C33] text-[#F7F6F0] font-mono border border-[#166355] space-y-2">
                  <span className="text-[#76A08A] font-bold block text-[11px]">Type-II Orthonormal 2D DCT Formulation</span>
                  <div className="text-xs sm:text-sm">
                    {"C(u, v) = \u03B1(u) \u03B1(v) \u2211_{x=0}^{M-1} \u2211_{y=0}^{N-1} f(x, y) cos[\u03C0(2x+1)u / 2M] cos[\u03C0(2y+1)v / 2N]"}
                  </div>
                  <div className="text-[11px] text-[#D9DED4]/80 pt-1">
                    {"where \u03B1(0) = \u221A(1/M), \u03B1(k) = \u221A(2/M) for k > 0"}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#F7F8F4] border border-[#D5D9D1] space-y-1.5">
                    <span className="font-bold text-[#083C33]">Low-Frequency Energy Zone (dist &lt; 0.3)</span>
                    <p className="text-[#52706A] leading-relaxed">
                      Concentrated around top-left coefficient (0,0) (DC origin). Captures structural brightness and general luminance contours.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F8F4] border border-[#D5D9D1] space-y-1.5">
                    <span className="font-bold text-[#083C33]">High-Frequency Energy Ratio (dist &ge; 0.7)</span>
                    <p className="text-[#52706A] leading-relaxed">
                      {"Evaluated as Ratio_HF = \u2211_{d \u2265 0.7} C(u, v)\u00B2 / \u2211_{u, v} C(u, v)\u00B2. Unnatural high-frequency energy accumulation exposes generative upsampling grids."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeFormulaTab === 'srm' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#083C33] font-serif">Spatial Rich Models (SRM) & High-Pass Noise Residuals</h3>
                  <p className="text-xs sm:text-sm text-[#2D3F3A] leading-relaxed">
                    Physical digital cameras impart Photo-Response Non-Uniformity (PRNU) noise from silicon sensor fabrication. Generative models lack physical sensors, producing synthetic noise distributions that linear high-pass steganographic filters isolate.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-2xl bg-[#083C33] text-[#F7F6F0] border border-[#166355] space-y-1.5">
                    <span className="text-[#76A08A] font-bold block text-[11px]">1st-Order Horizontal Residual</span>
                    <div className="p-2 rounded bg-[#052923] text-center">
                      [0, 0, 0]<br/>
                      [-1, 1, 0]<br/>
                      [0, 0, 0]
                    </div>
                    <span className="text-[10px] text-[#D9DED4]/70 block pt-1">Isolates horizontal pixel gradient noise</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#083C33] text-[#F7F6F0] border border-[#166355] space-y-1.5">
                    <span className="text-[#76A08A] font-bold block text-[11px]">3x3 SRM Edge Kernel</span>
                    <div className="p-2 rounded bg-[#052923] text-center">
                      [-1,  2, -1]<br/>
                      [ 2, -4,  2]<br/>
                      [-1,  2, -1]
                    </div>
                    <span className="text-[10px] text-[#D9DED4]/70 block pt-1">Laplacian second-order boundary residual</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#083C33] text-[#F7F6F0] border border-[#166355] space-y-1.5">
                    <span className="text-[#76A08A] font-bold block text-[11px]">5x5 Square Filter (Normalized)</span>
                    <div className="p-2 rounded bg-[#052923] text-center text-[9px]">
                      [-1, 2, -2, 2, -1] / 12<br/>
                      [ 2, -6, 8, -6, 2] / 12<br/>
                      ... 5x5 stego kernel ...
                    </div>
                    <span className="text-[10px] text-[#D9DED4]/70 block pt-1">Suppresses content over larger receptive field</span>
                  </div>
                </div>
              </div>
            )}

            {activeFormulaTab === 'temporal' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#083C33] font-serif">Video Temporal Consistency & Inter-Frame Spectral Jitter</h3>
                  <p className="text-xs sm:text-sm text-[#2D3F3A] leading-relaxed">
                    Video deepfakes synthesized frame-by-frame often exhibit sub-pixel flickering between frames. DeepTrace computes temporal frequency variance across consecutive uniform video samples.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#083C33] text-[#F7F6F0] font-mono border border-[#166355] space-y-2 text-xs">
                  <span className="text-[#76A08A] font-bold block text-[11px]">Inter-Frame Spectral Jitter & Coherence Metric</span>
                  <div className="text-xs sm:text-sm">
                    {"\u0394HF(t) = | E_high(t)/E_total(t) - E_high(t-1)/E_total(t-1) |"}
                  </div>
                  <div className="text-xs sm:text-sm pt-1">
                    {"Jitter = \u03C3(\u0394HF),    Temporal Consistency = max(0, 1.0 - 4.0 \u00B7 Jitter)"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#EBF0E6] border border-[#D5D9D1] text-xs text-[#083C33] space-y-1.5">
                  <span className="font-bold">Evaluation Rule:</span>
                  <p className="text-[#2D3F3A] leading-relaxed">
                    If Jitter &lt; 0.03, the sequence exhibits physical sensor stability typical of genuine camera recordings. If Jitter &gt; 0.03, temporal frequency variance indicates non-temporally regularized synthetic generation.
                  </p>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ========================================================================= */}
        {/* TARGET GENERATIVE SOURCE FAMILIES (SECTION 3)                            */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          
          <div className="border-b border-[#D5D9D1] pb-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0D5145] font-semibold">
              PROVENANCE CLASSIFICATION SPECTRUM
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#083C33] tracking-tight font-serif mt-1">
              Target Generative Source Families
            </h2>
            <p className="text-xs sm:text-sm text-[#52706A] mt-1 max-w-3xl leading-relaxed">
              Registered attribution classes benchmarked within the dual-branch spatial-frequency classifier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(modelRegistry?.attribution_classes || [
              'Real / Authentic',
              'StyleGAN2',
              'StyleGAN3',
              'ProGAN',
              'Stable Diffusion v1.5',
              'Stable Diffusion XL',
              'Latent Diffusion',
              'Midjourney v5'
            ]).map((clsName, idx) => {
              const lower = clsName.toLowerCase();
              const isReal = lower.includes('real') || lower.includes('authentic');
              const isSg3 = lower.includes('stylegan3');
              const isGan = isSg3 || lower.includes('stylegan') || lower.includes('progan');
              const isMj = lower.includes('midjourney');
              const isXl = lower.includes('xl');

              const familyType = isReal ? 'Real' : isGan ? 'GAN' : 'Diffusion';
              const familyLabel = isReal ? 'ORGANIC / SENSOR' : isGan ? 'ADVERSARIAL GAN' : 'LATENT DIFFUSION';
              
              const mechanism = isReal
                ? 'Physical Optical Sensor (Bayer CFA)'
                : isSg3
                ? 'Continuous Signal Translation'
                : lower.includes('progan')
                ? 'Progressive Transposed Conv'
                : lower.includes('stylegan')
                ? 'Style-Modulated Latent Conv2D'
                : isMj
                ? 'Proprietary Latent Diffusion Prior'
                : isXl
                ? 'Cascaded U-Net 2.6B + Latent Refiner'
                : 'LDM U-Net 860M + 8× VAE Decoder';

              const artifact = isReal
                ? 'Continuous 1/f power-law decay with PRNU silicon noise floor.'
                : isSg3
                ? 'Suppressed aliasing with subtle radial harmonic rings in Fourier domain.'
                : lower.includes('progan')
                ? 'Strong harmonic peak multiples in radial azimuthal power spectrum.'
                : lower.includes('stylegan')
                ? 'Periodic deconvolution checkerboard spikes visible in 2D FFT.'
                : isMj
                ? 'Steep spectral power falloff at high frequencies with proprietary prior.'
                : isXl
                ? 'Suppressed highs with multi-scale decoder wavelet seams.'
                : 'High-frequency roll-off induced by latent VAE decoders in residual band.';

              const signature = isReal
                ? '1/f Natural Decay'
                : isSg3
                ? 'Harmonic Rings'
                : isGan
                ? 'Periodic Nyquist Spikes'
                : isMj
                ? 'High-Cut Roll-off'
                : 'Spectral Roll-off';

              const bars = isReal
                ? [85, 68, 52, 38]
                : isSg3
                ? [68, 88, 56, 80]
                : isGan
                ? [55, 96, 42, 90]
                : isMj
                ? [94, 78, 40, 18]
                : [90, 72, 32, 14];

              const theme = isReal
                ? {
                    cardBg: 'bg-gradient-to-br from-emerald-500/[0.04] via-white to-emerald-600/[0.07] hover:border-emerald-600/70 hover:shadow-emerald-950/10',
                    borderColor: 'border-emerald-200/90',
                    badgeBg: 'bg-emerald-50/90 text-emerald-800 border-emerald-300/80',
                    dotColor: 'bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.7)]',
                    iconBg: 'text-emerald-700 bg-emerald-100/70',
                    watermark: 'text-emerald-800/[0.04] group-hover:text-emerald-800/[0.08]',
                    barColor: 'bg-emerald-600',
                    signatureColor: 'text-emerald-800'
                  }
                : isSg3
                ? {
                    cardBg: 'bg-gradient-to-br from-amber-500/[0.03] via-white to-[#0D4F43]/[0.05] hover:border-amber-600/70 hover:shadow-amber-950/10',
                    borderColor: 'border-amber-200/90',
                    badgeBg: 'bg-amber-50/90 text-amber-800 border-amber-300/80',
                    dotColor: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]',
                    iconBg: 'text-amber-700 bg-amber-100/70',
                    watermark: 'text-amber-800/[0.04] group-hover:text-amber-800/[0.08]',
                    barColor: 'bg-amber-600',
                    signatureColor: 'text-amber-800'
                  }
                : isGan
                ? {
                    cardBg: 'bg-gradient-to-br from-teal-500/[0.03] via-white to-[#0D4F43]/[0.06] hover:border-[#0D4F43]/70 hover:shadow-teal-950/10',
                    borderColor: 'border-[#D5D9D1]',
                    badgeBg: 'bg-teal-50/90 text-teal-800 border-teal-300/80',
                    dotColor: 'bg-teal-600 shadow-[0_0_8px_rgba(20,184,166,0.7)]',
                    iconBg: 'text-teal-700 bg-teal-100/70',
                    watermark: 'text-teal-800/[0.04] group-hover:text-teal-800/[0.08]',
                    barColor: 'bg-teal-700',
                    signatureColor: 'text-teal-800'
                  }
                : isMj
                ? {
                    cardBg: 'bg-gradient-to-br from-indigo-500/[0.04] via-white to-[#0D4F43]/[0.06] hover:border-indigo-600/70 hover:shadow-indigo-950/10',
                    borderColor: 'border-indigo-200/90',
                    badgeBg: 'bg-indigo-50/90 text-indigo-800 border-indigo-300/80',
                    dotColor: 'bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.7)]',
                    iconBg: 'text-indigo-700 bg-indigo-100/70',
                    watermark: 'text-indigo-800/[0.04] group-hover:text-indigo-800/[0.08]',
                    barColor: 'bg-indigo-600',
                    signatureColor: 'text-indigo-800'
                  }
                : {
                    cardBg: 'bg-gradient-to-br from-sky-500/[0.03] via-white to-[#0D4F43]/[0.06] hover:border-[#0D4F43]/70 hover:shadow-sky-950/10',
                    borderColor: 'border-sky-200/90',
                    badgeBg: 'bg-sky-50/90 text-sky-800 border-sky-300/80',
                    dotColor: 'bg-sky-600 shadow-[0_0_8px_rgba(2,132,199,0.7)]',
                    iconBg: 'text-sky-700 bg-sky-100/70',
                    watermark: 'text-sky-800/[0.04] group-hover:text-sky-800/[0.08]',
                    barColor: 'bg-[#0D5145]',
                    signatureColor: 'text-[#0D5145]'
                  };

              return (
                <div 
                  key={clsName}
                  className={`relative overflow-hidden p-5 rounded-[22px] border ${theme.borderColor} ${theme.cardBg} shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1`}
                >
                  {/* Subtle Ambient Watermark in Background */}
                  <div className={`absolute -right-3 -bottom-3 ${theme.watermark} transition-all duration-500 group-hover:scale-110 pointer-events-none`}>
                    {familyType === 'Real' ? (
                      <Camera className="w-24 h-24" />
                    ) : familyType === 'GAN' ? (
                      <Cpu className="w-24 h-24" />
                    ) : (
                      <Waves className="w-24 h-24" />
                    )}
                  </div>

                  <div className="relative z-10 space-y-3">
                    {/* Top Bar: Monospace Class Pill + Family Pill with Pulse */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/95 border border-[#D5D9D1] text-[#52706A] shadow-2xs">
                        CLASS {String(idx).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor} animate-pulse`} />
                        <span className={`text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                          {familyLabel}
                        </span>
                      </div>
                    </div>

                    {/* Class Name & Mechanism Pill */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-base sm:text-lg font-bold text-[#083C33] font-serif group-hover:text-[#0D5145] transition-colors tracking-tight">
                          {clsName}
                        </h4>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${theme.iconBg} opacity-85 group-hover:opacity-100 transition-opacity`}>
                          {familyType === 'Real' ? (
                            <Camera className="w-3.5 h-3.5" />
                          ) : familyType === 'GAN' ? (
                            <Cpu className="w-3.5 h-3.5" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/85 border border-[#D5D9D1]/70 text-[#083C33]">
                          {mechanism}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#52706A] mt-2 leading-relaxed">
                        {artifact}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Forensic FFT Signature + Equalizer Display */}
                  <div className="relative z-10 pt-3 mt-3 border-t border-[#D5D9D1]/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Activity className={`w-3.5 h-3.5 ${theme.signatureColor}`} />
                      <span className="text-[10px] font-mono font-medium text-[#3D5A52]">
                        {signature}
                      </span>
                    </div>

                    {/* 4-bar equalizer illustrating frequency energy spectrum */}
                    <div className="flex items-end gap-1 h-3.5 px-1.5 py-0.5 rounded bg-white/80 border border-[#D5D9D1]/60" title="Simulated Azimuthal FFT Energy Spectrum">
                      {bars.map((barHeight, bIdx) => (
                        <span
                          key={bIdx}
                          className={`w-1 rounded-xs transition-all duration-300 ${theme.barColor}`}
                          style={{ height: `${barHeight}%` }}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
