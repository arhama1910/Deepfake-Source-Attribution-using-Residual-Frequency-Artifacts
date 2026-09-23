import React, { useEffect, useState } from 'react';
import { History, Download, Trash2, ExternalLink, RefreshCw, FileImage, FileVideo, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api';
import { HistoryItem, AnalysisResult } from '../../types/forensics';

interface HistoryPageProps {
  onSelectCase: (result: AnalysisResult) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectCase }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<string>('');

  useEffect(() => {
    fetchHistory();
  }, [mediaFilter]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getHistory(25, 0, mediaFilter || undefined);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you wish to purge this forensic case record?')) return;
    try {
      await apiService.deleteAnalysis(id);
      setItems(items.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (e) {
      alert('Failed to delete case.');
    }
  };

  const handleOpen = async (id: string) => {
    try {
      const fullCase = await apiService.getAnalysis(id);
      onSelectCase(fullCase);
    } catch (e) {
      alert('Failed to load full analysis record.');
    }
  };

  const handleDownloadPdf = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = apiService.getReportDownloadUrl(id);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeepTrace_Report_${id.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Forensic Case Log & Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical audit logs of inspected media and attribution records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setMediaFilter('')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mediaFilter === '' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({total})
            </button>
            <button
              onClick={() => setMediaFilter('image')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mediaFilter === 'image' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setMediaFilter('video')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mediaFilter === 'video' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Videos
            </button>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs font-mono">
            {isLoading ? 'Loading forensic audit history...' : 'No historical forensic cases logged yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-mono">
                  <th className="p-4">Case Reference / Media</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Verdict Status</th>
                  <th className="p-4">Attributed Source</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpen(item.id)}
                    className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : item.media_type === 'image' ? (
                            <FileImage className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <FileVideo className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white block max-w-xs truncate font-sans text-xs">
                            {item.filename}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.id.slice(0, 13)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 uppercase text-[11px] text-slate-300">
                      {item.media_type}
                    </td>

                    <td className="p-4 text-slate-400 text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="p-4">
                      {item.prediction?.model_status === 'loaded' ? (
                        item.prediction.is_synthetic ? (
                          <span className="px-2 py-0.5 rounded text-[10px] text-rose-300 bg-rose-950/40 border border-rose-500/20">
                            Synthetic
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/20">
                            Authentic
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] text-amber-300 bg-amber-950/40 border border-amber-500/20">
                          Demo Mode
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-300">
                      {item.prediction?.source_class || 'Model Not Loaded'}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => handleDownloadPdf(item.id, e)}
                          title="Download PDF Report"
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Purge Case"
                          className="p-1.5 rounded-lg hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
