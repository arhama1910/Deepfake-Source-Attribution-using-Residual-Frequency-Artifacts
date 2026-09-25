import os
import sys
import json
import random
import datetime
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

import numpy as np
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

def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

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
        "loss": round(running_loss / max(total_samples, 1), 4),
        "det_accuracy": round(correct_det / max(total_samples, 1), 4),
        "attr_accuracy": round(correct_attr / max(total_samples, 1), 4)
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
        "val_loss": round(running_loss / max(total_samples, 1), 4),
        "val_det_accuracy": round(correct_det / max(total_samples, 1), 4),
        "val_attr_accuracy": round(correct_attr / max(total_samples, 1), 4)
    }

def main():
    parser = argparse.ArgumentParser(description="DeepTrace AI - Attribution Network Supervised Training")
    parser.add_argument("--config", type=str, default=str(current_dir / "config.yaml"), help="Path to config.yaml")
    parser.add_argument("--data_dir", type=str, default=None, help="Dataset directory")
    parser.add_argument("--epochs", type=int, default=None, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=None, help="Batch size")
    parser.add_argument("--lr", type=float, default=None, help="Learning rate")
    parser.add_argument("--device", type=str, default=None, help="Device ('auto', 'cuda', 'cpu')")
    parser.add_argument("--output_dir", type=str, default=None, help="Checkpoint output directory")
    parser.add_argument("--resume", type=str, default=None, help="Path to checkpoint to resume training from")
    args = parser.parse_args()
    
    cfg = load_config(Path(args.config))
    data_dir = args.data_dir or cfg.get("dataset", {}).get("data_dir", "datasets/deeptrace")
    epochs = args.epochs or cfg.get("training", {}).get("epochs", 20)
    batch_size = args.batch_size or cfg.get("training", {}).get("batch_size", 16)
    lr = args.lr or cfg.get("training", {}).get("learning_rate", 1e-4)
    dev_str = args.device or cfg.get("architecture", {}).get("device", "auto")
    out_dir = Path(args.output_dir or cfg.get("checkpoints", {}).get("save_dir", "models/image"))
    seed = cfg.get("training", {}).get("seed", 42)
    target_size = cfg.get("architecture", {}).get("input_resolution", 512)
    
    set_seed(seed)
    
    # Device Resolution: CUDA if available, otherwise CPU
    if dev_str == "auto":
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    else:
        device = torch.device(dev_str if torch.cuda.is_available() and dev_str == "cuda" else "cpu")
        
    print("==================================================")
    print("DEEPTRACE AI — SUPERVISED TRAINING PIPELINE")
    print(f"Selected Device: {device} ({'CUDA GPU Acceleration' if device.type == 'cuda' else 'CPU Host'})")
    print(f"Dataset Path:    {Path(data_dir).resolve()}")
    print(f"Checkpoint Dir:  {out_dir.resolve()}")
    print("==================================================")
    
    # Check dataset existence
    target_data_path = Path(data_dir)
    if not target_data_path.exists():
        fallback = Path("dataset")
        if fallback.exists():
            target_data_path = fallback
            
    train_loader, val_loader, _ = get_dataloaders(target_data_path, batch_size=batch_size, target_size=target_size)
    if train_loader is None or len(train_loader.dataset) == 0:
        print("\n" + "=" * 55)
        print("DATASET REQUIRED BEFORE TRAINING")
        print("==================================================")
        print("The training pipeline requires verified forensic media samples.")
        print(f"Expected path: {target_data_path.resolve()}")
        print("Expected contract structure:")
        print("  datasets/deeptrace/")
        print("    train/")
        for c in ATTRIBUTION_CLASSES:
            print(f"      {c}/")
        print("    val/")
        print("    test/")
        print("No synthetic or fake weights will be fabricated.")
        print("==================================================")
        return
        
    out_dir.mkdir(parents=True, exist_ok=True)
    metrics_report_dir = Path("reports/metrics")
    metrics_report_dir.mkdir(parents=True, exist_ok=True)
    
    model = DeepTraceAttributionNetwork(num_classes=len(ATTRIBUTION_CLASSES)).to(device)
    criterion = DualForensicLoss(
        det_weight=cfg.get("loss", {}).get("detection_weight", 0.5),
        attr_weight=cfg.get("loss", {}).get("attribution_weight", 1.0),
        label_smoothing=cfg.get("loss", {}).get("label_smoothing", 0.05)
    ).to(device)
    
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=cfg.get("training", {}).get("weight_decay", 1e-4))
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)
    
    start_epoch = 1
    best_val_acc = 0.0
    history = []
    
    # Resume from checkpoint if specified
    if args.resume:
        resume_path = Path(args.resume)
        if resume_path.is_file():
            print(f"Resuming training from checkpoint: {resume_path}")
            checkpoint_data = torch.load(resume_path, map_location=device)
            if isinstance(checkpoint_data, dict) and "state_dict" in checkpoint_data:
                model.load_state_dict(checkpoint_data["state_dict"])
                if "optimizer_state_dict" in checkpoint_data:
                    optimizer.load_state_dict(checkpoint_data["optimizer_state_dict"])
                start_epoch = checkpoint_data.get("epoch", 0) + 1
                best_val_acc = checkpoint_data.get("validation_metrics", {}).get("val_attr_accuracy", 0.0)
            else:
                model.load_state_dict(checkpoint_data)
                
    patience = cfg.get("training", {}).get("early_stopping_patience", 5)
    epochs_no_improve = 0
    
    for epoch in range(start_epoch, epochs + 1):
        train_res = train_one_epoch(model, train_loader, criterion, optimizer, device)
        scheduler.step()
        
        val_res = {"val_loss": 0.0, "val_det_accuracy": 0.0, "val_attr_accuracy": 0.0}
        val_str = ""
        if val_loader:
            val_res = validate(model, val_loader, criterion, device)
            val_str = f" | Val Loss: {val_res['val_loss']:.4f} | Val Acc: {val_res['val_attr_accuracy']*100:.2f}%"
            
            # Check for best checkpoint
            if val_res["val_attr_accuracy"] > best_val_acc:
                best_val_acc = val_res["val_attr_accuracy"]
                epochs_no_improve = 0
                
                # Build complete structured checkpoint with metadata
                metadata = {
                    "model_architecture": "DeepTraceAttributionNetwork",
                    "classes": ATTRIBUTION_CLASSES,
                    "class_to_idx": {cls_name: i for i, cls_name in enumerate(ATTRIBUTION_CLASSES)},
                    "training_dataset": str(target_data_path),
                    "training_config": cfg,
                    "image_resolution": target_size,
                    "preprocessing_version": "v1.1.0-dual-domain",
                    "epoch": epoch,
                    "validation_metrics": val_res,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "random_seed": seed
                }
                
                best_checkpoint_payload = {
                    **metadata,
                    "state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict()
                }
                
                best_pt_path = out_dir / "best.pt"
                torch.save(best_checkpoint_payload, best_pt_path)
                
                # Also save separate metadata.json for non-PyTorch readers
                meta_json_path = out_dir / "metadata.json"
                with open(meta_json_path, "w", encoding="utf-8") as f:
                    json.dump(metadata, f, indent=2)
                    
                val_str += " [BEST CHECKPOINT SAVED]"
            else:
                epochs_no_improve += 1
                
        history_entry = {
            "epoch": epoch,
            "train": train_res,
            "val": val_res,
            "lr": float(scheduler.get_last_lr()[0])
        }
        history.append(history_entry)
        
        print(f"Epoch [{epoch}/{epochs}] - Train Loss: {train_res['loss']:.4f} | Train Acc: {train_res['attr_accuracy']*100:.2f}%{val_str}")
        
        if patience and epochs_no_improve >= patience:
            print(f"\nEarly stopping triggered after {patience} epochs without validation improvement.")
            break
            
    # Save last checkpoint
    last_pt_path = out_dir / "last.pt"
    last_payload = {
        "model_architecture": "DeepTraceAttributionNetwork",
        "classes": ATTRIBUTION_CLASSES,
        "class_to_idx": {cls_name: i for i, cls_name in enumerate(ATTRIBUTION_CLASSES)},
        "training_dataset": str(target_data_path),
        "epoch": epoch,
        "state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict()
    }
    torch.save(last_payload, last_pt_path)
    
    # Save training history log
    history_file = metrics_report_dir / "training_history.json"
    with open(history_file, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
        
    print(f"\nTraining completed.")
    print(f"Best checkpoint:   {out_dir / 'best.pt'}")
    print(f"Last checkpoint:   {last_pt_path}")
    print(f"Training history:  {history_file}")

if __name__ == "__main__":
    main()
