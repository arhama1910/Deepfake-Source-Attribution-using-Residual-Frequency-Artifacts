# DeepTrace AI

## Deepfake Source Attribution Using Residual Frequency Artifacts

> **Multimedia Forensics & Source Attribution Research System**  
> *"Tracing Synthetic Media Beyond the Surface."*

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?logo=pytorch)](https://pytorch.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)](https://docker.com)

---

## 1. Project Overview

**DeepTrace AI** is an advanced multimedia digital forensics platform designed to attribute synthetic media (deepfakes, GANs, and Diffusion models) to their respective generative source architectures. 

While state-of-the-art generative models create visually imperceptible pixel modifications in the spatial RGB domain, their upsampling pipelines (transposed convolutions, sub-pixel convolution, and latent latent decoders) inevitably imprint **structural frequency-domain anomalies** and **high-pass residual noise traces**. DeepTrace AI decomposes images and video streams into spatial, residual, and frequency domains to extract forensic fingerprints and perform source attribution.

---

## 2. Research Objective

Traditional deepfake detectors focus on binary classification (*Real vs. Fake*) using standard spatial convolutional networks, which are notoriously vulnerable to semantic overfitting, adversarial perturbations, and social media compression.

DeepTrace AI addresses the **Source Attribution Problem**:
1. **Detection**: Is the media authentic or synthetically generated?
2. **Attribution**: Which generative architecture class (StyleGAN2, StyleGAN3, ProGAN, Stable Diffusion v1.5, SDXL, Latent Diffusion, Midjourney) produced the media?
3. **Temporal Invariance**: Are high-frequency spectral signatures consistent across video frames, or do they exhibit the temporal jitter characteristic of frame-by-frame synthesis?

---

## 3. System Architecture & Methodology

```
                 MEDIA INPUT (Image or Video)
                              │
                    ┌─────────┴─────────┐
                    │                   │
                  IMAGE               VIDEO
                    │                   │
                    │         Frame Sampling (8/16/32/64)
                    │                   │
                    └─────────┬─────────┘
                              ↓
                  FACE DETECTION & ROI ALIGNMENT
                    (OpenCV Facial / Square ROI)
                              ↓
                 RESIDUAL ARTIFACT EXTRACTION
             (SRM 3x3 Edge, Laplacian High-Pass)
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
              SPATIAL BRANCH      FREQUENCY BRANCH
              (RGB Feature Map)   (2D FFT + 2D DCT)
                    │                   │
                    └─────────┬─────────┘
                              ↓
              SPATIAL-FREQUENCY FEATURE FUSION
                (Cross-Attention Mechanism)
                              ↓
                  DUAL CLASSIFIER HEADS
             ┌────────────────┴────────────────┐
             ↓                                 ↓
       BINARY DETECTION               SOURCE ATTRIBUTION
      (Real vs Synthetic)            (Generator Family)
             └────────────────┬────────────────┘
                              ↓
             TEMPORAL COHERENCE (For Video Sequences)
                              ↓
           EXPLAINABLE AI & REPORT GENERATION (PDF)
```

### Core Algorithmic Components:
1. **Spatial Rich Models (SRM)**: 30-filter steganographic high-pass residual kernels isolate sub-pixel sensor and synthesis noise from underlying semantic content.
2. **2D Fast Fourier Transform (FFT)**: Log-scaled magnitude spectrum $S(u, v) = \log(1 + |F(u, v)|)$ paired with **Radial Power Profiles** (azimuthal averages across concentric frequency radii).
3. **2D Discrete Cosine Transform (DCT)**: Orthonormal Type-II 2D DCT partitions energy between macro-structural low frequencies and diagnostic high-frequency diagonal coefficients.
4. **Temporal Stability Metric**: For video, computes the inter-frame standard deviation of high-frequency energy ratio ($\Delta HF$) to quantify synthesis flicker.
5. **Cross-Attention Fusion**: Vision Transformer embeddings query frequency artifact feature representations before classification.

---

## 4. Research Integrity Standards

In accordance with strict scientific research ethics:
* **Zero Fabricated Confidences**: If trained neural network checkpoint weights are not mounted, the system operates in **Research Demo Mode**. Preprocessing, SRM filtering, 2D FFT, 2D DCT, and temporal consistency run with 100% mathematical fidelity, while the attribution head explicitly reports: `“Research Demo Mode: Preprocessing completed. Trained attribution model unavailable.”`
* **Model Attribution vs. Device Provenance**: The platform distinguishes between learned distribution alignment to a training dataset and physical hardware device provenance.
* **Bounded Explainable AI**: The LLM reporting layer strictly summarizes empirical numerical metrics and includes an explicit forensic legal admissibility disclaimer.

---

## 5. Technology Stack

### Backend
* **Language**: Python 3.11 / 3.14
* **Framework**: FastAPI (Asynchronous high-performance REST API)
* **Computer Vision**: OpenCV, NumPy, SciPy (`scipy.fftpack.dct`)
* **Deep Learning**: PyTorch (Vision Transformer & Frequency Branch architecture)
* **Database**: PostgreSQL (Production) / SQLite (Zero-config local development)
* **Reporting**: ReportLab (Vector-grade forensic PDF generation)
* **Storage**: Local filesystem abstraction with cloud S3-compatible interface

### Frontend
* **Core**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS (Dark forensic laboratory aesthetics)
* **Icons & UI**: Lucide React, Framer Motion
* **Visualizations**: Recharts (Radial energy curves, temporal timelines, band distributions)

---

## 6. Directory Structure

```
deeptrace-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── analyze.py        # Image and Video analysis endpoints
│   │   │   │   ├── history.py        # Case audit log & deletion
│   │   │   │   ├── report.py         # PDF forensic report download
│   │   │   │   ├── models.py         # Model registry & benchmark metrics
│   │   │   │   └── explain.py        # Grounded explainability endpoint
│   │   │   └── router.py             # API v1 master router
│   │   ├── core/
│   │   │   ├── config.py             # Configuration & environment variables
│   │   │   └── security.py           # MIME inspection, sanitization, size limits
│   │   ├── database/
│   │   │   ├── session.py            # SQLAlchemy session & engine
│   │   │   └── models.py             # Analysis, Prediction, Frequency, Frame models
│   │   ├── forensics/
│   │   │   ├── residual.py           # SRM edge, Laplacian, Gaussian HPF
│   │   │   ├── fft_analysis.py       # 2D FFT, magnitude spectrum, radial profile
│   │   │   ├── dct_analysis.py       # 2D DCT orthonormal basis energy ratios
│   │   │   ├── face_detection.py     # OpenCV face & square ROI alignment
│   │   │   └── video_processor.py    # Frame sampling & temporal jitter scoring
│   │   ├── ml/
│   │   │   ├── base.py               # Attribution model interface & class registry
│   │   │   ├── image_model.py        # ViT + Frequency Branch + Cross-Attention
│   │   │   └── video_model.py        # Video Swin + Temporal Pooling Head
│   │   ├── llm/
│   │   │   ├── base.py               # LLM provider interface
│   │   │   └── provider.py           # Deterministic explainer & OpenAI fallback
│   │   ├── reports/
│   │   │   └── pdf_generator.py      # ReportLab forensic case sheet generator
│   │   ├── storage/
│   │   │   ├── base.py               # Storage provider interface
│   │   │   └── local.py              # Local storage provider with static serving
│   │   └── main.py                   # FastAPI application entry point
│   ├── tests/
│   │   ├── test_forensics.py         # Mathematical unit tests (FFT, DCT, SRM)
│   │   └── test_api.py               # API endpoint & pipeline integration tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/Navbar.tsx     # Navigation & brand HUD
│   │   │   ├── common/Footer.tsx     # Disclaimer & research credits
│   │   │   ├── landing/HeroSection.tsx # Animated forensic canvas & workflow
│   │   │   ├── analyze/UploadZone.tsx # File dropzone & 13-stage live pipeline
│   │   │   ├── results/FourPanelViewer.tsx # Original, Residual, FFT, DCT
│   │   │   ├── results/FrequencyCharts.tsx # Recharts radial profiles & bands
│   │   │   ├── results/FrameTimeline.tsx # Video inter-frame consistency
│   │   │   ├── results/ExplainabilityCard.tsx # Grounded forensic summary
│   │   │   ├── results/ResultsDashboard.tsx # Master results dashboard
│   │   │   ├── methodology/MethodologyPage.tsx # Architecture diagram & math
│   │   │   ├── metrics/MetricsPage.tsx # Benchmark metrics & confusion matrix
│   │   │   ├── models/ModelsPage.tsx # Model registry & checkpoint status
│   │   │   └── history/HistoryPage.tsx # Forensic case archive & PDF download
│   │   ├── services/api.ts           # Typed API service
│   │   ├── types/forensics.ts        # TypeScript data structures
│   │   ├── App.tsx                   # Main state & view switcher
│   │   └── index.css                 # Dark forensic tokens & glassmorphism
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 7. Quickstart Installation Guide

### Prerequisites
* Python 3.11+
* Node.js v18+ and npm
* Git

### Option A: Local Development (Recommended)

#### 1. Setup Backend
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Run unit and integration tests
python -m pytest tests -v

# Launch FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be accessible at: `http://localhost:8000`  
Interactive OpenAPI documentation: `http://localhost:8000/docs`

#### 2. Setup Frontend
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Launch Vite development server
npm run dev
```
Frontend web application will be accessible at: `http://localhost:5173`

---

### Option B: Docker Compose (Full Stack with PostgreSQL)

```bash
# Build and launch all services (frontend, backend, postgres)
docker compose up --build
```
* **Frontend Web App**: `http://localhost:3000`
* **FastAPI Backend**: `http://localhost:8000`
* **PostgreSQL Database**: `localhost:5432`

---

## 8. Dataset Preparation & Model Training

To train the `DeepTraceAttributionNetwork` on your target research datasets:

### Supported Datasets:
1. **FaceForensics++ (FF++)**: Real YouTube faces, Deepfakes, Face2Face, FaceSwap, NeuralTextures.
2. **GenImage**: 1.3M images spanning BigGAN, Stable Diffusion v1.4, v1.5, Midjourney, VQDM.
3. **DiffusionForensics**: Pairwise comparisons across state-of-the-art latent and pixel diffusion models.

### Training Pipeline:
```python
# Pseudo-code for training iteration
for rgb_batch, labels in dataloader:
    # 1. Extract SRM residuals & 2D FFT / 2D DCT on CPU/GPU
    residuals = srm_filter_batch(rgb_batch)
    fft_maps = fft2d_batch(rgb_batch)
    dct_maps = dct2d_batch(rgb_batch)
    
    # 2. Concatenate frequency maps into 5-channel tensor
    freq_maps = torch.cat([residuals, fft_maps, dct_maps], dim=1)
    
    # 3. Forward pass through Spatial-Frequency Cross-Attention
    det_logits, attr_logits = model(rgb_batch, freq_maps)
    
    # 4. Multi-task loss
    loss = loss_det(det_logits, is_synthetic) + loss_attr(attr_logits, labels)
    loss.backward()
    optimizer.step()
```

---

## 9. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health check & storage status |
| `POST` | `/api/v1/analyze/image` | Upload image for dual-domain forensic analysis |
| `POST` | `/api/v1/analyze/video` | Upload video for multi-frame temporal analysis |
| `GET` | `/api/v1/analysis/{id}` | Fetch full analysis record and artifact URLs |
| `GET` | `/api/v1/analysis/{id}/status` | Quick polling endpoint for stage progress |
| `GET` | `/api/v1/analysis/{id}/report` | Download official PDF forensic case report |
| `POST` | `/api/v1/analysis/{id}/explain` | Request structured forensic explanation |
| `GET` | `/api/v1/history` | Query historical forensic case records |
| `DELETE` | `/api/v1/analysis/{id}` | Purge case record and clean stored artifacts |
| `GET` | `/api/v1/models` | Retrieve model registry, device, and classes |
| `GET` | `/api/v1/metrics` | Retrieve evaluation benchmark metrics |

---

## 10. Research Limitations & Future Work

* **Lossy Compression**: Intensive social media re-compression (WhatsApp, X, Instagram) acts as a low-pass filter, attenuating high-frequency spectral spikes. Future work explores adaptive de-quantization prior to FFT decomposition.
* **Adversarial Perturbations**: Anti-forensic noise filters deliberately injected during generation. Incorporating robust adversarial frequency training is an active research direction.
* **Hardware Device Provenance**: Attribution isolates generator architecture distributions and should not be conflated with physical sensor identification (PRNU).

---

## 11. Citation & Academic Credits

```bibtex
@article{deeptrace_ai_2026,
  title={DeepTrace AI: Deepfake Source Attribution Using Residual Frequency Artifacts},
  author={DeepTrace AI Research Group},
  year={2026},
  institution={Multimedia Forensics & Cybersecurity Research Group}
}
```

---
*Developed for research and educational purposes in digital media authenticity and source attribution.*
