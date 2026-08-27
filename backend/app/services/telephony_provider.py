from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class TelephonyProvider(ABC):
    """
    Abstract base class for all telephony providers.
    Ensures that PRANSETU is not locked into a single vendor.
    """

    @abstractmethod
    async def initiate_call(self, to_number: str, dialogue_flow_id: str, metadata: Dict[str, Any] = None) -> str:
        """
        Initiates an outbound call.
        Returns the provider-specific call ID.
        """
        pass

    @abstractmethod
    async def get_call_status(self, provider_call_id: str) -> str:
        """
        Retrieves the current status of a call.
        """
        pass

    @abstractmethod
    async def play_audio_prompt(self, provider_call_id: str, audio_url: str) -> bool:
        """
        Plays a recorded audio prompt on an active call.
        """
        pass

    @abstractmethod
    async def play_tts_prompt(self, provider_call_id: str, text: str, language: str) -> bool:
        """
        Plays a Text-to-Speech prompt on an active call.
        """
        pass

    @abstractmethod
    async def gather_dtmf(self, provider_call_id: str, max_digits: int = 1, timeout_seconds: int = 5) -> bool:
        """
        Instructs the provider to gather DTMF keypad input from the user.
        """
        pass

    @abstractmethod
    async def record_speech(self, provider_call_id: str, max_duration_seconds: int = 15) -> bool:
        """
        Instructs the provider to record user speech.
        """
        pass

    @abstractmethod
    async def hangup_call(self, provider_call_id: str) -> bool:
        """
        Terminates the call.
        """
        pass
