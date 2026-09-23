import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(String(36), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    sanitized_filename = Column(String(255), nullable=False)
    media_type = Column(String(20), nullable=False)  # 'image' or 'video'
    mime_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    resolution = Column(String(50), nullable=True)  # e.g., "1920x1080"
    duration = Column(Float, nullable=True)  # in seconds for video
    status = Column(String(30), default="pending", index=True)  # pending, processing, completed, failed
    stage = Column(String(50), default="File Validation")
    error_message = Column(Text, nullable=True)
    face_detected = Column(Boolean, default=False)
    face_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Forensic visualization URLs / filenames stored in static/
    original_url = Column(String(255), nullable=True)
    residual_url = Column(String(255), nullable=True)
    fft_url = Column(String(255), nullable=True)
    dct_url = Column(String(255), nullable=True)
    report_url = Column(String(255), nullable=True)
    
    # Relationships
    prediction = relationship("Prediction", back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    frequency_analysis = relationship("FrequencyAnalysis", back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    frame_analyses = relationship("FrameAnalysis", back_populates="analysis", cascade="all, delete-orphan", order_by="FrameAnalysis.frame_number")

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, unique=True)
    is_synthetic = Column(Boolean, nullable=True)
    synthetic_probability = Column(Float, nullable=True)
    source_class = Column(String(50), nullable=True)  # Real, StyleGAN2, StyleGAN3, ProGAN, Stable Diffusion, Latent Diffusion, Midjourney
    source_confidence = Column(Float, nullable=True)
    class_probabilities = Column(Text, nullable=True)  # JSON dictionary of all class logits/probs
    model_name = Column(String(100), default="DeepTrace-SpatialFreq-ViT")
    model_version = Column(String(50), default="v1.0.0-unweighted")
    model_status = Column(String(50), default="not_loaded")  # 'loaded' or 'not_loaded'
    inference_device = Column(String(20), default="cpu")
    
    analysis = relationship("Analysis", back_populates="prediction")

class FrequencyAnalysis(Base):
    __tablename__ = "frequency_analyses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, unique=True)
    low_frequency_energy = Column(Float, nullable=False)
    mid_frequency_energy = Column(Float, nullable=False)
    high_frequency_energy = Column(Float, nullable=False)
    high_frequency_ratio = Column(Float, nullable=False)
    spectral_entropy = Column(Float, nullable=False)
    dct_total_energy = Column(Float, nullable=False)
    dct_high_frequency_ratio = Column(Float, nullable=False)
    radial_profile = Column(Text, nullable=True)  # JSON array for frequency curve plotting
    
    analysis = relationship("Analysis", back_populates="frequency_analysis")

class FrameAnalysis(Base):
    __tablename__ = "frame_analyses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)
    frame_number = Column(Integer, nullable=False)
    timestamp_sec = Column(Float, nullable=False)
    prediction = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    high_frequency_ratio = Column(Float, nullable=False)
    spectral_entropy = Column(Float, nullable=False)
    residual_energy = Column(Float, nullable=False)
    frame_thumbnail_url = Column(String(255), nullable=True)
    frame_residual_url = Column(String(255), nullable=True)
    frame_fft_url = Column(String(255), nullable=True)
    frame_dct_url = Column(String(255), nullable=True)
    
    analysis = relationship("Analysis", back_populates="frame_analyses")

class ModelRegistryEntry(Base):
    __tablename__ = "model_registry"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False, unique=True)
    architecture = Column(String(100), nullable=False)  # ViT-Base + Frequency Cross-Attention / Video Swin
    training_dataset = Column(String(100), nullable=False)  # e.g., FaceForensics++ / GenImage / DiffusionForensics
    is_active = Column(Boolean, default=False)
    model_status = Column(String(50), default="unweighted")
    description = Column(Text, nullable=True)
    supported_classes = Column(Text, nullable=False)  # JSON list
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class EvaluationMetric(Base):
    __tablename__ = "evaluation_metrics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_version = Column(String(50), nullable=False)
    dataset_name = Column(String(100), nullable=False)
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    confusion_matrix = Column(Text, nullable=True)  # JSON 2D array
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)
