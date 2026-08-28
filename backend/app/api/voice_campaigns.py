from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client
from pydantic import BaseModel
from typing import Optional
import uuid
import datetime
from app.core.db import get_supabase_client
from app.services.exotel_provider import MockExotelProvider
from app.core.security import require_permissions
from app.core.rbac import Permission
import asyncio

router = APIRouter()
telephony = MockExotelProvider()

class EmergencyBroadcastRequest(BaseModel):
    disaster_text: str
    severity: str = "RED_CRITICAL"
    trigger_siren: bool = True
    language: str = "en"

@router.post("/test-call")
async def trigger_test_call(
    target_phone: str,
    language: str = "en",
    supabase: Client = Depends(get_supabase_client)
):
    """
    Initiates a test call for Phase 2 validation.
    """
    try:
        campaign_id = f"CAMP-TEST-{uuid.uuid4().hex[:6].upper()}"
        recipient_id = str(uuid.uuid4())
        
        provider_call_id = await telephony.initiate_call(
            to_number=target_phone, 
            dialogue_flow_id="SAFE_VERIFY_V1",
            metadata={"language": language}
        )
        
        return {
            "status": "success",
            "message": "Test call initiated",
            "campaign_id": campaign_id,
            "recipient_id": recipient_id,
            "provider_call_id": provider_call_id,
            "language": language
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/broadcast-call")
async def broadcast_call(
    request: Optional[EmergencyBroadcastRequest] = None,
    language: str = "en",
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.SOS_VIEW]))
):
    """
    Broadcasts an IVR call and immediately emits an Emergency Disaster Broadcast event 
    to trigger loud sirens across all connected dashboards and devices.
    """
    try:
        # Default payload if no body was provided
        disaster_text = request.disaster_text if request else "CRITICAL EMERGENCY BROADCAST. PLEASE SEEK SHELTER IMMEDIATELY."
        severity = request.severity if request else "RED_CRITICAL"
        trigger_siren = request.trigger_siren if request else True
        lang = request.language if request else language

        # 1. Fetch all registered citizens
        response = supabase.table('registered_citizens').select("phone_number, full_name").execute()
        citizens = response.data
        
        if not citizens:
            return {"status": "success", "message": "No registered citizens to call", "dispatched_count": 0}
            
        campaign_id = f"BROADCAST-{uuid.uuid4().hex[:6].upper()}"
        call_records = []
        
        # 2. Emit Real-time Emergency Disaster Broadcast Event immediately
        event_payload = {
            "event_type": "EMERGENCY_DISASTER_BROADCAST",
            "occurred_at": datetime.datetime.utcnow().isoformat() + "Z",
            "source": "eoc_broadcast_manager",
            "campaign_id": campaign_id,
            "payload": {
                "disaster_text": disaster_text,
                "severity": severity,
                "trigger_siren": trigger_siren,
                "target_count": len(citizens)
            }
        }
        
        supabase.table('realtime_events').insert(event_payload).execute()
        print(f"[EMERGENCY EVENT FIRED] Broadcast siren and alert sent to event bus for {len(citizens)} targets.")

        # 3. Initiate IVR Calls
        for citizen in citizens:
            phone = citizen['phone_number']
            try:
                provider_call_id = await telephony.initiate_call(
                    to_number=phone, 
                    dialogue_flow_id="1328745",
                    metadata={
                        "language": lang, 
                        "citizen_name": citizen['full_name'],
                        "disaster_text": disaster_text
                    }
                )
                
                print(f"[AI CALL AGENT] Call Dispatched to: {citizen['full_name']} ({phone})")
                print(f"[AI CALL AGENT] Playing TTS: '{disaster_text}'")
                print(f"[AI CALL AGENT] Gathering DTMF for acknowledgment...")
                
                call_records.append({
                    "phone": phone,
                    "provider_call_id": provider_call_id,
                    "status": "DISPATCHED"
                })
            except Exception as e:
                print(f"Failed to initiate call to {phone}: {e}")
                
        return {
            "status": "success",
            "message": "Emergency Broadcast & Calls initiated successfully.",
            "campaign_id": campaign_id,
            "dispatched_count": len(call_records),
            "calls": call_records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AITriageParseRequest(BaseModel):
    transcript_text: str
    dialect: Optional[str] = "Auto-Detect"
    citizen_phone: Optional[str] = None
    district: Optional[str] = "Balasore"

@router.post("/ai-triage-parse")
async def parse_ai_voice_triage(
    request: AITriageParseRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Parses natural speech text using the AI Extractor Service (Whisper + NER).
    Extracts headcount, landmark, medical need, threat type, and priority score.
    """
    from app.services.ai_extractor import AIExtractorService
    extractor = AIExtractorService()
    
    analysis = extractor.extract_intent(request.transcript_text, request.dialect or "Auto-Detect")
    
    # Emit Realtime Event for dashboard
    try:
        supabase.table('realtime_events').insert({
            "event_type": "AI_VOICE_TRIAGE_PROCESSED",
            "occurred_at": datetime.datetime.utcnow().isoformat() + "Z",
            "source": "ai_triage_engine",
            "payload": {
                "district": request.district,
                "phone": request.citizen_phone,
                "priority": analysis["priority"],
                "entities": analysis["extracted_entities"],
                "confidence": analysis["confidence_score"]
            }
        }).execute()
    except Exception as e:
        print(f"[Realtime Event Warning] {e}")
        
    return {
        "status": "success",
        "triage_result": analysis
    }


