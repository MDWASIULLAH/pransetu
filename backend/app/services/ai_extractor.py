import json
from typing import Dict, Any

class AIExtractorService:
    """
    Extracts structured emergency intents from free-form speech text.
    Uses strict JSON schema enforcement to ensure the AI NEVER invents information
    and NEVER makes autonomous dispatch decisions.
    """
    
    def extract_intent(self, user_speech_text: str) -> Dict[str, Any]:
        """
        Simulates an LLM call with strict JSON output schema.
        In production, this wraps Gemini 1.5 Flash or Claude 3 Haiku with 
        function calling / JSON mode enabled.
        """
        print(f"[AIExtractor] Analyzing speech: {user_speech_text}")
        
        # Simulated extraction based on keywords for the mock implementation
        lower_speech = user_speech_text.lower()
        
        extracted = {
            "trapped": "trapped" in lower_speech,
            "injured": "injured" in lower_speech or "hurt" in lower_speech,
            "children_present": "child" in lower_speech or "children" in lower_speech,
            "elderly_person_present": "mother" in lower_speech or "elderly" in lower_speech,
            "immediate_danger": "danger" in lower_speech or "trapped" in lower_speech
        }
        
        # Calculate severity based on policy rules
        severity = "NEEDS_ASSISTANCE"
        if extracted["trapped"] or extracted["injured"]:
            severity = "CRITICAL"
            
        confidence = 0.92 # Mock confidence score
        
        return {
            "severity": severity,
            "entities": extracted,
            "confidence": confidence,
            "source_text": user_speech_text
        }
