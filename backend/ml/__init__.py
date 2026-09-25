"""
DeepTrace AI Machine Learning Research & Training Package.
Exposes datasets, architectures, losses, training, and evaluation pipelines.
"""
from app.ml.image_model import DeepTraceAttributionNetwork, FrequencyFeatureBranch, SpatialFrequencyCrossAttention
from app.ml.video_model import VideoTemporalPoolingHead
from app.ml.dataset import DeepTraceDataset, get_dataloaders
from app.ml.losses import DualForensicLoss
from app.ml.train import train_one_epoch, validate
from app.ml.evaluate import evaluate_model, calculate_classification_metrics
from app.ml.base import ATTRIBUTION_CLASSES
