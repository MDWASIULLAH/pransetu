from typing import Dict, Any
from supabase import Client

class VoiceLanguageCapabilityService:
    """
    Evaluates whether a specific Indian language has TTS/STT capabilities.
    If not, provides the fallback strategy (e.g., recorded audio or DTMF-only).
    NEVER silently defaults to English.
    """
    def __init__(self, supabase: Client):
        self.supabase = supabase

    def get_capabilities(self, language_code: str) -> Dict[str, Any]:
        """
        Queries the database for language capabilities.
        Example return:
        {
            "language_code": "or",
            "has_tts": true,
            "has_stt": true,
            "provider": "sarvam_ai",
            "fallback_mode": "DTMF_ONLY"
        }
        """
        response = self.supabase.table("voice_language_capabilities").select("*").eq("language_code", language_code).execute()
        if not response.data:
            # If the language is totally unknown, strictly enforce DTMF fallback
            return {
                "language_code": language_code,
                "has_tts": False,
                "has_stt": False,
                "has_live_voice": False,
                "provider": "unknown",
                "fallback_mode": "DTMF_ONLY"
            }
        return response.data[0]

    def determine_voice_mode(self, language_code: str) -> str:
        """
        Returns the optimal voice mode to use for this call (e.g., "LIVE_AI", "RECORDED_AUDIO", "DTMF_ONLY").
        """
        caps = self.get_capabilities(language_code)
        
        if caps["has_tts"] and caps["has_stt"]:
            return "LIVE_AI"
        
        if caps["fallback_mode"]:
            return caps["fallback_mode"]
            
        return "DTMF_ONLY"
