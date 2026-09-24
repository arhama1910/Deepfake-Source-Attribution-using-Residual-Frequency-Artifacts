import type { AnalysisResult, HistoryItem, ModelMetadata, EvaluationMetricsData } from '../types/forensics';

const API_BASE = '/api/v1';

export const apiService = {
  async analyzeImage(file: File, mode: string = 'full'): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('analysis_mode', mode);

    const res = await fetch(`${API_BASE}/analyze/image`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Image analysis request failed' }));
      throw new Error(err.detail || 'Image analysis request failed');
    }

    const json = await res.json();
    return json.data;
  },

  async analyzeVideo(file: File, numFrames: number = 16, mode: string = 'full'): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('num_frames', numFrames.toString());
    formData.append('analysis_mode', mode);

    const res = await fetch(`${API_BASE}/analyze/video`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Video analysis request failed' }));
      throw new Error(err.detail || 'Video analysis request failed');
    }

    const json = await res.json();
    return json.data;
  },

  async getAnalysis(id: string): Promise<AnalysisResult> {
    const res = await fetch(`${API_BASE}/analysis/${id}`);
    if (!res.ok) throw new Error('Analysis record not found');
    const json = await res.json();
    return json.data;
  },

  async getAnalysisStatus(id: string): Promise<{ id: string; status: string; stage: string; error_message?: string }> {
    const res = await fetch(`${API_BASE}/analysis/${id}/status`);
    if (!res.ok) throw new Error('Failed to fetch analysis status');
    const json = await res.json();
    return json.data;
  },

  async getHistory(limit = 25, offset = 0, mediaType?: string): Promise<{ total: number; items: HistoryItem[] }> {
    let url = `${API_BASE}/history?limit=${limit}&offset=${offset}`;
    if (mediaType) url += `&media_type=${mediaType}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to retrieve history');
    const json = await res.json();
    return json.data;
  },

  async deleteAnalysis(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/analysis/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete analysis record');
  },

  async getModelRegistry(): Promise<{ image_model: ModelMetadata; video_model: ModelMetadata; attribution_classes: string[]; pipeline_domains: string[] }> {
    const res = await fetch(`${API_BASE}/models`);
    if (!res.ok) throw new Error('Failed to fetch model registry');
    const json = await res.json();
    return json.data;
  },

  async getResearchMetrics(): Promise<EvaluationMetricsData> {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error('Failed to fetch research metrics');
    const json = await res.json();
    return json.data;
  },

  getReportDownloadUrl(id: string): string {
    return `${API_BASE}/analysis/${id}/report`;
  }
};
