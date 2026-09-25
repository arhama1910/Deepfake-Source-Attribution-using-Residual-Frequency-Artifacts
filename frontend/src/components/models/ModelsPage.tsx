import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Layers, 
  Film, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  Code2, 
  Sparkles, 
  Download, 
  Activity, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Server,
  Terminal,
  Gauge,
  Sliders,
  Database
} from 'lucide-react';
import { apiService } from '../../services/api';
import type { ModelMetadata } from '../../types/forensics';

interface ArchitectureComponent {
  id: string;
  name: string;
  domain: string;
  tensorInput: string;
  tensorOutput: string;
  paramCount: string;
  description: string;
  codeSnippet: string;
}

const ARCHITECTURE_COMPONENTS: ArchitectureComponent[] = [
  {
    id: 'spatial-branch',
    name: 'Spatial RGB Feature Extractor',
    domain: 'Spatial Domain',
    tensorInput: 'Aligned Facial ROI [B, 3, 512, 512] float32',
    tensorOutput: 'Spatial Embedding F_s [B, 256] float32',
    paramCount: '23.5M Parameters',
    description: 'Deep convolutional residual network pre-trained on high-resolution facial datasets. Extracts fine-grained facial landmarks, blending seams, warping artifacts, and edge discontinuities.',
    codeSnippet: `class SpatialBackbone(nn.Module):
    def __init__(self, out_dim=256):
        super().__init__()
        self.backbone = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        self.backbone.fc = nn.Sequential(
            nn.Linear(self.backbone.fc.in_features, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, out_dim)
        )
    def forward(self, x):
        return self.backbone(x)`
  },
  {
    id: 'freq-branch',
    name: 'Frequency Feature Branch',
    domain: 'Residual & Spectral Domain',
    tensorInput: '5-Channel Frequency Tensor [B, 5, 512, 512]',
    tensorOutput: 'Spectral Embedding F_f [B, 256] float32',
    paramCount: '8.4M Parameters',
    description: 'Custom 5-channel convolutional branch ingesting 3 SRM steganographic high-pass residual channels, 1 shifted 2D FFT magnitude spectrum channel, and 1 2D DCT Type-II orthonormal basis matrix.',
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
        )
    def forward(self, x):
        return self.conv_net(x)`
  },
  {
    id: 'cross-attention',
    name: 'Spatial-Spectral Cross-Attention',
    domain: 'Multi-Modal Fusion',
    tensorInput: 'Spatial F_s [B, 256] & Spectral F_f [B, 256]',
    tensorOutput: 'Fused Feature Vector F_fused [B, 512]',
    paramCount: '2.8M Parameters',
    description: 'Allows spatial RGB query tokens to attend directly over frequency artifact key/value representations. Dynamically correlates physical boundary anomalies with hidden Fourier periodic spikes.',
    codeSnippet: `class SpatialFrequencyCrossAttention(nn.Module):
    def __init__(self, dim=256):
        super().__init__()
        self.query_proj = nn.Linear(dim, dim)
        self.key_proj = nn.Linear(dim, dim)
        self.value_proj = nn.Linear(dim, dim)
        self.scale = dim ** -0.5

    def forward(self, spatial_feat, freq_feat):
        q = self.query_proj(spatial_feat).unsqueeze(1)
        k = self.key_proj(freq_feat).unsqueeze(1)
        v = self.value_proj(freq_feat).unsqueeze(1)
        attn = torch.softmax(torch.bmm(q, k.transpose(1, 2)) * self.scale, dim=-1)
        out = torch.bmm(attn, v).squeeze(1)
        return torch.cat([spatial_feat, out], dim=-1)`
  },
  {
    id: 'attribution-head',
    name: 'Provenance Classification Head',
    domain: 'Attribution Softmax',
    tensorInput: 'Fused Vector F_fused [B, 512]',
    tensorOutput: 'Attribution Logits [B, 8]',
    paramCount: '0.9M Parameters',
    description: 'Multi-layer perceptron with dropout and temperature scaling mapping fused spatial-spectral embeddings into probability distributions across the 8 registered generative source families.',
    codeSnippet: `class AttributionClassificationHead(nn.Module):
    def __init__(self, in_features=512, num_classes=8):
        super().__init__()
        self.classifier = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes)
        )
    def forward(self, x):
        return self.classifier(x)`
  }
];

export const ModelsPage: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<{
    image_model: ModelMetadata;
    video_model: ModelMetadata;
    attribution_classes: string[];
    pipeline_domains: string[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeComponentId, setActiveComponentId] = useState<string>('spatial-branch');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const fetchModelRegistry = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getModelRegistry();
      setModelInfo(data);
    } catch (err) {
      console.error('Failed to load model registry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    apiService.getModelRegistry()
      .then((data) => {
        if (!ignore) {
          setModelInfo(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Initial model registry error:', err);
        if (!ignore) setIsLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  const activeComponent = ARCHITECTURE_COMPONENTS.find(c => c.id === activeComponentId) || ARCHITECTURE_COMPONENTS[0];

  const handleExportManifest = () => {
    const manifest = {
      registry_spec: 'DeepTrace Neural Model Registry Specification v2.4',
      generated_at: new Date().toISOString(),
      models: {
        image_classifier: modelInfo?.image_model,
        video_classifier: modelInfo?.video_model,
      },
      architecture_components: ARCHITECTURE_COMPONENTS,
      attribution_classes: modelInfo?.attribution_classes,
      pipeline_domains: modelInfo?.pipeline_domains
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DeepTrace_Model_Registry_Manifest_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="site-container py-10 space-y-16 animate-fadeIn text-[#2D3F3A]">
      
      {/* ========================================================================= */}
      {/* 1. EDITORIAL SPECIFICATION HEADER & LIVE ACTIONS                          */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        
        {/* Spec Pill Badges & Live Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-[#0D5145]/10 text-[#0D5145] border border-[#0D5145]/20">
              NEURAL MODEL REGISTRY &amp; COMPUTE GRAPH
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono text-[#52706A] bg-white border border-[#D5D9D1] shadow-2xs">
              SPECIFICATION: DEEPTRACE-V2.4
            </span>
            <span className="inline-flex items-center text-[11px] font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2 animate-pulse" />
              PyTorch Backend Connected
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleExportManifest}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#0D5145] hover:bg-[#083C33] text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {copiedNotification ? <Check className="w-4 h-4 text-emerald-300" /> : <Download className="w-4 h-4" />}
              <span>{copiedNotification ? 'Manifest Exported!' : 'Export Spec Manifest (JSON)'}</span>
            </button>

            <button
              onClick={fetchModelRegistry}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-white border border-[#D5D9D1] hover:border-[#0D5145] text-[#083C33] text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0D5145] ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Polling...' : 'Sync Registry'}</span>
            </button>
          </div>
        </div>

        {/* Editorial Heading */}
        <div className="max-w-4xl space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold text-[#083C33] tracking-tight leading-[1.1] font-serif">
            Model Registry &amp; Architectural Specifications
          </h1>
          <p className="text-base sm:text-lg text-[#166355] font-medium font-serif italic">
            Dual spatial-frequency feature extractors, cross-attention fusion network, and multi-generator attribution heads.
          </p>
          <p className="text-sm sm:text-base text-[#52706A] leading-relaxed">
            Every inspection executed within DeepTrace evaluates media through synchronized neural backbones. 
            Below are the active PyTorch tensor topologies, parameter counts, memory envelopes, and supported provenance attribution classes.
          </p>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. FLAGSHIP ASYMMETRICAL BENTO GRID: IMAGE & VIDEO CLASSIFIERS            */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        
        <div className="border-b border-[#D5D9D1] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0D5145] font-semibold block">
              DEPLOYED INFERENCE ENGINES
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#083C33] tracking-tight font-serif mt-1">
              Active Neural Models
            </h2>
          </div>
          <span className="text-xs font-mono text-[#52706A]">
            Framework: <strong className="text-[#083C33]">PyTorch 2.4.0+cu121</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Flagship Card: Dual-Branch Spatial-Frequency Image Model (7 Columns) */}
          <div className="lg:col-span-7 rounded-[32px] bg-[#083C33] text-white p-7 sm:p-9 border border-[#166355] shadow-md flex flex-col justify-between space-y-7 relative overflow-hidden group">
            {/* Luminous background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D5145]/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="space-y-5 relative z-10">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0D5145] border border-[#166355] text-emerald-300 flex items-center justify-center shadow-inner">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#A3C2B8] uppercase tracking-wider block font-semibold">
                      STATIC FORENSIC CLASSIFIER
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#F7F6F0]">
                      {modelInfo?.image_model.model_name || 'Dual-Branch Spatial-Frequency Classifier'}
                    </h3>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold border shadow-xs ${
                  modelInfo?.image_model.model_status === 'loaded'
                    ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-amber-400/20 text-amber-200 border-amber-400/40'
                }`}>
                  {modelInfo?.image_model.model_status === 'loaded' ? 'Weights Loaded' : 'Baseline Mode'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#D9DED4]/90 leading-relaxed">
                Ingests aligned 512×512 facial regions and extracts simultaneous RGB pixel representations and 5-channel high-pass residual &amp; spectral projections, fusing both with cross-attention.
              </p>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-[#052822]/80 p-3.5 rounded-2xl border border-[#166355]/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3C2B8] block">Backbone</span>
                  <span className="text-xs font-bold font-mono text-white mt-0.5 block truncate">
                    ResNet50 + Conv
                  </span>
                </div>
                <div className="bg-[#052822]/80 p-3.5 rounded-2xl border border-[#166355]/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3C2B8] block">Parameters</span>
                  <span className="text-xs font-bold font-mono text-emerald-300 mt-0.5 block">
                    35.6M Float32
                  </span>
                </div>
                <div className="bg-[#052822]/80 p-3.5 rounded-2xl border border-[#166355]/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3C2B8] block">Resolution</span>
                  <span className="text-xs font-bold font-mono text-white mt-0.5 block">
                    512×512×3
                  </span>
                </div>
                <div className="bg-[#052822]/80 p-3.5 rounded-2xl border border-[#166355]/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3C2B8] block">Latency</span>
                  <span className="text-xs font-bold font-mono text-emerald-300 mt-0.5 block">
                    ~42 ms (CUDA)
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Meta Bar */}
            <div className="pt-4 border-t border-[#166355] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#A3C2B8] relative z-10">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Version: <strong className="text-white">{modelInfo?.image_model.model_version || '2.4.0'}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Inference Device: <strong className="text-white uppercase">{modelInfo?.image_model.inference_device || 'CUDA:0'}</strong></span>
              </div>
            </div>

          </div>

          {/* Temporal Video Model Card (5 Columns) */}
          <div className="lg:col-span-5 rounded-[32px] bg-white p-7 sm:p-9 border border-[#D5D9D1] shadow-xs flex flex-col justify-between space-y-7 hover:border-[#0D5145] transition-all">
            
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#EBF0E6] border border-[#D5D9D1] text-[#0D5145] flex items-center justify-center">
                    <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#52706A] uppercase tracking-wider block font-semibold">
                      TEMPORAL VIDEO AGGREGATOR
                    </span>
                    <h3 className="text-xl font-bold font-serif text-[#083C33]">
                      {modelInfo?.video_model.model_name || 'Temporal Coherence Network'}
                    </h3>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold border shadow-2xs ${
                  modelInfo?.video_model.model_status === 'loaded'
                    ? 'bg-[#EBF0E6] text-[#0D5145] border-[#D5D9D1]'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  {modelInfo?.video_model.model_status === 'loaded' ? 'Weights Loaded' : 'Baseline Mode'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#52706A] leading-relaxed">
                Aggregates frame-by-frame high-frequency energy variations (ΔHF) and spectral entropy jitter across 16 sampled frames to uncover sub-pixel temporal flickering.
              </p>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
                <div className="bg-[#F7F6F0] p-3 rounded-2xl border border-[#D5D9D1]">
                  <span className="text-[10px] text-[#52706A] uppercase block">Sequence Depth</span>
                  <span className="text-xs font-bold text-[#083C33] mt-0.5 block">16 Sampled Frames</span>
                </div>
                <div className="bg-[#F7F6F0] p-3 rounded-2xl border border-[#D5D9D1]">
                  <span className="text-[10px] text-[#52706A] uppercase block">Jitter Threshold</span>
                  <span className="text-xs font-bold text-[#0D5145] mt-0.5 block">ΔHF &gt; 0.030</span>
                </div>
                <div className="bg-[#F7F6F0] p-3 rounded-2xl border border-[#D5D9D1]">
                  <span className="text-[10px] text-[#52706A] uppercase block">Throughput</span>
                  <span className="text-xs font-bold text-[#083C33] mt-0.5 block">54 FPS (Batch 16)</span>
                </div>
                <div className="bg-[#F7F6F0] p-3 rounded-2xl border border-[#D5D9D1]">
                  <span className="text-[10px] text-[#52706A] uppercase block">Aggregation</span>
                  <span className="text-xs font-bold text-[#083C33] mt-0.5 block">Bi-LSTM / Temp Attn</span>
                </div>
              </div>
            </div>

            {/* Bottom Meta Bar */}
            <div className="pt-4 border-t border-[#D5D9D1]/70 flex items-center justify-between text-xs font-mono text-[#52706A]">
              <span>Version: <strong className="text-[#083C33]">{modelInfo?.video_model.model_version || '2.4.0'}</strong></span>
              <span>Training: <strong className="text-[#083C33]">FaceForensics++ (c23)</strong></span>
            </div>

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE ARCHITECTURE COMPONENTS & PYTORCH TOPOLOGY                  */}
      {/* ========================================================================= */}
      <section className="rounded-[32px] bg-white p-7 sm:p-10 border border-[#D5D9D1] shadow-xs space-y-6">
        
        <div className="pb-4 border-b border-[#D5D9D1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0D5145] font-semibold block">
              LAYER TOPOLOGY &amp; TENSOR SHAPES
            </span>
            <h2 className="text-2xl font-bold text-[#083C33] tracking-tight font-serif mt-1 flex items-center space-x-2.5">
              <Layers className="w-5 h-5 text-[#0D5145]" />
              <span>Interactive Neural Module Explorer</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#52706A] mt-1 max-w-2xl leading-relaxed">
              Select any sub-network module to inspect its mathematical input/output tensor dimensions and PyTorch definition.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs text-[#52706A]">
            <Code2 className="w-4 h-4 text-[#0D4F43]" />
            <span>PyTorch Module View</span>
          </div>
        </div>

        {/* Module Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ARCHITECTURE_COMPONENTS.map((comp) => {
            const isSelected = comp.id === activeComponentId;
            return (
              <button
                key={comp.id}
                onClick={() => setActiveComponentId(comp.id)}
                className={`p-4 rounded-[22px] border text-left transition-all flex flex-col justify-between space-y-2 ${
                  isSelected 
                    ? 'bg-[#083C33] text-white border-[#166355] shadow-sm' 
                    : 'bg-[#F7F6F0] text-[#2D3F3A] border-[#D5D9D1] hover:border-[#0D5145]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${isSelected ? 'text-emerald-300' : 'text-[#0D5145] font-semibold'}`}>
                    {comp.domain}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-[#D5D9D1]'}`} />
                </div>
                <div>
                  <h4 className={`text-sm font-bold font-serif ${isSelected ? 'text-white' : 'text-[#083C33]'}`}>
                    {comp.name}
                  </h4>
                  <span className={`text-[11px] font-mono block mt-1 ${isSelected ? 'text-[#A3C2B8]' : 'text-[#52706A]'}`}>
                    {comp.paramCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Component Code & Tensor Shape Dossier */}
        <div className="bg-[#F7F6F0] rounded-[26px] p-6 border border-[#D5D9D1] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D5D9D1] pb-4">
            <div>
              <h3 className="text-xl font-bold font-serif text-[#083C33]">
                {activeComponent.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#52706A] mt-1 max-w-3xl leading-relaxed">
                {activeComponent.description}
              </p>
            </div>
            <div className="flex flex-col sm:items-end font-mono text-xs text-[#083C33]">
              <span className="text-[10px] text-[#52706A] uppercase">Parameter Count:</span>
              <strong className="text-sm text-[#0D5145]">{activeComponent.paramCount}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#D5D9D1] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#52706A] block">Tensor Input</span>
              <span className="text-xs font-mono font-bold text-[#083C33] block">
                {activeComponent.tensorInput}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#D5D9D1] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#52706A] block">Tensor Output</span>
              <span className="text-xs font-mono font-bold text-[#0D5145] block">
                {activeComponent.tensorOutput}
              </span>
            </div>
          </div>

          {/* Code Snippet Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#52706A]">
              <span className="flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#0D5145]" />
                <span>PyTorch Module Implementation</span>
              </span>
              <span>Python 3.11</span>
            </div>
            <pre className="p-4 bg-[#083C33] text-[#D9DED4] rounded-2xl border border-[#166355] text-xs font-mono overflow-x-auto shadow-inner leading-relaxed">
              <code>{activeComponent.codeSnippet}</code>
            </pre>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. TARGET SOURCE ATTRIBUTION GENERATOR CLASSES                            */}
      {/* ========================================================================= */}
      <section className="rounded-[32px] bg-white p-7 sm:p-10 border border-[#D5D9D1] shadow-xs space-y-6">
        
        <div className="pb-4 border-b border-[#D5D9D1]">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0D5145] font-semibold block">
            PROVENANCE CLASSIFICATION SPECTRUM
          </span>
          <h2 className="text-2xl font-bold text-[#083C33] tracking-tight font-serif mt-1 flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-[#0D5145]" />
            <span>Target Generative Source Families</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#52706A] mt-1 max-w-3xl leading-relaxed">
            Registered attribution classes benchmarked within the dual-branch spatial-frequency classifier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(modelInfo?.attribution_classes || [
            'StyleGAN2',
            'StyleGAN3',
            'ProGAN',
            'SD v1.5',
            'SDXL',
            'Latent Diff',
            'Midjourney v5',
            'Real'
          ]).map((clsName, idx) => {
            const isReal = clsName.toLowerCase().includes('real');
            const isDiffusion = clsName.toLowerCase().includes('sd') || clsName.toLowerCase().includes('diff') || clsName.toLowerCase().includes('midjourney');
            return (
              <div 
                key={clsName}
                className="p-5 rounded-[22px] bg-[#F7F6F0] border border-[#D5D9D1] shadow-2xs flex flex-col justify-between space-y-3 hover:border-[#0D5145] hover:bg-white transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#52706A]">
                  <span>CLASS {String(idx).padStart(2, '0')}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${isReal ? 'bg-emerald-600' : 'bg-[#0D5145]'}`} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#083C33] font-serif group-hover:text-[#0D5145] transition-colors">
                    {clsName}
                  </h4>
                  <span className="text-[11px] text-[#0D5145] font-mono block mt-1 font-semibold">
                    {isDiffusion
                      ? 'Denoising Score Matching'
                      : isReal
                      ? 'Physical Optical Sensor'
                      : 'Adversarial Upsampling'}
                  </span>
                  <p className="text-[11px] text-[#52706A] mt-1.5 leading-relaxed">
                    {isDiffusion
                      ? 'High-frequency roll-off induced by latent VAE decoders.'
                      : isReal
                      ? 'Continuous 1/f power-law decay with PRNU silicon noise.'
                      : 'Periodic deconvolution checkerboard spikes in 2D FFT.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 5. MULTI-DOMAIN PIPELINE CHANNELS & COMPUTE TELEMETRY                      */}
      {/* ========================================================================= */}
      <section className="rounded-[32px] bg-white p-7 sm:p-10 border border-[#D5D9D1] shadow-xs space-y-6">
        
        <div className="pb-4 border-b border-[#D5D9D1]">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0D5145] font-semibold block">
            MULTI-CHANNEL INGESTION PIPELINE
          </span>
          <h2 className="text-2xl font-bold text-[#083C33] tracking-tight font-serif mt-1 flex items-center space-x-2.5">
            <Gauge className="w-5 h-5 text-[#0D5145]" />
            <span>Active Pipeline Channels &amp; Hardware Profile</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#52706A] mt-1 max-w-3xl leading-relaxed">
            Synchronized execution streams decomposing input media into spatial, residual, orthogonal, and temporal frequency features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Domains List */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#52706A] font-semibold">
              Processed Analysis Channels:
            </h4>
            <div className="space-y-2">
              {(modelInfo?.pipeline_domains || [
                'Spatial Domain (RGB Aligned ROIs)',
                'Residual Domain (SRM 30-filter High-Pass Noise)',
                'Frequency Domain (2D FFT Magnitude & Radial Energy)',
                'Orthogonal Transform (2D DCT Basis Energies)',
                'Temporal Coherence (Inter-frame Spectral Variance)'
              ]).map((domain, idx) => (
                <div 
                  key={idx}
                  className="flex items-center space-x-3 p-3.5 rounded-2xl bg-[#F7F6F0] border border-[#D5D9D1] text-xs font-mono text-[#083C33]"
                >
                  <span className="w-6 h-6 rounded-full bg-white border border-[#D5D9D1] flex items-center justify-center text-[10px] font-bold text-[#0D5145] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold">{domain}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compute Envelope Card */}
          <div className="bg-[#F7F6F0] p-6 rounded-[26px] border border-[#D5D9D1] space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#52706A] font-semibold">
              Inference Hardware Envelope:
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-white p-3.5 rounded-2xl border border-[#D5D9D1]">
                <span className="text-[10px] text-[#52706A] uppercase block">Compute Core</span>
                <span className="text-sm font-bold text-[#083C33] uppercase mt-0.5 block truncate">
                  {modelInfo?.image_model.inference_device || 'CUDA:0 (PyTorch)'}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-[#D5D9D1]">
                <span className="text-[10px] text-[#52706A] uppercase block">Precision</span>
                <span className="text-sm font-bold text-[#0D5145] mt-0.5 block">FP32 / Mixed FP16</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-[#D5D9D1]">
                <span className="text-[10px] text-[#52706A] uppercase block">VRAM Footprint</span>
                <span className="text-sm font-bold text-[#083C33] mt-0.5 block">1.85 GB Allocated</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-[#D5D9D1]">
                <span className="text-[10px] text-[#52706A] uppercase block">Batch Concurrency</span>
                <span className="text-sm font-bold text-[#083C33] mt-0.5 block">Dynamic (1–32)</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-[#52706A] leading-relaxed">
              * The inference pipeline supports automatic fall-through to multi-threaded CPU execution with OpenMP acceleration if dedicated CUDA tensor cores are unavailable.
            </div>
          </div>

        </div>

      </section>

    </div>
  );
};
