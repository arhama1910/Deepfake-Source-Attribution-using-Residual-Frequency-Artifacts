import os
import sys
import hashlib
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Set, Any
from collections import defaultdict

import cv2
import numpy as np

# Ensure backend root is in sys.path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.ml.base import ATTRIBUTION_CLASSES

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}

class DatasetValidator:
    def __init__(self, data_dir: Path | str, expected_classes: Optional[List[str]] = None):
        self.data_dir = Path(data_dir).resolve()
        self.expected_classes = expected_classes or ATTRIBUTION_CLASSES
        self.expected_set = set(self.expected_classes)
        
        self.stats = {
            "total_files": 0,
            "corrupted_files": 0,
            "unsupported_files": 0,
            "duplicate_files": 0,
            "splits": defaultdict(lambda: defaultdict(int)),
            "resolutions": [],
            "video_durations": [],
            "corrupted_list": [],
            "unsupported_list": [],
            "missing_classes_by_split": {},
            "unrecognized_folders": set()
        }
        self.seen_hashes: Dict[str, Path] = {}

    def _file_hash(self, path: Path) -> str:
        hasher = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    def validate(self) -> Tuple[bool, List[str]]:
        errors = []
        if not self.data_dir.exists():
            errors.append(f"CRITICAL: Dataset directory '{self.data_dir}' does not exist.")
            return False, errors

        if not self.data_dir.is_dir():
            errors.append(f"CRITICAL: Dataset path '{self.data_dir}' is not a directory.")
            return False, errors

        # Determine split structure
        splits = ["train", "val", "test"]
        has_split_dirs = all((self.data_dir / s).is_dir() for s in splits)
        
        if has_split_dirs:
            target_splits = splits
        else:
            # Check if classes are directly in data_dir
            found_classes = [d.name for d in self.data_dir.iterdir() if d.is_dir()]
            matching_classes = [c for c in found_classes if c in self.expected_set]
            if len(matching_classes) > 0:
                target_splits = ["all"]
            else:
                errors.append(
                    f"CRITICAL: Dataset at '{self.data_dir}' does not contain expected splits ('train/', 'val/', 'test/') "
                    f"or class subdirectories matching expected classes."
                )
                return False, errors

        for split in target_splits:
            split_path = (self.data_dir / split) if split != "all" else self.data_dir
            present_classes: Set[str] = set()
            
            for child in split_path.iterdir():
                if not child.is_dir():
                    continue
                    
                cls_name = child.name
                if cls_name not in self.expected_set:
                    # Check case-insensitive
                    matched = next((c for c in self.expected_classes if c.lower() == cls_name.lower()), None)
                    if matched:
                        cls_name = matched
                    else:
                        self.stats["unrecognized_folders"].add(f"{split}/{cls_name}")
                        continue
                        
                present_classes.add(cls_name)
                
                # Scan files in class directory
                for file_path in child.iterdir():
                    if not file_path.is_file():
                        continue
                        
                    self.stats["total_files"] += 1
                    ext = file_path.suffix.lower()
                    
                    if ext in IMAGE_EXTENSIONS:
                        # Image inspection
                        try:
                            # Check duplicate hash
                            f_hash = self._file_hash(file_path)
                            if f_hash in self.seen_hashes:
                                self.stats["duplicate_files"] += 1
                            else:
                                self.seen_hashes[f_hash] = file_path
                                
                            img = cv2.imread(str(file_path))
                            if img is None:
                                self.stats["corrupted_files"] += 1
                                self.stats["corrupted_list"].append(str(file_path))
                            else:
                                h, w = img.shape[:2]
                                self.stats["resolutions"].append((w, h))
                                self.stats["splits"][split][cls_name] += 1
                        except Exception:
                            self.stats["corrupted_files"] += 1
                            self.stats["corrupted_list"].append(str(file_path))
                            
                    elif ext in VIDEO_EXTENSIONS:
                        # Video inspection
                        try:
                            f_hash = self._file_hash(file_path)
                            if f_hash in self.seen_hashes:
                                self.stats["duplicate_files"] += 1
                            else:
                                self.seen_hashes[f_hash] = file_path
                                
                            cap = cv2.VideoCapture(str(file_path))
                            if not cap.isOpened():
                                self.stats["corrupted_files"] += 1
                                self.stats["corrupted_list"].append(str(file_path))
                            else:
                                fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
                                count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                                dur = count / fps if fps > 0 else 0
                                self.stats["video_durations"].append(dur)
                                self.stats["splits"][split][cls_name] += 1
                            cap.release()
                        except Exception:
                            self.stats["corrupted_files"] += 1
                            self.stats["corrupted_list"].append(str(file_path))
                    else:
                        self.stats["unsupported_files"] += 1
                        self.stats["unsupported_list"].append(str(file_path))

            # Missing classes check
            missing = self.expected_set - present_classes
            if missing:
                self.stats["missing_classes_by_split"][split] = sorted(list(missing))
                errors.append(f"ERROR: Split '{split}' is missing classes: {sorted(list(missing))}")

        # Total sample validation
        total_valid = sum(sum(cls_dict.values()) for cls_dict in self.stats["splits"].values())
        if total_valid == 0:
            errors.append("ERROR: Zero valid image or video samples found across all classes.")

        # Class imbalance calculation
        for split, counts in self.stats["splits"].items():
            if counts:
                vals = list(counts.values())
                max_c = max(vals)
                min_c = min(vals)
                ratio = max_c / max(min_c, 1)
                if ratio > 5.0:
                    errors.append(f"WARNING: Severe class imbalance in '{split}' (ratio: {ratio:.1f}x between max {max_c} and min {min_c}).")

        is_valid = len([e for e in errors if e.startswith("CRITICAL") or e.startswith("ERROR")]) == 0
        return is_valid, errors

    def print_report(self, is_valid: bool, errors: List[str]):
        print("\n" + "=" * 65)
        print("DEEPTRACE AI — DATASET CONTRACT VALIDATION REPORT")
        print("=" * 65)
        print(f"Dataset Path:    {self.data_dir}")
        print(f"Total Files:     {self.stats['total_files']}")
        print(f"Corrupted Files: {self.stats['corrupted_files']}")
        print(f"Unsupported:     {self.stats['unsupported_files']}")
        print(f"Duplicates:      {self.stats['duplicate_files']}")
        print("-" * 65)
        print("SAMPLE BREAKDOWN PER CLASS & SPLIT:")
        print(f"{'Class Name':<24} | {'Train':<8} | {'Val':<8} | {'Test':<8} | {'Total':<8}")
        print("-" * 65)
        
        splits = self.stats["splits"]
        for cls_name in self.expected_classes:
            tr = splits.get("train", {}).get(cls_name, 0)
            va = splits.get("val", {}).get(cls_name, 0)
            te = splits.get("test", {}).get(cls_name, 0)
            al = splits.get("all", {}).get(cls_name, 0)
            total = (tr + va + te) if "all" not in splits else al
            
            tr_str = str(tr) if "all" not in splits else "-"
            va_str = str(va) if "all" not in splits else "-"
            te_str = str(te) if "all" not in splits else "-"
            print(f"{cls_name:<24} | {tr_str:<8} | {va_str:<8} | {te_str:<8} | {total:<8}")
            
        print("-" * 65)
        
        if self.stats["resolutions"]:
            widths = [r[0] for r in self.stats["resolutions"]]
            heights = [r[1] for r in self.stats["resolutions"]]
            print(f"Image Resolution Stats:  Min: {min(widths)}x{min(heights)} | Max: {max(widths)}x{max(heights)} | Mean: {int(np.mean(widths))}x{int(np.mean(heights))}")
            
        if self.stats["video_durations"]:
            durs = self.stats["video_durations"]
            print(f"Video Duration Stats:    Total: {len(durs)} | Mean Duration: {np.mean(durs):.2f}s | Min: {min(durs):.2f}s | Max: {max(durs):.2f}s")

        if self.stats["unrecognized_folders"]:
            print(f"Unrecognized Folders:    {list(self.stats['unrecognized_folders'])}")
            
        print("-" * 65)
        if errors:
            print("VALIDATION ISSUES DETECTED:")
            for err in errors:
                print(f"  • {err}")
            print("-" * 65)
            
        status_str = "VALID (READY FOR TRAINING)" if is_valid else "INVALID (DATASET REQUIRED BEFORE TRAINING)"
        print(f"VALIDATION VERDICT: {status_str}")
        print("=" * 65 + "\n")

def validate_dataset_structure(data_dir: Path | str, strict: bool = True) -> Tuple[bool, Dict[str, Any]]:
    """Convenience functional interface for programmatic dataset validation."""
    validator = DatasetValidator(data_dir)
    is_valid, errors = validator.validate()
    stats = dict(validator.stats)
    stats["errors"] = errors
    stats["train_count"] = sum(validator.stats["splits"].get("train", {}).values())
    stats["val_count"] = sum(validator.stats["splits"].get("val", {}).values())
    stats["test_count"] = sum(validator.stats["splits"].get("test", {}).values())
    stats["missing_classes"] = validator.stats.get("missing_classes_by_split", {})
    return is_valid, stats

def main():
    parser = argparse.ArgumentParser(description="DeepTrace AI - Dataset Contract Validator")
    parser.add_argument("--data_dir", type=str, default="datasets/deeptrace", help="Path to dataset directory")
    args = parser.parse_args()
    
    # Check fallback paths if default not found
    target_path = Path(args.data_dir)
    if not target_path.exists():
        fallback = Path("dataset")
        if fallback.exists():
            target_path = fallback
            
    validator = DatasetValidator(target_path)
    is_valid, errors = validator.validate()
    validator.print_report(is_valid, errors)
    
    if not is_valid:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
