from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client
import uuid
from app.core.db import get_supabase_client
from app.services.exotel_provider import MockExotelProvider
from app.core.security import require_permissions
from app.core.rbac import Permission
import asyncio

router = APIRouter()
telephony = MockExotelProvider()

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
        # Generate dummy IDs
        campaign_id = f"CAMP-TEST-{uuid.uuid4().hex[:6].upper()}"
        recipient_id = str(uuid.uuid4())
        
        # In a real scenario, this writes to Supabase DB.
        # Since we might not have run the migration yet, we just print the flow.
        
        # 1. Initiate Call via Provider
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
    language: str = "en",
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.SOS_VIEW]))
):
    """
    Broadcasts an IVR call to ALL registered citizens.
    """
    try:
        # Fetch all registered citizens
        response = supabase.table('registered_citizens').select("phone_number, full_name").execute()
        citizens = response.data
        
        if not citizens:
            return {"status": "success", "message": "No registered citizens to call", "dispatched_count": 0}
            
        campaign_id = f"BROADCAST-{uuid.uuid4().hex[:6].upper()}"
        call_records = []
        
        # Initiate calls
        # Note: In a real production system, this should be sent to a task queue (e.g., Celery) to avoid blocking the HTTP response.
        for citizen in citizens:
            phone = citizen['phone_number']
            try:
                provider_call_id = await telephony.initiate_call(
                    to_number=phone, 
                    dialogue_flow_id="SAFE_VERIFY_V1",
                    metadata={"language": language, "citizen_name": citizen['full_name']}
                )
                
                # Mocking the AI call flow logs for robust testing
                print(f"[AI CALL AGENT] Call Dispatched to: {citizen['full_name']} ({phone})")
                print(f"[AI CALL AGENT] Playing TTS: 'Attention. This is an emergency broadcast from PRANSETU. Please follow instructions...'")
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
            "message": "Broadcast calls initiated",
            "campaign_id": campaign_id,
            "dispatched_count": len(call_records),
            "calls": call_records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

