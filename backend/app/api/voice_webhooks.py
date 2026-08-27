from fastapi import APIRouter, Depends, Request, HTTPException
from supabase import Client
from app.core.db import get_supabase_client
import json

router = APIRouter()

@router.post("/telephony/status")
async def telephony_status_webhook(
    request: Request,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Webhook to receive call status updates (Ringing, Answered, Failed)
    from the telephony provider (e.g., Exotel).
    """
    try:
        # In a real provider, we parse form data or JSON
        payload = await request.json()
        provider_call_id = payload.get("CallSid")
        status = payload.get("CallStatus") # e.g. 'in-progress', 'completed', 'failed'
        
        # Map provider status to our internal voice_call_state
        status_map = {
            "ringing": "RINGING",
            "in-progress": "IN_PROGRESS",
            "completed": "COMPLETED",
            "failed": "FAILED",
            "busy": "BUSY",
            "no-answer": "NO_ANSWER"
        }
        internal_status = status_map.get(status, "IN_PROGRESS")
        
        # 1. Update voice_calls table
        call_res = supabase.table("voice_calls").update({"current_state": internal_status}).eq("provider_call_id", provider_call_id).execute()
        if not call_res.data:
            return {"status": "ignored", "reason": "Call not found"}
            
        call_id = call_res.data[0]["id"]
        
        # 2. Insert into voice_call_events for audit and realtime dashboard
        supabase.table("voice_call_events").insert({
            "call_id": call_id,
            "event_type": f"STATUS_{internal_status}",
            "payload": payload
        }).execute()
        
        # 3. Update recipient status
        recipient_id = call_res.data[0]["recipient_id"]
        supabase.table("voice_campaign_recipients").update({"status": internal_status}).eq("id", recipient_id).execute()
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/telephony/dtmf")
async def telephony_dtmf_webhook(
    request: Request,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Webhook to receive DTMF inputs (keypad presses).
    """
    try:
        payload = await request.json()
        provider_call_id = payload.get("CallSid")
        digits = payload.get("Digits")
        
        call_res = supabase.table("voice_calls").select("*").eq("provider_call_id", provider_call_id).execute()
        if not call_res.data:
            raise HTTPException(status_code=404, detail="Call not found")
            
        call = call_res.data[0]
        call_id = call["id"]
        
        # Log DTMF event
        supabase.table("voice_call_events").insert({
            "call_id": call_id,
            "event_type": "DTMF_RECEIVED",
            "payload": {"digits": digits}
        }).execute()
        
        # Basic state machine logic for Phase 3 (DTMF Safety Flow)
        # In a full implementation, we load the dialogue tree from voice_dialogue_nodes
        # For now, we simulate the logic: 1 = SAFE, 2 = NEEDS_HELP
        
        severity = "UNABLE_TO_CONFIRM_SAFETY"
        if digits == "1":
            severity = "SAFE"
        elif digits == "2":
            severity = "CRITICAL"
            
        # Record assessment
        supabase.table("voice_assessments").insert({
            "call_id": call_id,
            "severity": severity,
            "extracted_entities": {"dtmf_input": digits},
            "confidence_score": 1.0
        }).execute()
        
        # Broadcast via Realtime Event Bus
        from datetime import datetime, timezone
        supabase.table("realtime_events").insert({
            "event_type": "VOICE_ASSESSMENT",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "source": "telephony_webhook",
            "payload": {
                "call_id": call_id,
                "severity": severity,
                "dtmf": digits
            }
        }).execute()
        
        # Return instructions to the provider (e.g. TwiML or Exotel XML) to hang up or play next prompt
        return {
            "action": "play_and_hangup",
            "audio_url": "https://example.com/audio/thank_you.mp3" 
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
