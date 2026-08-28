from fastapi import APIRouter, Depends, Request, HTTPException
from supabase import Client
from app.core.db import get_supabase_client
import json
from datetime import datetime, timezone

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
            "answered": "ANSWERED",
            "in-progress": "IN_PROGRESS",
            "completed": "COMPLETED",
            "failed": "FAILED",
            "busy": "BUSY",
            "no-answer": "NO_ANSWER"
        }
        internal_status = status_map.get(status, "IN_PROGRESS")
        
        existing_call_res = supabase.table("voice_calls").select("*").eq("provider_call_id", provider_call_id).execute()
        if not existing_call_res.data:
            return {"status": "ignored", "reason": "Call not found"}

        call = existing_call_res.data[0]
        call_id = call["id"]
        now = datetime.now(timezone.utc).isoformat()
        event_key = f"{provider_call_id}:{status}:{payload.get('Timestamp') or payload.get('DateUpdated') or now}"

        try:
            supabase.table("ivr_broadcast_webhook_events").insert({
                "provider_call_id": provider_call_id,
                "event_type": f"STATUS_{internal_status}",
                "payload": payload,
                "idempotency_key": event_key
            }).execute()
        except Exception as exc:
            if "duplicate" in str(exc).lower():
                return {"status": "ignored", "reason": "Duplicate webhook"}

        call_updates = {"current_state": internal_status, "webhook_updated_at": now}
        if internal_status in ["ANSWERED", "IN_PROGRESS"]:
            call_updates["started_at"] = call.get("started_at") or now
        if internal_status in ["COMPLETED", "FAILED", "BUSY", "NO_ANSWER", "CANCELLED"]:
            call_updates["ended_at"] = now
            if payload.get("Duration"):
                call_updates["duration_seconds"] = int(payload.get("Duration"))

        supabase.table("voice_calls").update(call_updates).eq("provider_call_id", provider_call_id).execute()
        
        # 2. Insert into voice_call_events for audit and realtime dashboard
        supabase.table("voice_call_events").insert({
            "call_id": call_id,
            "event_type": f"STATUS_{internal_status}",
            "payload": payload
        }).execute()
        
        # 3. Update recipient status
        recipient_id = call["recipient_id"]
        recipient_updates = {
            "status": internal_status,
            "final_call_status": status,
            "webhook_updated_at": now,
            "updated_at": now
        }
        if internal_status == "RINGING":
            recipient_updates["ringing_at"] = now
        if internal_status in ["ANSWERED", "IN_PROGRESS"]:
            recipient_updates["answered_at"] = now
        if internal_status in ["COMPLETED", "FAILED", "BUSY", "NO_ANSWER", "CANCELLED"]:
            recipient_updates["ended_at"] = now
            if payload.get("Duration"):
                recipient_updates["duration_seconds"] = int(payload.get("Duration"))

        supabase.table("voice_campaign_recipients").update(recipient_updates).eq("id", recipient_id).execute()
        
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
