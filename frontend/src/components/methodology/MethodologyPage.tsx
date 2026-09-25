import React, { useEffect, useState } from 'react';
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
  Database
} from 'lucide-react';
import { apiService } from '../../services/api';
import type { ModelMetadata } from '../../types/forensics';

interface PipelineStageDetail {
  id: string;
  name: string;
  domain: string;
  tensorInput: string;
  tensorOutput: string;
  pytorchClass: string;
  mathFormula: string;
  description: string;
  codeSnippet: string;
}

const PIPELINE_STAGES: PipelineStageDetail[] = [
  {
    id: 'stage-1',
    name: '1. Media Ingestion & ROI Alignment',
    domain: 'Spatial Preprocessing',
    tensorInput: 'Raw Media [H, W, 3] uint8',
    tensorOutput: 'Aligned Crop [B, 3, 512, 512] float32',
    pytorchClass: 'detect_and_align_face(rgb_img, target_size=512)',
    mathFormula: 'I_{aligned} = \\mathcal{W}(I_{raw}, \\mathbf{M}_{affine}) \\quad \\text{where } \\mathbf{M} \\text{ aligns eye coordinates}',
    description: 'Validates MIME magic bytes, extracts facial landmark coordinates using Haar/MTCNN cascades, and applies affine transformation to normalize facial orientation and scale to 512x512 pixels.',
    codeSnippet: `aligned_roi, face_found, face_count, bboxes = detect_and_align_face(
    rgb_img, target_size=512
)
# Normalized to [0, 1] range:
rgb_tensor = torch.from_numpy(aligned_roi).permute(2, 0, 1).unsqueeze(0).float() / 255.0`
  },
  {
    id: 'stage-2',
    name: '2. Spatial Rich Models (SRM) Filtering',
    domain: 'High-Pass Noise Steganalysis',
    tensorInput: 'Aligned ROI [B, 1, 512, 512] Grayscale',
    tensorOutput: 'Residual Maps [B, 3, 512, 512] float32',
    pytorchClass: 'extract_srm_residual() / cv2.filter2D',
    mathFormula: 'R(x, y) = I(x, y) - \\sum_{i,j} K(i, j) \\cdot I(x+i, y+j)',
    description: 'Applies 1st-order, 2nd-order discrete Laplacian, and 3x3/5x5 SRM steganographic high-pass convolution kernels. Suppresses visual semantic content to expose sub-pixel camera sensor noise and generative upsampling residuals.',
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
    name: '3. 2D FFT & 2D DCT Spectral Analysis',
    domain: 'Frequency Domain Decomposition',
    tensorInput: 'Spatial Grayscale [512, 512]',
    tensorOutput: 'FFT & DCT Tensors [B, 2, 512, 512] float32',
    pytorchClass: 'compute_fft_spectrum() & compute_2d_dct()',
    mathFormula: 'F(u, v) = \\sum_{x=0}^{M-1} \\sum_{y=0}^{N-1} f(x, y) e^{-j 2\\pi (\\frac{ux}{M} + \\frac{vy}{N})}, \\quad S(u, v) = \\ln(1 + |F_{shift}|)',
    description: 'Computes shifted 2D Fast Fourier Transform magnitude spectrum with 50-bin azimuthal radial integration and Shannon spectral entropy. Computes orthonormal Type-II 2D DCT for 8x8 block energy decomposition.',
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
    name: '4. Frequency Feature Encoder',
    domain: 'Deep Feature Extraction',
    tensorInput: '5-Channel Frequency Tensor [B, 5, 512, 512]',
    tensorOutput: 'Frequency Embedding z_freq [B, 256]',
    pytorchClass: 'FrequencyFeatureBranch(in_channels=5, out_dim=256)',
    mathFormula: '\\mathbf{z}_{freq} = \\text{ReLU}\\left( \\mathbf{W}_{fc} \\cdot \\text{Pool}\\left( \\text{ConvLayers}(\\mathbf{X}_{freq}) \\right) \\right)',
    description: 'Ingests concatenated 5-channel frequency representations (3ch SRM residual + 1ch 2D FFT + 1ch 2D DCT) through a 4-stage convolutional tower with BatchNorm, LeakyReLU(0.2), and AdaptiveAvgPool2d.',
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
    name: '5. Cross-Attention Fusion Layer',
    domain: 'Multi-Modal Attention',
    tensorInput: 'z_spatial [B, 256] & z_freq [B, 256]',
    tensorOutput: 'Fused Latent Representation z_fused [B, 256]',
    pytorchClass: 'SpatialFrequencyCrossAttention(dim=256)',
    mathFormula: '\\text{Attn}(Q, K, V) = \\text{Softmax}\\left(\\frac{Q K^T}{\\sqrt{d}}\\right) V, \\quad \\mathbf{z}_{fused} = \\mathbf{W}_o \\text{Attn} + \\mathbf{z}_{spatial}',
    description: 'Allows high-level spatial visual features to query fine-grained residual frequency artifact tokens. Frequency embeddings provide cross-attention guidance to identify localized manipulation artifacts.',
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
    name: '6. Multi-Task Forensic Classification Heads',
    domain: 'Attribution & Provenance',
    tensorInput: 'Fused Vector z_fused [B, 256]',
    tensorOutput: 'Binary Logits [B, 2] & Attribution Logits [B, 8]',
    pytorchClass: 'detection_head & attribution_head',
    mathFormula: '\\hat{y}_{det} = \\text{Softmax}(\\mathbf{W}_d \\mathbf{z}_{fused}), \\quad \\hat{y}_{attr} = \\text{Softmax}(\\mathbf{W}_a \\mathbf{z}_{fused})',
    description: 'Dual linear multi-task classification heads trained with composite multi-task loss. Detection head outputs binary real/fake confidence; attribution head predicts probability distribution over known generative model families.',
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
  const [activeFormulaTab, setActiveFormulaTab] = useState<'srm' | 'fft' | 'dct' | 'temporal'>('fft');

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
    <div className="site-container space-y-12 py-8">
      
      {/* Title & Research Thesis Context */}
      <div className="text-center space-y-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E6] border border-[#D9DED4] text-[#0D4F43] text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#0D4F43] animate-pulse"></span>
          <span>Dual Spatial-Frequency Research Framework</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#083C33] tracking-tight">
          Research Methodology & Architecture
        </h1>
        
        <p className="text-[#3D5A52] text-sm sm:text-base leading-relaxed">
          DeepTrace AI isolates deepfake signatures by decoupling low-frequency semantic imagery from high-frequency sensor noise residuals. 
          Below is the authentic mathematical formulation, PyTorch neural network specifications, and signal processing architecture.
        </p>
      </div>

      {/* Live System Status Bar */}
      <div className="rounded-2xl bg-[#083C33] border border-[#166355] p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#0D4F43] flex items-center justify-center text-[#76A08A] shrink-0 border border-[#166355]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-[#F7F6F0]">
                {modelRegistry?.image_model?.model_name || 'DeepTrace-SpatialFreq-ViT'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#125B4D] text-[#D9DED4] border border-[#166355]">
                {modelRegistry?.image_model?.model_version || 'v1.0.0-unweighted'}
              </span>
            </div>
            <p className="text-[11px] text-[#D9DED4]/80 mt-0.5 font-mono">
              Inference Hardware: {modelRegistry?.image_model?.inference_device?.toUpperCase() || 'CPU'} • Input: 512×512 • Multimodal 5-Ch Frequency Tensor
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-full bg-[#052923] border border-[#166355] text-[#D9DED4] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#76A08A] animate-ping"></span>
            <span>PyTorch Engine Connected</span>
          </span>
        </div>
      </div>

      {/* SECTION 1: Interactive PyTorch Pipeline Architecture */}
      <section className="space-y-6">
        <div className="border-b border-[#D9DED4] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#083C33] flex items-center space-x-2">
              <GitBranch className="w-6 h-6 text-[#0D4F43]" />
              <span>Interactive Neural Pipeline Flowchart</span>
            </h2>
            <p className="text-xs text-[#3D5A52] mt-1">
              Select any stage below to inspect its exact tensor dimensions, PyTorch class implementation, and mathematical formulation.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#0D4F43] bg-[#EBF0E6] px-2.5 py-1 rounded-md border border-[#D9DED4]">
            Active Stage: {selectedStage.id.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Interactive Stage Stepper */}
          <div className="lg:col-span-5 space-y-2.5">
            {PIPELINE_STAGES.map((stage) => {
              const isSelected = selectedStage.id === stage.id;
              return (
                <div
                  key={stage.id}
                  onClick={() => setSelectedStage(stage)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-[#0D4F43] border-[#0D4F43] text-white shadow-md scale-[1.01]'
                      : 'bg-white border-[#D9DED4] text-[#083C33] hover:border-[#0D4F43]/40 hover:bg-[#FAFCF8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                      isSelected ? 'text-[#D9DED4]' : 'text-[#0D4F43]'
                    }`}>
                      {stage.domain}
                    </span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-[#D9DED4]/80' : 'text-[#3D5A52]'}`}>
                      {stage.tensorOutput.split(' ')[0]}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold mt-1 leading-snug">
                    {stage.name}
                  </h3>
                  <p className={`text-xs mt-1.5 line-clamp-2 ${isSelected ? 'text-[#D9DED4]/90' : 'text-[#3D5A52]'}`}>
                    {stage.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Stage Technical Blueprint */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#D9DED4] shadow-sm space-y-6">
            
            {/* Header */}
            <div className="border-b border-[#D9DED4] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-[#0D4F43] font-bold uppercase tracking-wider">
                  PyTorch Architecture Node
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#083C33]">
                  {selectedStage.name}
                </h3>
              </div>
              <div className="px-3 py-1 rounded-lg bg-[#EBF0E6] border border-[#D9DED4] text-[11px] font-mono text-[#083C33] self-start sm:self-auto">
                Domain: {selectedStage.domain}
              </div>
            </div>

            {/* Tensor Shapes Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#F7F6F0] border border-[#D9DED4]">
                <span className="text-[10px] text-[#3D5A52] uppercase block">Input Tensor Shape</span>
                <span className="font-bold text-[#083C33] mt-0.5 block">{selectedStage.tensorInput}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F7F6F0] border border-[#D9DED4]">
                <span className="text-[10px] text-[#3D5A52] uppercase block">Output Tensor Shape</span>
                <span className="font-bold text-[#0D4F43] mt-0.5 block">{selectedStage.tensorOutput}</span>
              </div>
            </div>

            {/* Mathematical Equation */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#083C33] flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-[#0D4F43]" />
                <span>Analytical Formulation</span>
              </span>
              <div className="p-4 rounded-xl bg-[#083C33] text-[#F7F6F0] font-mono text-xs overflow-x-auto border border-[#166355]">
                {selectedStage.mathFormula}
              </div>
            </div>

            {/* Deep Technical Explanation */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#083C33]">Architectural Function & Rationale</span>
              <p className="text-xs text-[#2D3F3A] leading-relaxed">
                {selectedStage.description}
              </p>
            </div>

            {/* Real PyTorch Code Implementation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#083C33]">
                <span className="flex items-center space-x-1.5">
                  <Code2 className="w-4 h-4 text-[#0D4F43]" />
                  <span>PyTorch / OpenCV Implementation</span>
                </span>
                <span className="font-mono text-[10px] text-[#3D5A52]">{selectedStage.pytorchClass}</span>
              </div>
              <pre className="p-4 rounded-2xl bg-[#052923] text-[#D9DED4] font-mono text-[11px] overflow-x-auto border border-[#166355] leading-relaxed">
                <code>{selectedStage.codeSnippet}</code>
              </pre>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 2: Mathematical Theory & Signal Processing Foundations */}
      <section className="space-y-6">
        <div className="border-b border-[#D9DED4] pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#083C33] flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-[#0D4F43]" />
            <span>Mathematical Foundations & Signal Processing Theory</span>
          </h2>
          <p className="text-xs text-[#3D5A52] mt-1">
            Why residual frequency decomposition circumvents spatial semantic camouflage used by modern GANs and Diffusion models.
          </p>
        </div>

        {/* Tab Selector */}
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
                    : 'bg-white border-[#D9DED4] text-[#083C33] hover:bg-[#EBF0E6]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9DED4] shadow-sm space-y-6">
          
          {activeFormulaTab === 'fft' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#083C33]">2D Discrete Fourier Transform & Spectral Artifacts</h3>
                <p className="text-xs sm:text-sm text-[#2D3F3A] leading-relaxed">
                  Generative models that utilize deconvolutional layers (transposed convolutions) or latent diffusion decoders 
                  exhibit spatial periodicities. By projecting spatial signals into the orthogonal frequency domain, these periodic grid patterns 
                  manifest as distinct, quantifiable high-frequency spikes (Dirac-comb artifacts).
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

              <div className="p-4 rounded-2xl bg-[#EBF0E6] border border-[#D9DED4] text-xs text-[#083C33] space-y-2">
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
                <h3 className="text-lg font-bold text-[#083C33]">2D Discrete Cosine Transform (DCT Type-II)</h3>
                <p className="text-xs sm:text-sm text-[#2D3F3A] leading-relaxed">
                  Unlike Fourier transform which relies on complex exponentials, DCT expresses images purely in real orthogonal cosine basis functions. 
                  This isolates block-based spatial compression boundaries (e.g. 8x8 block artifacts from JPEG and autoencoders).
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
                <div className="p-4 rounded-2xl bg-[#F7F6F0] border border-[#D9DED4] space-y-1.5">
                  <span className="font-bold text-[#083C33]">Low-Frequency Energy Zone (dist &lt; 0.3)</span>
                  <p className="text-[#3D5A52] leading-relaxed">
                    Concentrated around top-left coefficient (0,0) (DC origin). Captures structural brightness and general luminance contours.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F7F6F0] border border-[#D9DED4] space-y-1.5">
                  <span className="font-bold text-[#083C33]">High-Frequency Energy Ratio (dist &ge; 0.7)</span>
                  <p className="text-[#3D5A52] leading-relaxed">
                    {"Evaluated as Ratio_HF = \u2211_{d \u2265 0.7} C(u, v)\u00B2 / \u2211_{u, v} C(u, v)\u00B2. Unnatural high-frequency energy accumulation exposes generative upsampling grids."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeFormulaTab === 'srm' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#083C33]">Spatial Rich Models (SRM) & High-Pass Noise Residuals</h3>
                <p className="text-xs sm:text-sm text-[#2D3F3A] leading-relaxed">
                  Physical digital cameras impart Photo-Response Non-Uniformity (PRNU) noise from silicon sensor fabrication. 
                  Generative models lack physical sensors, producing synthetic noise distributions that linear high-pass steganographic filters isolate.
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
                <h3 className="text-lg font-bold text-[#083C33]">Video Temporal Consistency & Inter-Frame Spectral Jitter</h3>
                <p className="text-xs sm:text-sm text-[#2D3F3A] leading-relaxed">
                  Video deepfakes synthesized frame-by-frame often exhibit sub-pixel flickering between frames. 
                  DeepTrace computes temporal frequency variance across consecutive uniform video samples.
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

              <div className="p-4 rounded-2xl bg-[#EBF0E6] border border-[#D9DED4] text-xs text-[#083C33] space-y-1.5">
                <span className="font-bold">Evaluation Rule:</span>
                <p className="text-[#2D3F3A] leading-relaxed">
                  If Jitter &lt; 0.03, the sequence exhibits physical sensor stability typical of genuine camera recordings. 
                  If Jitter &gt; 0.03, temporal frequency variance indicates non-temporally regularized synthetic generation.
                </p>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* SECTION 3: Supported Generative Architecture Classes */}
      <section className="space-y-6">
        <div className="border-b border-[#D9DED4] pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#083C33] flex items-center space-x-2">
            <Database className="w-6 h-6 text-[#0D4F43]" />
            <span>Target Generative Source Families</span>
          </h2>
          <p className="text-xs text-[#3D5A52] mt-1">
            Registered attribution classes benchmarked within the dual-branch spatial-frequency classifier.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(modelRegistry?.attribution_classes || [
            'Real / Authentic',
            'StyleGAN2',
            'StyleGAN3',
            'ProGAN',
            'Stable Diffusion v1.5',
            'Stable Diffusion XL',
            'Latent Diffusion',
            'Midjourney v5'
          ]).map((clsName, idx) => (
            <div 
              key={clsName}
              className="p-4 rounded-2xl bg-white border border-[#D9DED4] shadow-xs flex flex-col justify-between space-y-2 hover:border-[#0D4F43] transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-mono text-[#3D5A52]">
                <span>CLASS {String(idx).padStart(2, '0')}</span>
                <span className={`w-2 h-2 rounded-full ${clsName.toLowerCase().includes('real') ? 'bg-[#0D4F43]' : 'bg-[#125B4D]'}`} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#083C33]">{clsName}</h4>
                <span className="text-[10px] text-[#3D5A52] font-mono block mt-0.5">
                  {clsName.toLowerCase().includes('diffusion') || clsName.toLowerCase().includes('midjourney')
                    ? 'Denoising Score Matching'
                    : clsName.toLowerCase().includes('real')
                    ? 'Physical Camera Sensor'
                    : 'Adversarial Upsampling'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
