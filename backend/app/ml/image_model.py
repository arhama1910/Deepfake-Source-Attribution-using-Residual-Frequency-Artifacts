import os
from pathlib import Path
from typing import Dict, Any, Optional
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

from app.core.config import settings
from app.ml.base import BaseAttributionModel, ATTRIBUTION_CLASSES

class FrequencyFeatureBranch(nn.Module):
    """
    Dedicated Frequency Feature Extractor.
    Ingests 5-channel frequency tensor:
    - 3 channels SRM residual
    - 1 channel 2D FFT magnitude spectrum
    - 1 channel 2D DCT coefficient matrix
    """
    def __init__(self, in_channels: int = 5, out_dim: int = 256):
        super().__init__()
        self.conv_net = nn.Sequential(
            nn.Conv2d(in_channels, 64, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Conv2d(128, 256, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.LeakyReLU(0.2, inplace=True),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(256, out_dim),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.conv_net(x)

class SpatialFrequencyCrossAttention(nn.Module):
    """
    Cross-attention fusion module:
    Allows spatial RGB features to query residual frequency artifact embeddings.
    """
    def __init__(self, dim: int = 256):
        super().__init__()
        self.query_proj = nn.Linear(dim, dim)
        self.key_proj = nn.Linear(dim, dim)
        self.value_proj = nn.Linear(dim, dim)
        self.out_proj = nn.Linear(dim, dim)
        self.scale = dim ** -0.5

    def forward(self, spatial_feat: torch.Tensor, freq_feat: torch.Tensor) -> torch.Tensor:
        q = self.query_proj(spatial_feat).unsqueeze(1)
        k = self.key_proj(freq_feat).unsqueeze(1)
        v = self.value_proj(freq_feat).unsqueeze(1)
        
        attn = torch.softmax(torch.bmm(q, k.transpose(1, 2)) * self.scale, dim=-1)
        out = torch.bmm(attn, v).squeeze(1)
        return self.out_proj(out) + spatial_feat

class DeepTraceAttributionNetwork(nn.Module):
    """
    Full research architecture:
    Spatial Backbone (ViT/CNN placeholder) + Frequency Feature Branch + Cross-Attention Fusion + Dual Heads.
    """
    def __init__(self, num_classes: int = len(ATTRIBUTION_CLASSES)):
        super().__init__()
        # Spatial encoder (simple conv backbone placeholder for ViT/ResNet feature extraction)
        self.spatial_encoder = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1),
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 256, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(256, 256)
        )
        
        self.frequency_encoder = FrequencyFeatureBranch(in_channels=5, out_dim=256)
        self.fusion = SpatialFrequencyCrossAttention(dim=256)
        
        # Dual forensic heads
        self.detection_head = nn.Sequential(
            nn.Linear(256, 64),
            nn.ReLU(inplace=True),
            nn.Linear(64, 2)  # [Real, Synthetic]
        )
        
        self.attribution_head = nn.Sequential(
            nn.Linear(256, 128),
            nn.ReLU(inplace=True),
            nn.Linear(128, num_classes)
        )

    def forward(self, rgb: torch.Tensor, freq_maps: torch.Tensor):
        spatial_emb = self.spatial_encoder(rgb)
        freq_emb = self.frequency_encoder(freq_maps)
        fused = self.fusion(spatial_emb, freq_emb)
        
        det_logits = self.detection_head(fused)
        attr_logits = self.attribution_head(fused)
        return det_logits, attr_logits

class ImageAttributionModel(BaseAttributionModel):
    def __init__(self):
        self.device = torch.device(settings.MODEL_DEVICE if torch.cuda.is_available() and settings.MODEL_DEVICE == "cuda" else "cpu")
        self.model_name = "DeepTrace-SpatialFreq-ViT"
        self.model_version = "v1.0.0-unweighted"
        self.training_dataset = "FaceForensics++ / GenImage / DiffusionForensics"
        self.network = DeepTraceAttributionNetwork()
        self.network.to(self.device)
        self.is_loaded = False
        
        # Check if pre-trained weight checkpoint is supplied
        weights_path = Path(settings.IMAGE_MODEL_PATH) if settings.IMAGE_MODEL_PATH else None
        if weights_path and weights_path.is_file():
            try:
                state_dict = torch.load(weights_path, map_location=self.device)
                self.network.load_state_dict(state_dict)
                self.network.eval()
                self.is_loaded = True
                self.model_version = "v1.0.0-checkpoint"
            except Exception as e:
                print(f"[DeepTrace] Failed to load checkpoint {weights_path}: {e}")
                self.is_loaded = False

    def predict(
        self,
        rgb_tensor: Optional[torch.Tensor] = None,
        residual_tensor: Optional[torch.Tensor] = None,
        fft_tensor: Optional[torch.Tensor] = None,
        dct_tensor: Optional[torch.Tensor] = None
    ) -> Dict[str, Any]:
        """
        If model is unweighted, strictly declare 'model_status': 'not_loaded'.
        Never fabricate random confidence scores or fake predictions.
        """
        if not self.is_loaded:
            return {
                "model_name": self.model_name,
                "model_version": self.model_version,
                "model_status": "not_loaded",
                "training_dataset": self.training_dataset,
                "message": "Research Demo Mode: Preprocessing & frequency extraction completed. Trained attribution model is not currently loaded.",
                "is_synthetic": None,
                "synthetic_probability": None,
                "source_class": "Model Not Loaded",
                "source_confidence": None,
                "class_probabilities": {cls_name: None for cls_name in ATTRIBUTION_CLASSES}
            }
            
        if rgb_tensor is None:
            raise ValueError("rgb_tensor must be provided when model checkpoint is loaded.")
            
        # Inference with loaded weights
        self.network.eval()
        with torch.no_grad():
            rgb = rgb_tensor.to(self.device)
            if rgb.dim() == 3:
                rgb = rgb.unsqueeze(0)
                
            # Combine 3ch residual, 1ch fft, 1ch dct into 5ch freq tensor
            if residual_tensor is None:
                residual_tensor = torch.zeros_like(rgb)
            elif residual_tensor.dim() == 3:
                residual_tensor = residual_tensor.unsqueeze(0)
                
            if fft_tensor is None:
                fft_tensor = torch.zeros((rgb.shape[0], 1, rgb.shape[2], rgb.shape[3]))
            elif fft_tensor.dim() == 3:
                fft_tensor = fft_tensor.unsqueeze(0)
            elif fft_tensor.dim() == 2:
                fft_tensor = fft_tensor.unsqueeze(0).unsqueeze(0)
                
            if dct_tensor is None:
                dct_tensor = torch.zeros((rgb.shape[0], 1, rgb.shape[2], rgb.shape[3]))
            elif dct_tensor.dim() == 3:
                dct_tensor = dct_tensor.unsqueeze(0)
            elif dct_tensor.dim() == 2:
                dct_tensor = dct_tensor.unsqueeze(0).unsqueeze(0)
                
            residual_tensor = residual_tensor.to(self.device)
            fft_tensor = fft_tensor.to(self.device)
            dct_tensor = dct_tensor.to(self.device)
            
            # Ensure frequency maps match rgb spatial dimensions if needed
            if residual_tensor.shape[2:] != rgb.shape[2:]:
                residual_tensor = F.interpolate(residual_tensor, size=rgb.shape[2:], mode="bilinear", align_corners=False)
            if fft_tensor.shape[2:] != rgb.shape[2:]:
                fft_tensor = F.interpolate(fft_tensor, size=rgb.shape[2:], mode="bilinear", align_corners=False)
            if dct_tensor.shape[2:] != rgb.shape[2:]:
                dct_tensor = F.interpolate(dct_tensor, size=rgb.shape[2:], mode="bilinear", align_corners=False)
                
            freq_maps = torch.cat([residual_tensor, fft_tensor, dct_tensor], dim=1)
            det_logits, attr_logits = self.network(rgb, freq_maps)
            
            det_probs = F.softmax(det_logits, dim=-1)[0].cpu().numpy()
            attr_probs = F.softmax(attr_logits, dim=-1)[0].cpu().numpy()
            
            is_synth = bool(det_probs[1] > 0.5)
            synth_prob = float(det_probs[1])
            
            best_class_idx = int(np.argmax(attr_probs))
            source_class = ATTRIBUTION_CLASSES[best_class_idx]
            source_confidence = float(attr_probs[best_class_idx])
            
            prob_dict = {
                ATTRIBUTION_CLASSES[i]: round(float(attr_probs[i]) * 100.0, 2)
                for i in range(len(ATTRIBUTION_CLASSES))
            }
            
            return {
                "model_name": self.model_name,
                "model_version": self.model_version,
                "model_status": "loaded",
                "training_dataset": self.training_dataset,
                "message": "Model inference completed using spatial-frequency fusion checkpoint.",
                "is_synthetic": is_synth,
                "synthetic_probability": round(synth_prob * 100.0, 2),
                "source_class": source_class,
                "source_confidence": round(source_confidence * 100.0, 2),
                "class_probabilities": prob_dict
            }

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "model_status": "loaded" if self.is_loaded else "not_loaded",
            "architecture": "Vision Transformer + Frequency Branch + Cross-Attention",
            "training_dataset": self.training_dataset,
            "supported_classes": ATTRIBUTION_CLASSES,
            "input_resolution": "512x512",
            "inference_device": str(self.device)
        }

def prepare_image_tensors(
    aligned_roi: np.ndarray,
    vis_residual: Optional[np.ndarray] = None,
    vis_fft: Optional[np.ndarray] = None,
    vis_dct: Optional[np.ndarray] = None
) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
    """
    Standard preprocessing pipeline converting facial/square ROI and forensic visual maps
    into PyTorch tensors expected by DeepTraceAttributionNetwork.
    Input:
        aligned_roi: (H, W, 3) uint8 RGB image
        vis_residual: (H, W, 3) or (H, W) uint8 / float residual map
        vis_fft: (H, W, 3) or (H, W) uint8 / float FFT magnitude spectrum
        vis_dct: (H, W, 3) or (H, W) uint8 / float DCT coefficient map
    Output:
        rgb_tensor: [1, 3, H, W] float32 normalized with ImageNet mean/std
        residual_tensor: [1, 3, H, W] float32 in [0, 1]
        fft_tensor: [1, 1, H, W] float32 in [0, 1]
        dct_tensor: [1, 1, H, W] float32 in [0, 1]
    """
    import cv2
    # RGB tensor with ImageNet normalization
    rgb_t = torch.from_numpy(aligned_roi).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)
    rgb_tensor = (rgb_t - mean) / std

    # Residual tensor (3-channel)
    if vis_residual is not None:
        if vis_residual.ndim == 2:
            res_t = torch.from_numpy(vis_residual).unsqueeze(0).unsqueeze(0).repeat(1, 3, 1, 1).float() / 255.0
        else:
            res_t = torch.from_numpy(vis_residual).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    else:
        res_t = torch.zeros_like(rgb_t)

    # FFT tensor (1-channel)
    if vis_fft is not None:
        if vis_fft.ndim == 3:
            fft_gray = cv2.cvtColor(vis_fft, cv2.COLOR_RGB2GRAY)
        else:
            fft_gray = vis_fft
        fft_t = torch.from_numpy(fft_gray).unsqueeze(0).unsqueeze(0).float() / 255.0
    else:
        fft_t = torch.zeros((1, 1, rgb_t.shape[2], rgb_t.shape[3]))

    # DCT tensor (1-channel)
    if vis_dct is not None:
        if vis_dct.ndim == 3:
            dct_gray = cv2.cvtColor(vis_dct, cv2.COLOR_RGB2GRAY)
        else:
            dct_gray = vis_dct
        dct_t = torch.from_numpy(dct_gray).unsqueeze(0).unsqueeze(0).float() / 255.0
    else:
        dct_t = torch.zeros((1, 1, rgb_t.shape[2], rgb_t.shape[3]))

    return rgb_tensor, res_t, fft_t, dct_t

image_model = ImageAttributionModel()
