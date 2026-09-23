import cv2
import numpy as np
from typing import Tuple, List, Dict, Any

def detect_and_align_face(rgb_image: np.ndarray, target_size: int = 512) -> Tuple[np.ndarray, bool, int, List[Dict[str, int]]]:
    """
    Detect facial region in RGB image with cross-version OpenCV support.
    If a face is located, crops face with 20% margin and resizes to target_size x target_size.
    If no face is detected or on general non-facial synthetic media (e.g. Midjourney landscapes/objects),
    smoothly center-crops square ROI so frequency analysis proceeds without interruption.
    """
    img_h, img_w, _ = rgb_image.shape
    gray = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
    
    faces = ()
    
    # Try CascadeClassifier if available
    cascade_cls = getattr(cv2, 'CascadeClassifier', None)
    if cascade_cls is not None:
        try:
            cascade_path = getattr(cv2.data, 'haarcascades', '') + 'haarcascade_frontalface_default.xml'
            cascade = cascade_cls(cascade_path)
            detected = cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(60, 60)
            )
            if detected is not None and len(detected) > 0:
                faces = detected
        except Exception:
            faces = ()
            
    face_count = len(faces)
    bboxes = []
    
    if face_count > 0:
        largest_face = max(faces, key=lambda f: f[2] * f[3])
        x, y, w, h = largest_face
        
        for (fx, fy, fw, fh) in faces:
            bboxes.append({"x": int(fx), "y": int(fy), "w": int(fw), "h": int(fh)})
            
        margin_x = int(w * 0.2)
        margin_y = int(h * 0.2)
        
        x1 = max(0, x - margin_x)
        y1 = max(0, y - margin_y)
        x2 = min(img_w, x + w + margin_x)
        y2 = min(img_h, y + h + margin_y)
        
        face_roi = rgb_image[y1:y2, x1:x2]
        aligned = cv2.resize(face_roi, (target_size, target_size), interpolation=cv2.INTER_AREA)
        return aligned, True, face_count, bboxes
    else:
        # Standard center square crop for general generative media
        min_dim = min(img_h, img_w)
        start_y = (img_h - min_dim) // 2
        start_x = (img_w - min_dim) // 2
        cropped = rgb_image[start_y:start_y + min_dim, start_x:start_x + min_dim]
        aligned = cv2.resize(cropped, (target_size, target_size), interpolation=cv2.INTER_AREA)
        return aligned, False, 0, []
