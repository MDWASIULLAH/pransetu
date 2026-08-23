from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from fastapi.responses import Response
from supabase import Client
from app.core.db import get_supabase_client
from app.schemas.sos import SOSSource
from app.core.config import settings
from datetime import datetime, timezone
from twilio.request_validator import RequestValidator
from twilio.twiml.voice_response import VoiceResponse
import uuid

router = APIRouter()

async def verify_twilio_signature(request: Request, x_twilio_signature: str = Header(None)):
    """Verify that an IVR webhook genuinely originated from Twilio.

    Three distinct states, made explicit. The previous version keyed its bypass on
    the auth token still equalling the literal placeholder
    "your-twilio-auth-token-here", which meant a deployment that had simply never
    set the variable accepted *any* unsigned request as authentic — anyone able to
    reach this URL could inject emergency records. The bypass now depends on the
    environment, not on a magic string, and is refused outright in production.
    """
    token = settings.TWILIO_AUTH_TOKEN

    if not token:
        if settings.is_production:
            # Fail closed. An unverifiable webhook in production is not a
            # degraded feature, it is an open ingestion endpoint.
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="IVR ingestion is unavailable: request signature verification is not configured.",
            )
        # Development and demo: accept unsigned requests so the IVR flow can be
        # exercised without Twilio credentials.
        return True

    if not x_twilio_signature:
        raise HTTPException(status_code=403, detail="Missing Twilio Signature")

    validator = RequestValidator(token)
    url = str(request.url)

    # Twilio signs the public URL, so a proxy-terminated TLS hop has to be
    # reconstructed before the signature will match.
    if url.startswith("http://") and "localhost" not in url:
        url = url.replace("http://", "https://")

    form_data = await request.form()
    post_vars = dict(form_data)

    if not validator.validate(url, post_vars, x_twilio_signature):
        raise HTTPException(status_code=403, detail="Invalid Twilio Signature")
    return True

@router.post("/ivr", status_code=status.HTTP_200_OK)
async def ingest_ivr_webhook(
    request: Request, 
    campaign_id: str, 
    supabase: Client = Depends(get_supabase_client),
    _valid: bool = Depends(verify_twilio_signature)
):
    """
    Ingest a webhook from Twilio IVR.
    Main menu:
    1 = SAFE
    2 = NEED ASSISTANCE
    3 = TRAPPED
    4 = MEDICAL EMERGENCY
    """
    form_data = await request.form()
    
    caller_id = form_data.get("From", "UNKNOWN")
    dtmf_input = form_data.get("Digits", "")
    call_sid = form_data.get("CallSid", str(uuid.uuid4()))
    
    # Idempotency / Duplicate Check: check if we already processed this CallSid
    existing_record = supabase.table('safety_records').select("*").eq("call_id", call_sid).execute()
    if existing_record.data:
        # Already processed this webhook, just return the TwiML to hang up
        return get_success_twiml()

    # Determine State
    state = "UNACCOUNTED"
    severity = None
    medical = False
    create_sos = False
    
    if dtmf_input == "1":
        state = "SAFE"
    elif dtmf_input == "2":
        state = "ASSISTANCE"
        severity = "HIGH"
        create_sos = True
    elif dtmf_input == "3":
        state = "TRAPPED"
        severity = "CRITICAL"
        create_sos = True
    elif dtmf_input == "4":
        state = "MEDICAL"
        severity = "CRITICAL"
        medical = True
        create_sos = True
    else:
        # Invalid DTMF or No Answer
        # Prompt them again
        return get_retry_twiml()

    # Create safety record for the campaign
    safety_payload = {
        "id": str(uuid.uuid4()),
        "citizen_phone": caller_id,
        "campaign_id": campaign_id,
        "state": state,
        "call_id": call_sid,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        supabase.table('safety_records').insert(safety_payload).execute()
        
        # If an emergency response was selected, bridge it to the EOC dashboard
        if create_sos:
            # We must NEVER fabricate GPS.
            # Try to fetch authorized location from citizen registry.
            user_profile = supabase.table('users').select("*").eq("phone", caller_id).execute()
            
            location_wkt = None
            if user_profile.data and "last_known_location" in user_profile.data[0]:
                location_wkt = user_profile.data[0]["last_known_location"]
                
            sos_payload = {
                "sos_id": f"IVR-{call_sid}",
                "device_id": caller_id,
                "source": SOSSource.IVR,
                "location": location_wkt, # Strictly enforced policy: null if unknown
                "accuracy_m": 5000.0 if location_wkt else None, 
                "location_timestamp": datetime.now(timezone.utc).isoformat(),
                "people_count": 1,
                "medical_required": medical,
                "severity": severity,
                "hop_count": 0,
                "ttl": 24,
                "citizen_phone": caller_id,
                "message": f"Generated from IVR Campaign {campaign_id}"
            }
            supabase.table('sos_events').upsert(sos_payload, on_conflict="device_id,source,location_timestamp").execute()
            
        return get_success_twiml()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_success_twiml():
    response = VoiceResponse()
    response.say("Thank you. Your response has been securely recorded. Help is being coordinated.", voice="alice")
    response.hangup()
    return Response(content=str(response), media_type="application/xml")
    
def get_retry_twiml():
    response = VoiceResponse()
    response.say("Invalid selection. Please press 1 for Safe, 2 for Assistance, 3 for Trapped, or 4 for Medical Emergency.", voice="alice")
    # In a real setup, we would append a <Gather> verb to let them retry
    return Response(content=str(response), media_type="application/xml")
