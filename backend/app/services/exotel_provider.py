import uuid
import asyncio
from typing import Dict, Any, Optional
from .telephony_provider import TelephonyProvider

class MockExotelProvider(TelephonyProvider):
    """
    Mock implementation of Exotel provider for Phase 2 testing.
    Simulates API calls and returns dummy responses.
    """
    
    async def initiate_call(self, to_number: str, dialogue_flow_id: str, metadata: Dict[str, Any] = None) -> str:
        """Simulates initiating a call."""
        call_id = f"EXO-{uuid.uuid4().hex[:8].upper()}"
        print(f"[MockExotel] Initiating call to {to_number}, Call ID: {call_id}")
        return call_id

    async def get_call_status(self, provider_call_id: str) -> str:
        """Simulates getting call status."""
        return "IN_PROGRESS"

    async def play_audio_prompt(self, provider_call_id: str, audio_url: str) -> bool:
        print(f"[MockExotel] Playing audio {audio_url} on call {provider_call_id}")
        return True

    async def play_tts_prompt(self, provider_call_id: str, text: str, language: str) -> bool:
        print(f"[MockExotel] Playing TTS '{text}' ({language}) on call {provider_call_id}")
        return True

    async def gather_dtmf(self, provider_call_id: str, max_digits: int = 1, timeout_seconds: int = 5) -> bool:
        print(f"[MockExotel] Gathering DTMF on call {provider_call_id}")
        return True

    async def record_speech(self, provider_call_id: str, max_duration_seconds: int = 15) -> bool:
        print(f"[MockExotel] Recording speech on call {provider_call_id}")
        return True

    async def hangup_call(self, provider_call_id: str) -> bool:
        print(f"[MockExotel] Hanging up call {provider_call_id}")
        return True
