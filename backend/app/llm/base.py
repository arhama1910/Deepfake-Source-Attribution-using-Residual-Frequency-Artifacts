from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_explanation(self, evidence: Dict[str, Any]) -> str:
        """
        Generate a forensic narrative explaining the empirical evidence.
        Must strictly reference supplied evidence and avoid hallucinating unseen artifacts.
        """
        pass
