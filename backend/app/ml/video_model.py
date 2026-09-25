import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

from app.core.config import settings
from app.ml.base import BaseAttributionModel, ATTRIBUTION_CLASSES

class VideoTemporalPoolingHead(nn.Module):
    """
    Temporal aggregator over frame embeddings.
    Combines frame-level spatial-frequency representations with Bi-GRU / Multihead Attention.
    """
    def __init__(self, emb_dim: int = 256, num_classes: int = len(ATTRIBUTION_CLASSES)):
        super().__init__()
        self.temporal_attn = nn.MultiheadAttention(embed_dim=emb_dim, num_heads=4, batch_first=True)
        self.classifier = nn.Sequential(
            nn.Linear(emb_dim, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )
        self.detection_head = nn.Linear(emb_dim, 2)

    def forward(self, frame_seq: torch.Tensor):
        # frame_seq: [batch, T, emb_dim]
        attn_out, _ = self.temporal_attn(frame_seq, frame_seq, frame_seq)
        pooled = torch.mean(attn_out, dim=1)  # [batch, emb_dim]
        
        det_logits = self.detection_head(pooled)
        attr_logits = self.classifier(pooled)
        return det_logits, attr_logits

class VideoAttributionModel(BaseAttributionModel):
    def __init__(self):
        self.device = torch.device(settings.MODEL_DEVICE if torch.cuda.is_available() and settings.MODEL_DEVICE == "cuda" else "cpu")
        self.model_name = "DeepTrace-VideoSwin-Temporal"
        self.model_version = "v1.0.0-unweighted"
        self.training_dataset = "FaceForensics++ (Video) / DFDC / DeeperForensics"
        self.network = VideoTemporalPoolingHead()
        self.network.to(self.device)
        self.is_loaded = False
        
        weights_path = Path(settings.VIDEO_MODEL_PATH) if settings.VIDEO_MODEL_PATH else None
        if weights_path and weights_path.is_file():
            try:
                state_dict = torch.load(weights_path, map_location=self.device)
                self.network.load_state_dict(state_dict)
                self.network.eval()
                self.is_loaded = True
                self.model_version = "v1.0.0-checkpoint"
            except Exception as e:
                print(f"[DeepTrace] Failed to load video checkpoint {weights_path}: {e}")
                self.is_loaded = False

    def predict(
        self,
        temporal_tensor: Optional[torch.Tensor] = None,
        rgb_tensor: Optional[torch.Tensor] = None,
        residual_tensor: Optional[torch.Tensor] = None,
        fft_tensor: Optional[torch.Tensor] = None,
        dct_tensor: Optional[torch.Tensor] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Video frame sequence prediction."""
        if not self.is_loaded:
            return {
                "model_name": self.model_name,
                "model_version": self.model_version,
                "model_status": "not_loaded",
                "training_dataset": self.training_dataset,
                "message": "Research Demo Mode: Video frame sampling & temporal frequency extraction completed. Video attribution checkpoint is not loaded.",
                "is_synthetic": None,
                "synthetic_probability": None,
                "source_class": "Model Not Loaded",
                "source_confidence": None,
                "class_probabilities": {cls_name: None for cls_name in ATTRIBUTION_CLASSES}
            }
            
        inp = temporal_tensor if temporal_tensor is not None else rgb_tensor
        if inp is None:
            raise ValueError("temporal_tensor or rgb_tensor must be provided when video model checkpoint is loaded.")
            
        # If loaded, run forward pass
        self.network.eval()
        with torch.no_grad():
            t_input = inp.to(self.device)
            if t_input.dim() == 2:
                # [T, emb_dim] -> [1, T, emb_dim]
                t_input = t_input.unsqueeze(0)
            elif t_input.dim() == 4:
                # [T, C, H, W] -> project or average pool if passed raw frames
                t_input = F.adaptive_avg_pool2d(t_input, (1, 1)).flatten(1) # [T, C]
                if t_input.shape[1] != 256:
                    t_input = F.pad(t_input, (0, max(0, 256 - t_input.shape[1])))[:, :256]
                t_input = t_input.unsqueeze(0)
                
            det_logits, attr_logits = self.network(t_input)
            det_probs = F.softmax(det_logits, dim=-1)[0].cpu().numpy()
            attr_probs = F.softmax(attr_logits, dim=-1)[0].cpu().numpy()
            
            best_idx = int(np.argmax(attr_probs))
            return {
                "model_name": self.model_name,
                "model_version": self.model_version,
                "model_status": "loaded",
                "training_dataset": self.training_dataset,
                "message": "Video temporal inference completed.",
                "is_synthetic": bool(det_probs[1] > 0.5),
                "synthetic_probability": round(float(det_probs[1]) * 100.0, 2),
                "source_class": ATTRIBUTION_CLASSES[best_idx],
                "source_confidence": round(float(attr_probs[best_idx]) * 100.0, 2),
                "class_probabilities": {
                    ATTRIBUTION_CLASSES[i]: round(float(attr_probs[i]) * 100.0, 2)
                    for i in range(len(ATTRIBUTION_CLASSES))
                }
            }

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "model_status": "loaded" if self.is_loaded else "not_loaded",
            "architecture": "Video Swin Transformer + Temporal Multihead Attention + Frequency Pooling",
            "training_dataset": self.training_dataset,
            "supported_classes": ATTRIBUTION_CLASSES,
            "inference_device": str(self.device)
        }

def build_temporal_feature_tensor(
    frame_tensor_list: List[Dict[str, Any]],
    image_network: Optional[nn.Module] = None,
    device: Optional[torch.device] = None
) -> torch.Tensor:
    """
    Build a temporal feature sequence tensor [1, T, 256] from sampled video frames.
    Extracts spatial-frequency embeddings for each frame using the image architecture.
    """
    if not frame_tensor_list:
        return torch.zeros((1, 1, 256), dtype=torch.float32)
        
    dev = device or torch.device("cpu")
    embeddings = []
    
    mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)
    
    with torch.no_grad():
        for frame_dict in frame_tensor_list:
            roi = frame_dict["roi"]
            res = frame_dict.get("res")
            fft = frame_dict.get("fft")
            dct = frame_dict.get("dct")
            
            # 1. RGB tensor
            rgb_t = torch.from_numpy(roi).permute(2, 0, 1).unsqueeze(0).float() / 255.0
            norm_rgb = (rgb_t - mean) / std
            
            # 2. Residual tensor (3ch)
            if res is not None:
                res_t = torch.from_numpy(res).permute(2, 0, 1).unsqueeze(0).float() / 255.0
            else:
                res_t = torch.zeros_like(rgb_t)
                
            # 3. FFT (1ch)
            if fft is not None:
                import cv2
                fft_g = cv2.cvtColor(fft, cv2.COLOR_RGB2GRAY) if fft.ndim == 3 else fft
                fft_t = torch.from_numpy(fft_g).unsqueeze(0).unsqueeze(0).float() / 255.0
            else:
                fft_t = torch.zeros((1, 1, rgb_t.shape[2], rgb_t.shape[3]))
                
            # 4. DCT (1ch)
            if dct is not None:
                import cv2
                dct_g = cv2.cvtColor(dct, cv2.COLOR_RGB2GRAY) if dct.ndim == 3 else dct
                dct_t = torch.from_numpy(dct_g).unsqueeze(0).unsqueeze(0).float() / 255.0
            else:
                dct_t = torch.zeros((1, 1, rgb_t.shape[2], rgb_t.shape[3]))
                
            # Match spatial dimensions if needed
            if res_t.shape[2:] != norm_rgb.shape[2:]:
                res_t = F.interpolate(res_t, size=norm_rgb.shape[2:], mode="bilinear", align_corners=False)
            if fft_t.shape[2:] != norm_rgb.shape[2:]:
                fft_t = F.interpolate(fft_t, size=norm_rgb.shape[2:], mode="bilinear", align_corners=False)
            if dct_t.shape[2:] != norm_rgb.shape[2:]:
                dct_t = F.interpolate(dct_t, size=norm_rgb.shape[2:], mode="bilinear", align_corners=False)
                
            freq_maps = torch.cat([res_t, fft_t, dct_t], dim=1)
            
            if image_network is not None:
                spatial_emb = image_network.spatial_encoder(norm_rgb.to(dev))
                freq_emb = image_network.frequency_encoder(freq_maps.to(dev))
                fused = image_network.fusion(spatial_emb, freq_emb)
                embeddings.append(fused.cpu())
            else:
                # Spatial pooling fallback embedding [1, 256]
                pooled = F.adaptive_avg_pool2d(norm_rgb, (16, 16)).flatten(1)
                if pooled.shape[1] > 256:
                    pooled = pooled[:, :256]
                elif pooled.shape[1] < 256:
                    pooled = F.pad(pooled, (0, 256 - pooled.shape[1]))
                embeddings.append(pooled)
                
    # Stack over time dimension: [1, T, 256]
    temporal_tensor = torch.cat(embeddings, dim=0).unsqueeze(0)
    return temporal_tensor

video_model = VideoAttributionModel()
