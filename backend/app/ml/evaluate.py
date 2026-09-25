import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

# Ensure project root is in sys.path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.ml.base import ATTRIBUTION_CLASSES
from app.ml.image_model import DeepTraceAttributionNetwork
from app.ml.dataset import get_dataloaders

# Pure numpy metric computations to guarantee zero missing library failures
def calculate_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray,
    classes: List[str]
) -> Dict[str, Any]:
    """
    Compute rigorous empirical evaluation metrics:
    Accuracy, Precision, Recall, F1, Per-Class breakdown, and Confusion Matrix.
    """
    n_classes = len(classes)
    total_samples = len(y_true)
    if total_samples == 0:
        return {}
        
    accuracy = float(np.mean(y_true == y_pred))
    
    # Confusion Matrix: rows = true, cols = predicted
    conf_matrix = np.zeros((n_classes, n_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        if 0 <= t < n_classes and 0 <= p < n_classes:
            conf_matrix[t, p] += 1
            
    per_class_metrics = {}
    precisions = []
    recalls = []
    f1s = []
    class_counts = {}
    
    for i, cls_name in enumerate(classes):
        tp = conf_matrix[i, i]
        fp = conf_matrix[:, i].sum() - tp
        fn = conf_matrix[i, :].sum() - tp
        support = int(conf_matrix[i, :].sum())
        class_counts[cls_name] = support
        
        prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        
        precisions.append(prec)
        recalls.append(rec)
        f1s.append(f1)
        
        per_class_metrics[cls_name] = {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "support": support
        }
        
    macro_precision = float(np.mean(precisions))
    macro_recall = float(np.mean(recalls))
    macro_f1 = float(np.mean(f1s))
    
    # Binary detection metrics (Class 0: Real vs Classes 1-N: Synthetic)
    y_true_binary = (y_true > 0).astype(int)
    y_pred_binary = (y_pred > 0).astype(int)
    bin_tp = np.sum((y_true_binary == 1) & (y_pred_binary == 1))
    bin_fp = np.sum((y_true_binary == 0) & (y_pred_binary == 1))
    bin_fn = np.sum((y_true_binary == 1) & (y_pred_binary == 0))
    bin_tn = np.sum((y_true_binary == 0) & (y_pred_binary == 0))
    
    bin_acc = float((bin_tp + bin_tn) / total_samples) if total_samples > 0 else 0.0
    bin_prec = float(bin_tp / (bin_tp + bin_fp)) if (bin_tp + bin_fp) > 0 else 0.0
    bin_rec = float(bin_tp / (bin_tp + bin_fn)) if (bin_tp + bin_fn) > 0 else 0.0
    bin_f1 = float(2 * bin_prec * bin_rec / (bin_prec + bin_rec)) if (bin_prec + bin_rec) > 0 else 0.0
    
    # ROC-AUC computation (macro One-vs-Rest if scikit-learn is available, else empirical trapezoid)
    roc_auc = None
    try:
        from sklearn.metrics import roc_auc_score
        if y_prob is not None and len(np.unique(y_true)) > 1:
            if y_prob.shape[1] == n_classes:
                roc_auc = float(roc_auc_score(y_true, y_prob, multi_class="ovr", average="macro"))
    except Exception:
        pass
        
    return {
        "overall_accuracy": round(accuracy, 4),
        "macro_precision": round(macro_precision, 4),
        "macro_recall": round(macro_recall, 4),
        "macro_f1": round(macro_f1, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "total_evaluated_samples": total_samples,
        "binary_detection": {
            "accuracy": round(bin_acc, 4),
            "precision": round(bin_prec, 4),
            "recall": round(bin_rec, 4),
            "f1_score": round(bin_f1, 4),
            "tp": int(bin_tp),
            "fp": int(bin_fp),
            "tn": int(bin_tn),
            "fn": int(bin_fn)
        },
        "confusion_matrix": conf_matrix.tolist(),
        "per_class_metrics": per_class_metrics,
        "classes": classes
    }

def apply_baseline_mask(
    rgb: torch.Tensor,
    freq: torch.Tensor,
    baseline_mode: str
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Support Phase 8 Ablation Studies:
    1. spatial_only: Zeros out frequency channels.
    2. frequency_only: Zeros out RGB channels.
    3. residual_frequency: Zeros out FFT and DCT channels (keeps 3ch SRM only).
    4. spatial_frequency: Spatial + frequency standard concatenation.
    5. spatial_frequency_cross_attention: Full DeepTrace multi-modal attention.
    """
    if baseline_mode == "spatial_only":
        return rgb, torch.zeros_like(freq)
    elif baseline_mode == "frequency_only":
        return torch.zeros_like(rgb), freq
    elif baseline_mode == "residual_frequency":
        masked_freq = torch.zeros_like(freq)
        masked_freq[:, :3, :, :] = freq[:, :3, :, :]  # retain 3ch SRM residual only
        return torch.zeros_like(rgb), masked_freq
    elif baseline_mode == "spatial_frequency":
        return rgb, freq
    else:
        # spatial_frequency_cross_attention (Full pipeline)
        return rgb, freq

def evaluate_model(
    model: nn.Module,
    dataloader: torch.utils.data.DataLoader,
    device: torch.device,
    baseline_mode: str = "spatial_frequency_cross_attention",
    classes: Optional[List[str]] = None
) -> Dict[str, Any]:
    classes = classes or ATTRIBUTION_CLASSES
    model.eval()
    
    all_true = []
    all_pred = []
    all_probs = []
    
    with torch.no_grad():
        for rgb, freq, _, class_labels in dataloader:
            rgb, freq = apply_baseline_mask(rgb, freq, baseline_mode)
            rgb = rgb.to(device)
            freq = freq.to(device)
            
            _, attr_logits = model(rgb, freq)
            probs = F.softmax(attr_logits, dim=-1).cpu().numpy()
            preds = np.argmax(probs, axis=1)
            
            all_true.extend(class_labels.numpy().tolist())
            all_pred.extend(preds.tolist())
            all_probs.extend(probs.tolist())
            
    y_true = np.array(all_true)
    y_pred = np.array(all_pred)
    y_prob = np.array(all_probs)
    
    metrics = calculate_classification_metrics(y_true, y_pred, y_prob, classes)
    metrics["baseline_mode"] = baseline_mode
    return metrics

def main():
    parser = argparse.ArgumentParser(description="DeepTrace AI - Empirical Evaluation Pipeline")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to trained PyTorch weights checkpoint (.pth)")
    parser.add_argument("--data_dir", type=str, default="dataset", help="Dataset directory")
    parser.add_argument("--baseline", type=str, default="spatial_frequency_cross_attention",
                        choices=["spatial_only", "frequency_only", "residual_frequency", "spatial_frequency", "spatial_frequency_cross_attention"],
                        help="Baseline ablation mode")
    parser.add_argument("--output_json", type=str, default=str(current_dir / "evaluation_results.json"), help="Output JSON path")
    args = parser.parse_args()
    
    print("==================================================")
    print("DEEPTRACE AI - EMPIRICAL EVALUATION PIPELINE")
    print(f"Baseline Mode: {args.baseline}")
    print("==================================================")
    
    # Check for weights checkpoint
    checkpoint_path = Path(args.checkpoint) if args.checkpoint else None
    if not checkpoint_path or not checkpoint_path.is_file():
        print("\n" + "=" * 50)
        print("CHECKPOINT REQUIRED FOR EVALUATION")
        print("Status: Awaiting trained evaluation")
        print("Experimental Model: Not evaluated")
        print("Checkpoint: Not available")
        print("Zero synthetic or fake evaluation numbers are fabricated.")
        print("==================================================")
        
        status_payload = {
            "status": "awaiting_trained_evaluation",
            "experimental_model": {
                "status": "Not evaluated",
                "checkpoint": "Not available",
                "evaluation_status": "Awaiting trained evaluation",
                "message": "Evaluation requires a mounted, genuinely trained checkpoint."
            },
            "baseline_mode": args.baseline,
            "classes": ATTRIBUTION_CLASSES
        }
        with open(args.output_json, "w", encoding="utf-8") as f:
            json.dump(status_payload, f, indent=2)
        return
        
    # Check for dataset
    data_path = Path(args.data_dir)
    _, _, test_loader = get_dataloaders(data_path, batch_size=16)
    if test_loader is None or len(test_loader.dataset) == 0:
        print("\n" + "=" * 50)
        print("DATASET REQUIRED BEFORE TRAINING / EVALUATION")
        print(f"No test split found at: {data_path.resolve()}")
        print("==================================================")
        return
        
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DeepTraceAttributionNetwork(num_classes=len(ATTRIBUTION_CLASSES)).to(device)
    
    state_dict = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(state_dict)
    print(f"Loaded checkpoint: {checkpoint_path}")
    
    print("Executing evaluation...")
    results = evaluate_model(model, test_loader, device, baseline_mode=args.baseline)
    
    with open(args.output_json, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        
    print("\n" + "=" * 50)
    print(f"EVALUATION COMPLETED (Baseline: {args.baseline})")
    print(f"Accuracy:  {results.get('overall_accuracy', 0.0) * 100:.2f}%")
    print(f"Precision: {results.get('macro_precision', 0.0) * 100:.2f}%")
    print(f"Recall:    {results.get('macro_recall', 0.0) * 100:.2f}%")
    print(f"F1 Score:  {results.get('macro_f1', 0.0) * 100:.2f}%")
    if results.get('roc_auc'):
        print(f"ROC-AUC:   {results.get('roc_auc'):.4f}")
    print(f"Results saved to: {args.output_json}")
    print("==================================================")

if __name__ == "__main__":
    main()
