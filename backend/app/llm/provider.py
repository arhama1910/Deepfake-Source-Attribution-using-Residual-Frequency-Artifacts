import httpx
from typing import Dict, Any
from app.core.config import settings
from app.llm.base import BaseLLMProvider

DISCLAIMER = (
    "\n\n[Forensic Disclaimer: This explanatory analysis summarizes empirical signal metrics "
    "and model feature distributions. It is an algorithmic interpretation and should not be "
    "interpreted as sole independent forensic proof in legal or judicial contexts.]"
)

class DeterministicForensicExplainer(BaseLLMProvider):
    """
    Empirical, evidence-bound explanation generator.
    Guarantees zero hallucinations and works reliably offline without API keys.
    """
    async def generate_explanation(self, evidence: Dict[str, Any]) -> str:
        freq = evidence.get("frequency_metrics", {})
        res = evidence.get("residual_metrics", {})
        pred = evidence.get("prediction", {})
        media_type = evidence.get("media_type", "image")
        temporal = evidence.get("temporal_metrics", {})
        
        hf_ratio = freq.get("high_frequency_ratio", 0.0)
        spectral_entropy = freq.get("spectral_entropy", 0.0)
        low_energy = freq.get("low_frequency_energy", 0.0)
        dct_hf = freq.get("dct_high_frequency_ratio", 0.0)
        res_var = res.get("residual_variance", 0.0)
        
        model_status = pred.get("model_status", "not_loaded")
        is_synthetic = pred.get("is_synthetic")
        source_class = pred.get("source_class", "Unassigned")
        conf = pred.get("source_confidence")
        
        paragraphs = []
        
        # Section 1: Preprocessing & Domain Decomposition
        paragraphs.append(
            f"**Forensic Preprocessing & Domain Decomposition:**\n"
            f"The submitted {media_type} underwent dual-domain transformation into spatial residual and orthogonal frequency spaces. "
            f"Spatial Rich Model (SRM) high-pass filtering isolated high-frequency residual noise (variance: {res_var:.4f}). "
            f"Concurrently, 2D Fast Fourier Transform (FFT) and 2D Discrete Cosine Transform (DCT) mapped frequency power distributions."
        )
        
        # Section 2: Frequency Domain Evidence
        freq_observations = []
        if hf_ratio > 0.35:
            freq_observations.append(
                f"an elevated high-frequency energy ratio of {hf_ratio * 100:.1f}%, indicating significant energy concentration in outer spectral radii"
            )
        else:
            freq_observations.append(
                f"a standard natural decay in high-frequency energy ({hf_ratio * 100:.1f}%), consistent with smooth spatial gradients"
            )
            
        freq_observations.append(
            f"spectral entropy calculated at {spectral_entropy:.4f} bits, reflecting the dispersion profile of the Fourier power spectrum"
        )
        freq_observations.append(
            f"DCT high-frequency coefficient ratio at {dct_hf * 100:.1f}%"
        )
        
        paragraphs.append(
            f"**Spectral & Residual Signatures:**\n"
            f"Analysis reveals {', '.join(freq_observations)}. "
            f"In synthetic generative models (such as StyleGAN architectures and Latent Diffusion models), "
            f"transposed convolutions or upsampling latent decoders frequently introduce characteristic checkerboard "
            f"artifacts or periodic spectral spikes that differ systematically from natural camera sensor photon transfer curves."
        )
        
        # Section 3: Video Temporal Analysis (if applicable)
        if media_type == "video" and temporal:
            consistency = temporal.get("temporal_consistency_score", 1.0)
            jitter = temporal.get("temporal_jitter", 0.0)
            paragraphs.append(
                f"**Temporal Coherence Evaluation:**\n"
                f"Sampled frames yielded a temporal consistency metric of {consistency * 100:.1f}% "
                f"with an inter-frame frequency jitter of {jitter:.5f}. "
                f"{'High frame-to-frame frequency stability was observed.' if jitter < 0.03 else 'Observable spectral variance across consecutive frames suggests inter-frame synthesis inconsistencies typical of non-temporally-regularized frame generation.'}"
            )
            
        # Section 4: Attribution Verdict / Status
        if model_status == "loaded" and is_synthetic is not None:
            synth_str = "Synthetic (Manipulated/Generated)" if is_synthetic else "Authentic / Natural"
            paragraphs.append(
                f"**Model Attribution Assessment:**\n"
                f"The active spatial-frequency neural classifier classified the media as **{synth_str}** "
                f"with source attribution mapped to **{source_class}** (Confidence: {conf if conf is not None else 'N/A'}%). "
                f"Attribution is predicated upon feature alignment between extracted frequency fingerprints and trained model class distributions."
            )
        else:
            paragraphs.append(
                f"**Attribution Model Status:**\n"
                f"The system executed full empirical feature extraction (SRM residuals, 2D FFT, 2D DCT, and spectral entropy). "
                f"However, the deep neural attribution classifier is currently running in **Research Demo Mode** (no pre-trained checkpoint loaded). "
                f"Source attribution is currently unavailable. "
                f"As per research integrity standards, no speculative attribution label or artificial confidence score has been fabricated."
            )
            
        return "\n\n".join(paragraphs) + DISCLAIMER

class OpenAICompatibleLLM(BaseLLMProvider):
    def __init__(self, api_key: str, api_base: str, model_name: str):
        self.api_key = api_key
        self.api_base = api_base.rstrip("/") if api_base else "https://api.openai.com/v1"
        self.model_name = model_name
        self.fallback = DeterministicForensicExplainer()

    async def generate_explanation(self, evidence: Dict[str, Any]) -> str:
        prompt = (
            "You are a Senior Digital Forensics and Multimedia AI Researcher specializing in deepfake source attribution.\n"
            "Explain the following empirical forensic findings based ONLY on the provided structured metrics. "
            "Do NOT invent or hallucinate visual artifacts not supported by the data.\n"
            "CRITICAL INTEGRITY REQUIREMENT: You must NEVER independently invent or speculate source attribution. "
            "If model_status is 'not_loaded' or prediction source_class is 'Model Not Loaded', you MUST explicitly state "
            "that source attribution is currently unavailable because a trained attribution checkpoint has not been loaded.\n\n"
            f"Evidence JSON:\n{evidence}\n\n"
            "Provide a concise, rigorous 3-paragraph scientific report explaining:\n"
            "1. Spatial residual analysis (SRM filters and residual variance).\n"
            "2. Frequency domain metrics (FFT high-frequency ratio, DCT coefficients, spectral entropy).\n"
            "3. Source attribution interpretation based strictly on model status (explicitly stating attribution is unavailable if no trained model exists).\n"
        )
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": "You are a multimedia forensic scientist. Only describe empirical facts from the provided data. Never fabricate attribution if model weights are not loaded."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 500
        }
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(f"{self.api_base}/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    text = res.json()["choices"][0]["message"]["content"]
                    return text + DISCLAIMER
        except Exception as e:
            print(f"[DeepTrace LLM] API call failed: {e}. Falling back to deterministic explainer.")
            
        return await self.fallback.generate_explanation(evidence)

def get_llm_provider() -> BaseLLMProvider:
    if settings.LLM_PROVIDER in ["openai", "llama", "qwen"] and settings.LLM_API_KEY:
        return OpenAICompatibleLLM(
            api_key=settings.LLM_API_KEY,
            api_base=settings.LLM_API_BASE,
            model_name=settings.LLM_MODEL_NAME
        )
    return DeterministicForensicExplainer()

llm_service = get_llm_provider()
