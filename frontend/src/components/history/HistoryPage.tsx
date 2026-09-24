import React, { useEffect, useState } from 'react';
import { Download, Trash2, RefreshCw, FileImage, FileVideo } from 'lucide-react';
import { apiService } from '../../services/api';
import type { HistoryItem, AnalysisResult } from '../../types/forensics';

interface HistoryPageProps {
  onSelectCase: (result: AnalysisResult) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectCase }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<string>('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getHistory(25, 0, mediaFilter || undefined);
      setItems(res.items);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    apiService.getHistory(25, 0, mediaFilter || undefined).then((res) => {
      if (!ignore) {
        setItems(res.items);
        setTotal(res.total);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!ignore) setIsLoading(false);
    });
    return () => { ignore = true; };
  }, [mediaFilter]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you wish to purge this forensic case record?')) return;
    try {
      await apiService.deleteAnalysis(id);
      setItems(items.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      alert('Failed to delete case.');
    }
  };

  const handleOpen = async (id: string) => {
    try {
      const fullCase = await apiService.getAnalysis(id);
      onSelectCase(fullCase);
    } catch {
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#083C33]">
            Forensic Case Log & Archive
          </h1>
          <p className="text-xs sm:text-sm text-[#3D5A52] mt-1">
            Historical audit logs of inspected media and attribution records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex rounded-full bg-[#EBF0E6] border border-[#D9DED4] p-1 text-xs">
            <button
              onClick={() => setMediaFilter('')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                mediaFilter === '' ? 'bg-[#0D4F43] text-white font-semibold shadow-sm' : 'text-[#3D5A52] hover:text-[#083C33]'
              }`}
            >
              All ({total})
            </button>
            <button
              onClick={() => setMediaFilter('image')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                mediaFilter === 'image' ? 'bg-[#0D4F43] text-white font-semibold shadow-sm' : 'text-[#3D5A52] hover:text-[#083C33]'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setMediaFilter('video')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                mediaFilter === 'video' ? 'bg-[#0D4F43] text-white font-semibold shadow-sm' : 'text-[#3D5A52] hover:text-[#083C33]'
              }`}
            >
              Videos
            </button>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2.5 rounded-full bg-[#D9DED4] hover:bg-[#CAD2C4] text-[#083C33] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-[#D9DED4] shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-16 text-center text-[#3D5A52] text-xs font-mono">
            {isLoading ? 'Loading forensic audit history...' : 'No historical forensic cases logged yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F6F0] text-[#3D5A52] border-b border-[#D9DED4] font-mono">
                  <th className="p-4">Case Reference / Media</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Verdict Status</th>
                  <th className="p-4">Attributed Source</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DED4]/60 font-mono">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpen(item.id)}
                    className="hover:bg-[#EBF0E6]/50 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EBF0E6] overflow-hidden shrink-0 border border-[#D9DED4] flex items-center justify-center">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : item.media_type === 'image' ? (
                            <FileImage className="w-4 h-4 text-[#0D4F43]" />
                          ) : (
                            <FileVideo className="w-4 h-4 text-[#0D4F43]" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-[#083C33] block max-w-xs truncate font-sans text-xs">
                            {item.filename}
                          </span>
                          <span className="text-[10px] text-[#3D5A52]">
                            {item.id.slice(0, 13)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 uppercase text-[11px] text-[#083C33] font-semibold">
                      {item.media_type}
                    </td>

                    <td className="p-4 text-[#3D5A52] text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="p-4">
                      {item.prediction?.model_status === 'loaded' ? (
                        item.prediction.is_synthetic ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] text-[#9E3A3A] bg-[#FDF2F2] border border-[#E0B4B4] font-semibold">
                            Synthetic
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] text-[#0D4F43] bg-[#EBF0E6] border border-[#D9DED4] font-semibold">
                            Authentic
                          </span>
                        )
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] text-[#B57424] bg-[#FDF9F0] border border-[#E6DAC0] font-semibold">
                          Demo Mode
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-[#083C33] font-medium">
                      {item.prediction?.source_class || 'Model Not Loaded'}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => handleDownloadPdf(item.id, e)}
                          title="Download PDF Report"
                          className="p-1.5 rounded-lg hover:bg-[#EBF0E6] text-[#3D5A52] hover:text-[#0D4F43] transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Purge Case"
                          className="p-1.5 rounded-lg hover:bg-[#FDF2F2] text-[#3D5A52] hover:text-[#9E3A3A] transition-colors"
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
