import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

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
from app.ml.dataset import get_dataloaders, DeepTraceDataset

def calculate_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray],
    classes: List[str]
) -> Dict[str, Any]:
    """
    Compute rigorous empirical evaluation metrics:
    Accuracy, Macro Precision, Macro Recall, Macro F1, Per-Class breakdown, and Confusion Matrix.
    """
    n_classes = len(classes)
    total_samples = len(y_true)
    if total_samples == 0:
        return {
            "overall_accuracy": 0.0,
            "macro_precision": 0.0,
            "macro_recall": 0.0,
            "macro_f1": 0.0,
            "total_evaluated_samples": 0,
            "per_class_metrics": {},
            "confusion_matrix": []
        }
        
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
    
    for i, cls_name in enumerate(classes):
        tp = conf_matrix[i, i]
        fp = conf_matrix[:, i].sum() - tp
        fn = conf_matrix[i, :].sum() - tp
        support = int(conf_matrix[i, :].sum())
        
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
    bin_tp = int(np.sum((y_true_binary == 1) & (y_pred_binary == 1)))
    bin_fp = int(np.sum((y_true_binary == 0) & (y_pred_binary == 1)))
    bin_fn = int(np.sum((y_true_binary == 1) & (y_pred_binary == 0)))
    bin_tn = int(np.sum((y_true_binary == 0) & (y_pred_binary == 0)))
    
    bin_acc = float((bin_tp + bin_tn) / total_samples) if total_samples > 0 else 0.0
    bin_prec = float(bin_tp / (bin_tp + bin_fp)) if (bin_tp + bin_fp) > 0 else 0.0
    bin_rec = float(bin_tp / (bin_tp + bin_fn)) if (bin_tp + bin_fn) > 0 else 0.0
    bin_f1 = float(2 * bin_prec * bin_rec / (bin_prec + bin_rec)) if (bin_prec + bin_rec) > 0 else 0.0
    
    roc_auc = None
    try:
        from sklearn.metrics import roc_auc_score
        if y_prob is not None and len(np.unique(y_true)) > 1 and y_prob.shape[1] == n_classes:
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
            "tp": bin_tp,
            "fp": bin_fp,
            "tn": bin_tn,
            "fn": bin_fn
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
    if baseline_mode == "spatial_only":
        return rgb, torch.zeros_like(freq)
    elif baseline_mode == "frequency_only":
        return torch.zeros_like(rgb), freq
    elif baseline_mode == "residual_frequency":
        masked_freq = torch.zeros_like(freq)
        masked_freq[:, :3, :, :] = freq[:, :3, :, :]
        return torch.zeros_like(rgb), masked_freq
    else:
        return rgb, freq

def evaluate_loader(
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

def generate_human_readable_report(
    eval_results: Dict[str, Any],
    split_name: str,
    checkpoint_desc: str,
    dataset_desc: str
) -> str:
    """Generate a clean, structured human-readable evaluation report."""
    classes = eval_results.get("classes", ATTRIBUTION_CLASSES)
    lines = []
    lines.append("=" * 70)
    lines.append(f"DEEPTRACE AI — HELD-OUT EVALUATION REPORT [{split_name.upper()}]")
    lines.append("=" * 70)
    lines.append(f"Dataset:    {dataset_desc}")
    lines.append(f"Checkpoint: {checkpoint_desc}")
    lines.append(f"Split:      {split_name.upper()} (Zero leakage with validation or training)")
    lines.append(f"Samples:    {eval_results.get('total_evaluated_samples', 0)}")
    lines.append("-" * 70)
    lines.append(f"Overall Accuracy:  {eval_results.get('overall_accuracy', 0.0) * 100:.2f}%")
    lines.append(f"Macro Precision:   {eval_results.get('macro_precision', 0.0) * 100:.2f}%")
    lines.append(f"Macro Recall:      {eval_results.get('macro_recall', 0.0) * 100:.2f}%")
    lines.append(f"Macro F1 Score:    {eval_results.get('macro_f1', 0.0) * 100:.2f}%")
    if eval_results.get("roc_auc") is not None:
        lines.append(f"Macro ROC-AUC:     {eval_results.get('roc_auc'):.4f}")
        
    lines.append("-" * 70)
    lines.append("BINARY DETECTION (Real vs Synthetic):")
    bin_m = eval_results.get("binary_detection", {})
    lines.append(f"  Accuracy:  {bin_m.get('accuracy', 0.0) * 100:.2f}%")
    lines.append(f"  Precision: {bin_m.get('precision', 0.0) * 100:.2f}%")
    lines.append(f"  Recall:    {bin_m.get('recall', 0.0) * 100:.2f}%")
    lines.append(f"  F1 Score:  {bin_m.get('f1_score', 0.0) * 100:.2f}%")
    lines.append(f"  Counts:    TP={bin_m.get('tp', 0)}, FP={bin_m.get('fp', 0)}, TN={bin_m.get('tn', 0)}, FN={bin_m.get('fn', 0)}")
    
    lines.append("-" * 70)
    lines.append("PER-CLASS EVALUATION BREAKDOWN:")
    lines.append(f"  {'Class':<22} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    lines.append("  " + "-" * 66)
    
    per_class = eval_results.get("per_class_metrics", {})
    for cls_name in classes:
        m = per_class.get(cls_name, {})
        prec_str = f"{m.get('precision', 0.0)*100:.1f}%"
        rec_str = f"{m.get('recall', 0.0)*100:.1f}%"
        f1_str = f"{m.get('f1_score', 0.0)*100:.1f}%"
        sup_str = str(m.get('support', 0))
        lines.append(f"  {cls_name:<22} | {prec_str:<10} | {rec_str:<10} | {f1_str:<10} | {sup_str:<8}")
        
    lines.append("-" * 70)
    lines.append("CONFUSION MATRIX (Rows = Ground Truth, Columns = Predicted):")
    cm = eval_results.get("confusion_matrix", [])
    if cm:
        header = " " * 18 + " ".join([f"{c[:5]:>6}" for c in classes])
        lines.append(header)
        for i, row in enumerate(cm):
            cls_label = classes[i] if i < len(classes) else f"C{i}"
            row_str = " ".join([f"{val:>6}" for val in row])
            lines.append(f"  {cls_label[:15]:<16}: {row_str}")
            
    lines.append("=" * 70)
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="DeepTrace AI — Empirical Evaluation Pipeline")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to trained PyTorch weights checkpoint (.pt/.pth)")
    parser.add_argument("--data_dir", type=str, default=None, help="Dataset directory")
    parser.add_argument("--split", type=str, default="test", choices=["test", "val", "train", "all"],
                        help="Data split to evaluate ('test', 'val', 'train', or 'all')")
    parser.add_argument("--baseline", type=str, default="spatial_frequency_cross_attention",
                        choices=["spatial_only", "frequency_only", "residual_frequency", "spatial_frequency", "spatial_frequency_cross_attention"],
                        help="Baseline ablation mode")
    parser.add_argument("--output_dir", type=str, default="reports", help="Base output directory for reports")
    args = parser.parse_args()
    
    print("==================================================")
    print("DEEPTRACE AI — EMPIRICAL EVALUATION PIPELINE")
    print(f"Target Split:  {args.split.upper()}")
    print(f"Baseline Mode: {args.baseline}")
    print("==================================================")
    
    # Locate checkpoint
    candidate_checkpoints = []
    if args.checkpoint:
        candidate_checkpoints.append(Path(args.checkpoint))
    candidate_checkpoints.extend([
        Path("models/image/best.pt"),
        Path("backend/models/image/best.pt"),
        current_dir.parent.parent / "models" / "image" / "best.pt",
        Path("checkpoints/deeptrace_best.pth")
    ])
    
    checkpoint_path = None
    for cp in candidate_checkpoints:
        if cp and cp.is_file():
            checkpoint_path = cp
            break
            
    metrics_dir = Path(args.output_dir) / "metrics"
    eval_reports_dir = Path(args.output_dir) / "evaluation"
    metrics_dir.mkdir(parents=True, exist_ok=True)
    eval_reports_dir.mkdir(parents=True, exist_ok=True)
    
    if not checkpoint_path:
        print("\n" + "=" * 55)
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
                "message": "Evaluation requires a genuinely trained checkpoint."
            },
            "baseline_mode": args.baseline,
            "classes": ATTRIBUTION_CLASSES
        }
        with open(metrics_dir / "evaluation_test.json", "w", encoding="utf-8") as f:
            json.dump(status_payload, f, indent=2)
        return
        
    # Locate dataset
    data_dir_candidates = []
    if args.data_dir:
        data_dir_candidates.append(Path(args.data_dir))
    data_dir_candidates.extend([
        Path("datasets/deeptrace"),
        Path("dataset"),
        current_dir.parent.parent / "datasets" / "deeptrace"
    ])
    
    data_path = None
    for dp in data_dir_candidates:
        if dp and dp.is_dir():
            data_path = dp
            break
            
    if not data_path:
        print("\n" + "=" * 55)
        print("DATASET REQUIRED BEFORE EVALUATION")
        print("Expected contract structure:")
        print("  datasets/deeptrace/test/<class_name>/*.jpg")
        print("==================================================")
        return
        
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device:     {device} ({'CUDA GPU Acceleration' if device.type == 'cuda' else 'CPU Host'})")
    print(f"Checkpoint: {checkpoint_path.resolve()}")
    print(f"Dataset:    {data_path.resolve()}")
    
    # Load model
    model = DeepTraceAttributionNetwork(num_classes=len(ATTRIBUTION_CLASSES)).to(device)
    raw_ckpt = torch.load(checkpoint_path, map_location=device)
    if isinstance(raw_ckpt, dict) and "state_dict" in raw_ckpt:
        state_dict = raw_ckpt["state_dict"]
        classes = raw_ckpt.get("classes", ATTRIBUTION_CLASSES)
    elif isinstance(raw_ckpt, dict):
        state_dict = raw_ckpt
        classes = ATTRIBUTION_CLASSES
    else:
        print(f"Error: Invalid checkpoint file format at {checkpoint_path}")
        return
        
    model.load_state_dict(state_dict)
    model.eval()
    print("Checkpoint loaded successfully.\n")
    
    splits_to_eval = ["test"] if args.split == "test" else (["val"] if args.split == "val" else (["train"] if args.split == "train" else ["train", "val", "test"]))
    
    all_results = {}
    for split in splits_to_eval:
        dataset = DeepTraceDataset(data_path, split=split, target_size=512, augment=False, classes=classes)
        if len(dataset) == 0:
            print(f"Warning: No samples found for split '{split}'. Skipping.")
            continue
            
        loader = torch.utils.data.DataLoader(dataset, batch_size=16, shuffle=False)
        print(f"--- EVALUATING {split.upper()} SET ({len(dataset)} samples) ---")
        res = evaluate_loader(model, loader, device, baseline_mode=args.baseline, classes=classes)
        all_results[split] = res
        
        print(f"[{split.upper()}] Accuracy:  {res.get('overall_accuracy', 0.0) * 100:.2f}%")
        print(f"[{split.upper()}] Macro F1:  {res.get('macro_f1', 0.0) * 100:.2f}%")
        
        # Save split-specific JSON
        json_path = metrics_dir / f"evaluation_{split}.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(res, f, indent=2)
            
        # Generate human-readable report for test or evaluated split
        human_report = generate_human_readable_report(
            res,
            split_name=split,
            checkpoint_desc=str(checkpoint_path.name),
            dataset_desc=str(data_path)
        )
        report_txt_path = eval_reports_dir / f"evaluation_report_{split}.txt"
        with open(report_txt_path, "w", encoding="utf-8") as f:
            f.write(human_report)
            
        if split == "test":
            # Also save default evaluation_report.txt for test set
            with open(eval_reports_dir / "evaluation_report.txt", "w", encoding="utf-8") as f:
                f.write(human_report)
            print(f"\nSaved held-out test report to:\n  - {json_path}\n  - {report_txt_path}")
            print(human_report)

    if len(splits_to_eval) > 1 and all_results:
        combined_path = metrics_dir / "evaluation_all_splits.json"
        with open(combined_path, "w", encoding="utf-8") as f:
            json.dump(all_results, f, indent=2)
        print(f"\nAll split metrics saved to {combined_path}")

if __name__ == "__main__":
    main()
