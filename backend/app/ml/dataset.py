import os
import random
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import cv2
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

from app.ml.base import ATTRIBUTION_CLASSES
from app.forensics.face_detection import detect_and_align_face
from app.forensics.residual import extract_residual_pipeline
from app.forensics.fft_analysis import analyze_fft_pipeline
from app.forensics.dct_analysis import analyze_dct_pipeline
from app.ml.image_model import prepare_image_tensors

class DeepTraceDataset(Dataset):
    """
    Forensic Multi-Domain PyTorch Dataset for Source Attribution.
    Extracts spatial RGB and 5-channel frequency tensors (SRM + FFT + DCT)
    for each sample.
    """
    def __init__(
        self,
        data_dir: Path | str,
        split: str = "train",
        target_size: int = 512,
        augment: bool = False,
        classes: Optional[List[str]] = None
    ):
        self.data_dir = Path(data_dir)
        self.split = split
        self.target_size = target_size
        self.augment = augment
        self.classes = classes or ATTRIBUTION_CLASSES
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        
        self.samples: List[Tuple[Path, int, int]] = []  # (path, binary_label, class_label)
        self._load_samples()

    def _load_samples(self):
        # Look for split subfolder first (data_dir / train / class_name), then flat (data_dir / class_name)
        split_dir = self.data_dir / self.split
        search_dir = split_dir if split_dir.exists() and split_dir.is_dir() else self.data_dir
        
        if not search_dir.exists():
            return
            
        valid_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        
        for cls_name, cls_idx in self.class_to_idx.items():
            cls_folder = search_dir / cls_name
            if not cls_folder.exists() or not cls_folder.is_dir():
                # Also try case-insensitive match
                for d in search_dir.iterdir():
                    if d.is_dir() and d.name.lower() == cls_name.lower():
                        cls_folder = d
                        break
                        
            if cls_folder.exists() and cls_folder.is_dir():
                for f in cls_folder.iterdir():
                    if f.is_file() and f.suffix.lower() in valid_extensions:
                        binary_label = 0 if cls_name.lower() == "real" else 1
                        self.samples.append((f, binary_label, cls_idx))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        img_path, binary_label, class_label = self.samples[idx]
        
        # Load image
        bgr = cv2.imread(str(img_path))
        if bgr is None:
            # Fallback zero tensor if file is corrupt
            rgb_t = torch.zeros((3, self.target_size, self.target_size), dtype=torch.float32)
            freq_t = torch.zeros((5, self.target_size, self.target_size), dtype=torch.float32)
            return rgb_t, freq_t, torch.tensor(binary_label, dtype=torch.long), torch.tensor(class_label, dtype=torch.long)
            
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        
        # Face detection / contextual ROI
        aligned_roi, _, _, _ = detect_and_align_face(rgb, target_size=self.target_size)
        
        # Data augmentation (during training only)
        if self.augment and self.split == "train":
            if random.random() > 0.5:
                aligned_roi = cv2.flip(aligned_roi, 1)  # horizontal flip
            if random.random() > 0.7:
                # slight brightness / contrast jitter
                alpha = random.uniform(0.9, 1.1)
                beta = random.randint(-10, 10)
                aligned_roi = np.clip(alpha * aligned_roi + beta, 0, 255).astype(np.uint8)
                
        # Forensic extraction
        vis_res, _ = extract_residual_pipeline(aligned_roi)
        vis_fft, _, _ = analyze_fft_pipeline(aligned_roi)
        vis_dct, _ = analyze_dct_pipeline(aligned_roi)
        
        # Prepare tensors
        rgb_tensor, res_tensor, fft_tensor, dct_tensor = prepare_image_tensors(
            aligned_roi, vis_res, vis_fft, vis_dct
        )
        
        # Squeeze batch dimension [1, C, H, W] -> [C, H, W]
        rgb_tensor = rgb_tensor.squeeze(0)
        res_tensor = res_tensor.squeeze(0)
        fft_tensor = fft_tensor.squeeze(0)
        dct_tensor = dct_tensor.squeeze(0)
        
        freq_tensor = torch.cat([res_tensor, fft_tensor, dct_tensor], dim=0)  # [5, H, W]
        
        return (
            rgb_tensor,
            freq_tensor,
            torch.tensor(binary_label, dtype=torch.long),
            torch.tensor(class_label, dtype=torch.long)
        )

def get_dataloaders(
    data_dir: Path | str,
    batch_size: int = 16,
    target_size: int = 512,
    num_workers: int = 0
) -> Tuple[Optional[DataLoader], Optional[DataLoader], Optional[DataLoader]]:
    """
    Construct train, val, test dataloaders.
    Returns (None, None, None) if dataset directory is not populated.
    """
    path = Path(data_dir)
    if not path.exists():
        print(f"\n[DeepTrace ML] DATASET REQUIRED BEFORE TRAINING: Directory '{path}' does not exist.")
        return None, None, None
        
    train_dataset = DeepTraceDataset(path, split="train", target_size=target_size, augment=True)
    val_dataset = DeepTraceDataset(path, split="val", target_size=target_size, augment=False)
    test_dataset = DeepTraceDataset(path, split="test", target_size=target_size, augment=False)
    
    if len(train_dataset) == 0:
        print(f"\n[DeepTrace ML] DATASET REQUIRED BEFORE TRAINING: No image samples found in '{path}'.")
        print("Please structure your dataset with class subdirectories: dataset/{train,val,test}/<class_name>/*.jpg")
        return None, None, None
        
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers) if len(val_dataset) > 0 else None
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers) if len(test_dataset) > 0 else None
    
    return train_loader, val_loader, test_loader
