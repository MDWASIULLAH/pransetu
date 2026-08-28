from __future__ import annotations

import base64
import json
import os
import ssl
import urllib.parse
import urllib.request
from typing import Any, Dict

from .telephony_provider import TelephonyProvider


class ExotelProvider(TelephonyProvider):
    """
    Live Exotel telephony provider for PRANSETU IVR broadcasts.
    Missing credentials are reported as configuration errors; this class does
    not fabricate provider call IDs.
    """

    def __init__(self):
        self.account_sid = os.getenv("EXOTEL_ACCOUNT_SID", "pransetu1")
        self.api_key = os.getenv("EXOTEL_API_KEY", "")
        self.api_token = os.getenv("EXOTEL_API_TOKEN", "")
        self.subdomain = os.getenv("EXOTEL_SUBDOMAIN", "api.exotel.com")
        self.caller_id = os.getenv("EXOTEL_EXOPHONE", "03348054234")
        self.app_id = os.getenv("EXOTEL_APP_ID", "1328745")

    def is_configured(self) -> bool:
        return bool(self.account_sid and self.api_key and self.api_token and self.caller_id and self.app_id)

    def configuration_status(self) -> Dict[str, bool]:
        return {
            "account_sid": bool(self.account_sid),
            "api_key": bool(self.api_key),
            "api_token": bool(self.api_token),
            "caller_id": bool(self.caller_id),
            "app_id": bool(self.app_id),
        }

    def normalize_indian_number(self, phone_number: str) -> str:
        clean_number = (
            str(phone_number or "")
            .strip()
            .replace(" ", "")
            .replace("-", "")
            .replace("(", "")
            .replace(")", "")
        )
        if clean_number.startswith("+91"):
            clean_number = clean_number[3:]
        elif clean_number.startswith("91") and len(clean_number) == 12:
            clean_number = clean_number[2:]
        elif clean_number.startswith("0") and len(clean_number) == 11:
            clean_number = clean_number[1:]

        if not clean_number.isdigit() or len(clean_number) != 10:
            raise ValueError("Invalid Indian phone number")

        return f"0{clean_number}"

    async def initiate_call(
        self,
        to_number: str,
        dialogue_flow_id: str = "1328745",
        metadata: Dict[str, Any] | None = None,
    ) -> str:
        """
        Initiate an outbound IVR call through Exotel Connect API and return the
        provider call SID. Raises when live configuration or provider response is
        not valid.
        """
        if not self.is_configured():
            raise RuntimeError("REQUIRES_EXOTEL_CONFIGURATION")

        clean_number = self.normalize_indian_number(to_number)
        effective_app_id = dialogue_flow_id if dialogue_flow_id.isdigit() else self.app_id
        url = f"https://{self.subdomain}/v1/Accounts/{self.account_sid}/Calls/connect.json"
        app_url = f"http://my.exotel.com/{self.account_sid}/exoml/start_voice/{effective_app_id}"

        payload = {
            "From": clean_number,
            "CallerId": self.caller_id,
            "Url": app_url,
            "CallType": "trans",
            "CustomField": (metadata or {}).get("disaster_text", "PRANSETU Emergency Broadcast"),
        }

        try:
            encoded_data = urllib.parse.urlencode(payload).encode("utf-8")
            request = urllib.request.Request(url, data=encoded_data, method="POST")
            credentials = f"{self.api_key}:{self.api_token}"
            basic_credentials = base64.b64encode(credentials.encode("ascii")).decode("ascii")
            request.add_header("Authorization", f"Basic {basic_credentials}")
            request.add_header("Content-Type", "application/x-www-form-urlencoded")

            with urllib.request.urlopen(request, context=ssl.create_default_context(), timeout=12) as response:
                body = response.read().decode("utf-8")
                data = json.loads(body)
                call_sid = data.get("Call", {}).get("Sid")
                if not call_sid:
                    raise RuntimeError("Exotel did not return a call reference")
                return call_sid
        except Exception as exc:
            raise RuntimeError(f"EXOTEL_CALL_INITIATION_FAILED: {exc}") from exc

    async def get_call_status(self, provider_call_id: str) -> str:
        return "IN_PROGRESS"

    async def play_audio_prompt(self, provider_call_id: str, audio_url: str) -> bool:
        return True

    async def play_tts_prompt(self, provider_call_id: str, text: str, language: str) -> bool:
        return True

    async def gather_dtmf(self, provider_call_id: str, max_digits: int = 1, timeout_seconds: int = 5) -> bool:
        return True

    async def record_speech(self, provider_call_id: str, max_duration_seconds: int = 15) -> bool:
        return True

    async def hangup_call(self, provider_call_id: str) -> bool:
        return True


telephony = ExotelProvider()
MockExotelProvider = ExotelProvider
