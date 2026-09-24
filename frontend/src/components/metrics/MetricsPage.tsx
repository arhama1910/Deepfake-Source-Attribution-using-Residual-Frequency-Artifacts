import React, { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import type { EvaluationMetricsData } from '../../types/forensics';

export const MetricsPage: React.FC = () => {
  const [metricsData, setMetricsData] = useState<EvaluationMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getResearchMetrics();
      setMetricsData(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    apiService.getResearchMetrics().then((data) => {
      if (!ignore) {
        setMetricsData(data);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!ignore) setIsLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  const isEvaluated = metricsData?.status === 'evaluated';

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#083C33]">
            Research Evaluation & Benchmarks
          </h1>
          <p className="text-xs sm:text-sm text-[#3D5A52] mt-1">
            Empirical evaluation statistics across FaceForensics++, GenImage, and DiffusionForensics datasets.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#D9DED4] hover:bg-[#CAD2C4] text-[#083C33] text-xs font-semibold self-start sm:self-auto disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Benchmark Status Card */}
      {!isEvaluated ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#D9DED4] shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF0E6] border border-[#D9DED4] text-[#0D4F43] flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-[#083C33]">Evaluation Results Pending Model Training</h3>
            <p className="text-xs text-[#3D5A52] max-w-lg mx-auto leading-relaxed">
              Evaluation metrics will appear here after full model training and validation evaluation runs. 
              In compliance with scientific research integrity, synthetic benchmarks are never fabricated.
            </p>
          </div>
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#EBF0E6] border border-[#D9DED4] text-[11px] font-mono font-semibold text-[#0D4F43]">
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
            <div key={idx} className="bg-white rounded-2xl p-5 border border-[#D9DED4] shadow-sm space-y-1">
              <span className="text-[11px] font-mono text-[#3D5A52] block">{m.label}</span>
              <p className="text-xl font-bold text-[#0D4F43] font-mono">{m.value}</p>
              <p className="text-[10px] text-[#3D5A52]">{m.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Confusion Matrix Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9DED4] shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#D9DED4]">
          <div>
            <h3 className="text-base font-bold text-[#083C33] flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-[#0D4F43]" />
              <span>Multi-Class Attribution Confusion Matrix</span>
            </h3>
            <p className="text-xs text-[#3D5A52] mt-0.5">
              Class-wise distribution across real media, GAN models, and diffusion architectures.
            </p>
          </div>
        </div>

        {isEvaluated && metricsData?.confusion_matrix ? (
          <div className="overflow-x-auto">
            <div className="min-w-[600px] border border-[#D9DED4] rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-xs text-center border-collapse font-mono">
                <thead>
                  <tr className="bg-[#F7F6F0] text-[#3D5A52] border-b border-[#D9DED4]">
                    <th className="p-3 text-left">Ground Truth \ Pred</th>
                    {metricsData.attribution_classes.map((cls, i) => (
                      <th key={i} className="p-3 text-[10px]">{cls}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricsData.confusion_matrix.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-[#D9DED4] hover:bg-[#EBF0E6]/40">
                      <td className="p-3 text-left font-bold text-[#083C33]">
                        {metricsData.attribution_classes[rIdx]}
                      </td>
                      {row.map((val, cIdx) => (
                        <td
                          key={cIdx}
                          className={`p-3 ${
                            rIdx === cIdx ? 'bg-[#EBF0E6] text-[#0D4F43] font-bold' : 'text-[#3D5A52]'
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
          <div className="p-12 rounded-2xl bg-[#F7F6F0] border border-[#D9DED4] text-center text-xs text-[#3D5A52] font-mono">
            Matrix representation will render automatically upon checkpoint evaluation.
          </div>
        )}
      </div>

    </div>
  );
};
