import React, { useEffect, useState } from 'react';
import { Cpu, Layers, HardDrive, CheckCircle2, AlertTriangle, ShieldCheck, Film } from 'lucide-react';
import { apiService } from '../../services/api';
import { ModelMetadata } from '../../types/forensics';

export const ModelsPage: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<{
    image_model: ModelMetadata;
    video_model: ModelMetadata;
    attribution_classes: string[];
    pipeline_domains: string[];
  } | null>(null);

  useEffect(() => {
    apiService.getModelRegistry().then(setModelInfo).catch(console.error);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Model Registry & Architectural Specifications
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Dual spatial-frequency feature extractors, cross-attention fusion network, and attribution heads.
        </p>
      </div>

      {modelInfo && (
        <div className="space-y-6">
          
          {/* Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Image Model Card */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{modelInfo.image_model.model_name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Image Forensic Classifier</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-semibold border ${
                  modelInfo.image_model.model_status === 'loaded'
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                }`}>
                  {modelInfo.image_model.model_status === 'loaded' ? 'Weights Loaded' : 'Unweighted (Demo Mode)'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">Architecture Backbone:</span>
                  <span className="text-white font-medium">{modelInfo.image_model.architecture}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">Training Datasets:</span>
                  <span className="text-white">{modelInfo.image_model.training_dataset}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Version:</span>
                    <span className="text-cyan-400">{modelInfo.image_model.model_version}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Inference Device:</span>
                    <span className="text-white">{modelInfo.image_model.inference_device || 'CPU'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Model Card */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{modelInfo.video_model.model_name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Temporal Video Classifier</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-semibold border ${
                  modelInfo.video_model.model_status === 'loaded'
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                }`}>
                  {modelInfo.video_model.model_status === 'loaded' ? 'Weights Loaded' : 'Unweighted (Demo Mode)'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">Architecture Backbone:</span>
                  <span className="text-white font-medium">{modelInfo.video_model.architecture}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">Training Datasets:</span>
                  <span className="text-white">{modelInfo.video_model.training_dataset}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Version:</span>
                    <span className="text-indigo-400">{modelInfo.video_model.model_version}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Inference Device:</span>
                    <span className="text-white">{modelInfo.video_model.inference_device || 'CPU'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Supported Generator Classes */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Target Source Attribution Generator Classes</span>
            </h3>
            <p className="text-xs text-slate-400">
              Classes trained to capture specific spectral and residual fingerprint distributions:
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {modelInfo.attribution_classes.map((cls, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-200 flex items-center space-x-2"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>{cls}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
