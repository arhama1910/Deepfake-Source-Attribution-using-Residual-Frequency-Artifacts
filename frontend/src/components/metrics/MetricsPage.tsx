import React, { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, CheckCircle2, Database, Upload, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import { EvaluationMetricsData } from '../../types/forensics';

export const MetricsPage: React.FC = () => {
  const [metricsData, setMetricsData] = useState<EvaluationMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getResearchMetrics();
      setMetricsData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const isEvaluated = metricsData?.status === 'evaluated';

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Research Evaluation & Benchmarks
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Empirical evaluation statistics across FaceForensics++, GenImage, and DiffusionForensics datasets.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Benchmark Status Card */}
      {!isEvaluated ? (
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Evaluation Results Pending Model Training</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Evaluation metrics will appear here after full model training and validation evaluation runs. 
              In compliance with scientific research integrity, synthetic benchmarks are never fabricated.
            </p>
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400">
            Target Benchmark: FaceForensics++ (c23) & GenImage Test Split
          </div>
        </div>
      ) : (
        /* Evaluated Numerical Cards */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Accuracy', value: `${(metricsData.metrics.accuracy! * 100).toFixed(1)}%`, desc: 'Overall detection rate' },
            { label: 'Precision', value: `${(metricsData.metrics.precision! * 100).toFixed(1)}%`, desc: 'Synthetic positive predictive value' },
            { label: 'Recall', value: `${(metricsData.metrics.recall! * 100).toFixed(1)}%`, desc: 'True synthetic sensitivity' },
            { label: 'F1-Score', value: `${(metricsData.metrics.f1_score! * 100).toFixed(1)}%`, desc: 'Harmonic mean of P & R' },
            { label: 'ROC-AUC', value: `${metricsData.metrics.roc_auc!.toFixed(3)}`, desc: 'Area under ROC curve' },
          ].map((m, idx) => (
            <div key={idx} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 block">{m.label}</span>
              <p className="text-xl font-bold text-cyan-400 font-mono">{m.value}</p>
              <p className="text-[10px] text-slate-500">{m.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Confusion Matrix Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Multi-Class Attribution Confusion Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Class-wise distribution across real media, GAN models, and diffusion architectures.
            </p>
          </div>
        </div>

        {isEvaluated && metricsData?.confusion_matrix ? (
          <div className="overflow-x-auto">
            <div className="min-w-[600px] border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
              <table className="w-full text-xs text-center border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <th className="p-3 text-left">Ground Truth \ Pred</th>
                    {metricsData.attribution_classes.map((cls, i) => (
                      <th key={i} className="p-3 text-[10px]">{cls}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricsData.confusion_matrix.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-900 hover:bg-slate-900/30">
                      <td className="p-3 text-left font-bold text-slate-300">
                        {metricsData.attribution_classes[rIdx]}
                      </td>
                      {row.map((val, cIdx) => (
                        <td
                          key={cIdx}
                          className={`p-3 ${
                            rIdx === cIdx ? 'bg-cyan-950/40 text-cyan-300 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500 font-mono">
            Matrix representation will render automatically upon checkpoint evaluation.
          </div>
        )}
      </div>

    </div>
  );
};
