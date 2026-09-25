import os
import sys
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

# Ensure project root is in sys.path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.ml.base import ATTRIBUTION_CLASSES
from app.ml.image_model import DeepTraceAttributionNetwork
from app.ml.dataset import get_dataloaders
from app.ml.losses import DualForensicLoss

def load_config(config_path: Path) -> Dict[str, Any]:
    if not config_path.exists():
        return {}
    try:
        import yaml
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception:
        return {}

def train_one_epoch(
    model: nn.Module,
    dataloader: torch.utils.data.DataLoader,
    criterion: DualForensicLoss,
    optimizer: torch.optim.Optimizer,
    device: torch.device
) -> Dict[str, float]:
    model.train()
    running_loss = 0.0
    correct_det = 0
    correct_attr = 0
    total_samples = 0
    
    for rgb, freq, binary_labels, class_labels in dataloader:
        rgb = rgb.to(device)
        freq = freq.to(device)
        binary_labels = binary_labels.to(device)
        class_labels = class_labels.to(device)
        
        optimizer.zero_grad()
        det_logits, attr_logits = model(rgb, freq)
        
        loss, _ = criterion(det_logits, attr_logits, binary_labels, class_labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * rgb.size(0)
        
        pred_det = det_logits.argmax(dim=-1)
        pred_attr = attr_logits.argmax(dim=-1)
        
        correct_det += (pred_det == binary_labels).sum().item()
        correct_attr += (pred_attr == class_labels).sum().item()
        total_samples += rgb.size(0)
        
    return {
        "loss": running_loss / max(total_samples, 1),
        "det_accuracy": correct_det / max(total_samples, 1),
        "attr_accuracy": correct_attr / max(total_samples, 1)
    }

def validate(
    model: nn.Module,
    dataloader: torch.utils.data.DataLoader,
    criterion: DualForensicLoss,
    device: torch.device
) -> Dict[str, float]:
    model.eval()
    running_loss = 0.0
    correct_det = 0
    correct_attr = 0
    total_samples = 0
    
    with torch.no_grad():
        for rgb, freq, binary_labels, class_labels in dataloader:
            rgb = rgb.to(device)
            freq = freq.to(device)
            binary_labels = binary_labels.to(device)
            class_labels = class_labels.to(device)
            
            det_logits, attr_logits = model(rgb, freq)
            loss, _ = criterion(det_logits, attr_logits, binary_labels, class_labels)
            
            running_loss += loss.item() * rgb.size(0)
            
            pred_det = det_logits.argmax(dim=-1)
            pred_attr = attr_logits.argmax(dim=-1)
            
            correct_det += (pred_det == binary_labels).sum().item()
            correct_attr += (pred_attr == class_labels).sum().item()
            total_samples += rgb.size(0)
            
    return {
        "val_loss": running_loss / max(total_samples, 1),
        "val_det_accuracy": correct_det / max(total_samples, 1),
        "val_attr_accuracy": correct_attr / max(total_samples, 1)
    }

def main():
    parser = argparse.ArgumentParser(description="DeepTrace AI - Attribution Network Training")
    parser.add_argument("--config", type=str, default=str(current_dir / "config.yaml"), help="Path to config.yaml")
    parser.add_argument("--data_dir", type=str, default=None, help="Dataset directory")
    parser.add_argument("--epochs", type=int, default=None, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=None, help="Batch size")
    parser.add_argument("--lr", type=float, default=None, help="Learning rate")
    parser.add_argument("--device", type=str, default=None, help="Device (cpu or cuda)")
    parser.add_argument("--output_dir", type=str, default=None, help="Checkpoint output directory")
    args = parser.parse_args()
    
    cfg = load_config(Path(args.config))
    data_dir = args.data_dir or cfg.get("dataset", {}).get("data_dir", "dataset")
    epochs = args.epochs or cfg.get("training", {}).get("epochs", 20)
    batch_size = args.batch_size or cfg.get("training", {}).get("batch_size", 16)
    lr = args.lr or cfg.get("training", {}).get("learning_rate", 1e-4)
    dev_str = args.device or cfg.get("architecture", {}).get("device", "cpu")
    out_dir = Path(args.output_dir or cfg.get("checkpoints", {}).get("save_dir", "checkpoints"))
    
    device = torch.device(dev_str if torch.cuda.is_available() and dev_str == "cuda" else "cpu")
    print("==================================================")
    print("DEEPTRACE AI - MODEL TRAINING PIPELINE")
    print(f"Device: {device}")
    print(f"Target Dataset Directory: {data_dir}")
    print("==================================================")
    
    # Load dataset
    train_loader, val_loader, _ = get_dataloaders(data_dir, batch_size=batch_size)
    if train_loader is None or len(train_loader.dataset) == 0:
        print("\n" + "=" * 50)
        print("DATASET REQUIRED BEFORE TRAINING")
        print("==================================================")
        print("The training pipeline requires a verified forensic dataset before training can commence.")
        print(f"Expected path: {Path(data_dir).resolve()}")
        print("Structure:")
        print("  dataset/")
        print("    train/")
        for c in ATTRIBUTION_CLASSES:
            print(f"      {c}/")
        print("    val/")
        print("    test/")
        print("No synthetic or fake weights will be fabricated.")
        print("==================================================")
        return
        
    out_dir.mkdir(parents=True, exist_ok=True)
    model = DeepTraceAttributionNetwork(num_classes=len(ATTRIBUTION_CLASSES)).to(device)
    criterion = DualForensicLoss(det_weight=0.5, attr_weight=1.0).to(device)
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)
    
    best_val_acc = 0.0
    
    for epoch in range(1, epochs + 1):
        train_res = train_one_epoch(model, train_loader, criterion, optimizer, device)
        scheduler.step()
        
        val_str = ""
        if val_loader:
            val_res = validate(model, val_loader, criterion, device)
            val_str = f" | Val Loss: {val_res['val_loss']:.4f} | Val Acc: {val_res['val_attr_accuracy']*100:.2f}%"
            
            if val_res["val_attr_accuracy"] > best_val_acc:
                best_val_acc = val_res["val_attr_accuracy"]
                best_path = out_dir / "deeptrace_best.pth"
                torch.save(model.state_dict(), best_path)
                val_str += " [BEST SAVED]"
                
        print(f"Epoch [{epoch}/{epochs}] - Train Loss: {train_res['loss']:.4f} | Train Acc: {train_res['attr_accuracy']*100:.2f}%{val_str}")
        
    last_path = out_dir / "deeptrace_last.pth"
    torch.save(model.state_dict(), last_path)
    print(f"\nTraining completed. Final checkpoint saved to: {last_path}")

if __name__ == "__main__":
    main()
