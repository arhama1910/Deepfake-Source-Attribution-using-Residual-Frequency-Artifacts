export interface VisualArtifacts {
  original?: string | null;
  residual?: string | null;
  fft?: string | null;
  dct?: string | null;
}

export interface FrequencyMetrics {
  low_frequency_energy: number;
  mid_frequency_energy: number;
  high_frequency_energy: number;
  high_frequency_ratio: number;
  spectral_entropy: number;
  dct_total_energy: number;
  dct_high_frequency_ratio: number;
  radial_profile?: number[];
}

export interface ResidualMetrics {
  residual_variance: number;
  mean_energy?: number;
  peak_residual?: number;
  filter_type?: string;
}

export interface PredictionResult {
  is_synthetic: boolean | null;
  synthetic_probability: number | null;
  source_class: string | null;
  source_confidence: number | null;
  model_name: string;
  model_version: string;
  model_status: 'loaded' | 'not_loaded';
  training_dataset?: string;
  class_probabilities?: Record<string, number | null> | null;
}

export interface FrameItem {
  frame_number: number;
  raw_frame_index?: number;
  timestamp_sec: number;
  face_detected?: boolean;
  high_frequency_ratio: number;
  spectral_entropy: number;
  residual_energy: number;
  thumbnail_url?: string;
  residual_url?: string;
  fft_url?: string;
  dct_url?: string;
}

export interface TemporalSummary {
  sampled_count: number;
  temporal_jitter: number;
  entropy_variance: number;
  temporal_consistency_score: number;
  mean_high_freq_ratio: number;
  mean_spectral_entropy: number;
}

export interface AnalysisResult {
  id: string;
  filename: string;
  media_type: 'image' | 'video';
  resolution?: string;
  file_size: number;
  duration?: number;
  fps?: number;
  total_frames?: number;
  face_detected: boolean;
  face_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage?: string;
  created_at: string;
  visual_artifacts: VisualArtifacts;
  frequency_metrics: FrequencyMetrics;
  residual_metrics?: ResidualMetrics;
  temporal_metrics?: TemporalSummary;
  frames?: FrameItem[];
  prediction: PredictionResult;
  explanation: string;
}

export interface HistoryItem {
  id: string;
  filename: string;
  media_type: 'image' | 'video';
  file_size: number;
  resolution?: string;
  duration?: number;
  status: string;
  stage: string;
  created_at: string;
  completed_at?: string;
  prediction?: PredictionResult;
  thumbnail_url?: string;
}

export interface ModelMetadata {
  model_name: string;
  model_version: string;
  model_status: 'loaded' | 'not_loaded';
  architecture: string;
  training_dataset: string;
  supported_classes: string[];
  inference_device?: string;
  input_resolution?: string;
}

export interface EvaluationMetricsData {
  status: 'pending_benchmark' | 'evaluated' | 'baseline_reference' | 'awaiting_evaluation';
  is_checkpoint_loaded?: boolean;
  evaluation_dataset: string;
  experimental_model?: {
    status: string;
    checkpoint: string;
    evaluation_status: string;
    metrics?: {
      accuracy: number | null;
      precision: number | null;
      recall: number | null;
      f1_score: number | null;
      roc_auc: number | null;
    } | null;
    note?: string;
  };
  literature_reference_metrics?: {
    citation: string;
    dataset: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: number[][];
  };
  metrics: {
    accuracy: number | null;
    precision: number | null;
    recall: number | null;
    f1_score: number | null;
    roc_auc: number | null;
  };
  attribution_classes: string[];
  confusion_matrix: number[][] | null;
  operational_stats?: {
    total_inspections: number;
    completed_inspections: number;
    face_detection_rate: number;
    inference_device?: string;
  };
  benchmark_note?: string;
}

