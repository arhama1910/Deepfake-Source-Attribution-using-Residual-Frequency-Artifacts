from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import torch
import torch.nn as nn
import numpy as np

ATTRIBUTION_CLASSES = [
    "Real",
    "StyleGAN2",
    "StyleGAN3",
    "ProGAN",
    "Stable Diffusion v1.5",
    "Stable Diffusion XL",
    "Latent Diffusion",
    "Midjourney v5"
]

class BaseAttributionModel(ABC):
    @abstractmethod
    def predict(
        self,
        rgb_tensor: torch.Tensor,
        residual_tensor: Optional[torch.Tensor] = None,
        fft_tensor: Optional[torch.Tensor] = None,
        dct_tensor: Optional[torch.Tensor] = None
    ) -> Dict[str, Any]:
        """
        Perform detection and source attribution inference.
        If model weights are not loaded, must return structured status
        with 'model_status': 'not_loaded'.
        """
        pass

    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """Return model metadata, architecture description, training dataset, and weight status."""
        pass
