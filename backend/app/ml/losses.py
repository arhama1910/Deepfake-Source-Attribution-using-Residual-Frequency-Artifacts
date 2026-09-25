from typing import Tuple, Dict
import torch
import torch.nn as nn
import torch.nn.functional as F

class DualForensicLoss(nn.Module):
    """
    Combined Dual-Head Forensic Loss:
    L_total = lambda_det * L_detection + lambda_attr * L_attribution
    
    - L_detection: Cross-Entropy / BCE on binary detection (Real vs Synthetic)
    - L_attribution: Cross-Entropy on multi-class generator provenance
    """
    def __init__(
        self,
        det_weight: float = 0.5,
        attr_weight: float = 1.0,
        label_smoothing: float = 0.05
    ):
        super().__init__()
        self.det_weight = det_weight
        self.attr_weight = attr_weight
        self.det_criterion = nn.CrossEntropyLoss()
        self.attr_criterion = nn.CrossEntropyLoss(label_smoothing=label_smoothing)

    def forward(
        self,
        det_logits: torch.Tensor,
        attr_logits: torch.Tensor,
        binary_targets: torch.Tensor,
        class_targets: torch.Tensor
    ) -> Tuple[torch.Tensor, Dict[str, float]]:
        loss_det = self.det_criterion(det_logits, binary_targets)
        loss_attr = self.attr_criterion(attr_logits, class_targets)
        
        total_loss = (self.det_weight * loss_det) + (self.attr_weight * loss_attr)
        
        loss_dict = {
            "loss_total": float(total_loss.item()),
            "loss_det": float(loss_det.item()),
            "loss_attr": float(loss_attr.item())
        }
        
        return total_loss, loss_dict
