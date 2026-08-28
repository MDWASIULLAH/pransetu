from __future__ import annotations

import datetime
import os
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field
from supabase import Client

from app.core.audit import AuditAction, log_audit_event
from app.core.db import get_supabase_client
from app.core.rbac import Permission
from app.core.security import require_permissions
from app.services.exotel_provider import ExotelProvider

router = APIRouter()
telephony = ExotelProvider()


TERMINAL_RECIPIENT_STATES = {"COMPLETED", "NO_ANSWER", "BUSY", "FAILED", "UNREACHABLE", "CANCELLED"}
PENDING_RECIPIENT_STATES = {"QUEUED", "INITIATING", "INITIATED", "RINGING", "IN_PROGRESS", "RETRYING"}
ANSWERED_RECIPIENT_STATES = {"ANSWERED", "COMPLETED"}


class EmergencyBroadcastRequest(BaseModel):
    disaster_text: str
    severity: str = "RED_CRITICAL"
    trigger_siren: bool = True
    language: str = "en"


class IvrBroadcastPreviewRequest(BaseModel):
    target_audience: str = "REGISTERED_CITIZENS"
    target_area: Optional[str] = None
    language: str = "or"
    test_mode: bool = False
    test_phone_numbers: List[str] = Field(default_factory=list)


class IvrBroadcastStartRequest(IvrBroadcastPreviewRequest):
    title: str
    emergency_type: str
    message: str
    priority: str = "HIGH"
    max_attempts: int = Field(default=1, ge=1, le=5)
    idempotency_key: Optional[str] = None
    ivr_options: Dict[str, str] = Field(
        default_factory=lambda: {
            "1": "SAFE",
            "2": "HELP_REQUIRED",
            "3": "EVACUATION_REQUIRED",
            "4": "MEDICAL_REQUIRED",
        }
    )


def utc_now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def mask_phone(phone: str) -> str:
    digits = "".join(ch for ch in str(phone or "") if ch.isdigit())
    if len(digits) <= 4:
        return "****"
    if digits.startswith("91") and len(digits) == 12:
        return f"+91 ******{digits[-4:]}"
    return f"******{digits[-4:]}"


def normalize_phone(phone: str) -> str:
    digits = "".join(ch for ch in str(phone or "") if ch.isdigit())
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    if len(digits) != 10:
        raise ValueError("invalid_phone")
    return f"+91{digits}"


def call_table(supabase: Client, table: str):
    return supabase.table(table)


def fetch_registered_citizens(supabase: Client) -> List[Dict[str, Any]]:
    response = call_table(supabase, "registered_citizens").select("*").execute()
    return response.data or []


def citizen_area(citizen: Dict[str, Any]) -> str:
    return str(
        citizen.get("district")
        or citizen.get("sector")
        or citizen.get("area")
        or citizen.get("location")
        or ""
    )


def eligible_registered_recipients(
    supabase: Client,
    target_area: Optional[str] = None,
) -> Dict[str, Any]:
    citizens = fetch_registered_citizens(supabase)
    normalized_seen: set[str] = set()
    eligible: List[Dict[str, Any]] = []
    invalid: List[Dict[str, str]] = []
    missing = 0
    duplicate = 0
    inactive = 0
    unverified = 0
    area_filter = (target_area or "").strip().lower()

    for citizen in citizens:
        phone = citizen.get("phone_number") or citizen.get("phone") or citizen.get("mobile")
        if not phone:
            missing += 1
            continue

        status_value = str(citizen.get("status") or citizen.get("active_status") or "ACTIVE").upper()
        if status_value in {"INACTIVE", "BLOCKED", "BLACKLISTED", "SUPPRESSED"} or citizen.get("active") is False:
            inactive += 1
            continue

        verification_value = str(citizen.get("verification_status") or citizen.get("phone_verified") or "VERIFIED").upper()
        if verification_value in {"FALSE", "UNVERIFIED", "REJECTED"}:
            unverified += 1
            continue

        if area_filter and area_filter not in citizen_area(citizen).lower():
            continue

        try:
            normalized = normalize_phone(phone)
        except ValueError:
            invalid.append({"citizen_id": str(citizen.get("id") or ""), "masked_phone": mask_phone(phone)})
            continue

        if normalized in normalized_seen:
            duplicate += 1
            continue

        normalized_seen.add(normalized)
        eligible.append(
            {
                "citizen_id": str(citizen.get("id") or uuid.uuid5(uuid.NAMESPACE_DNS, normalized)),
                "name": citizen.get("full_name") or citizen.get("name") or "Registered Citizen",
                "phone_number": normalized,
                "masked_phone": mask_phone(normalized),
                "preferred_language": citizen.get("preferred_language") or citizen.get("language") or "en",
                "area": citizen_area(citizen) or "Unmapped",
            }
        )

    return {
        "eligible": eligible,
        "summary": {
            "total_citizens": len(citizens),
            "eligible": len(eligible),
            "invalid": len(invalid),
            "missing": missing,
            "duplicate": duplicate,
            "inactive": inactive,
            "unverified": unverified,
            "actual_calls": len(eligible),
        },
        "invalid_recipients": invalid[:25],
    }


def test_recipients(phone_numbers: List[str], language: str) -> Dict[str, Any]:
    normalized_seen: set[str] = set()
    recipients: List[Dict[str, Any]] = []
    invalid: List[Dict[str, str]] = []

    for index, phone in enumerate(phone_numbers):
        try:
            normalized = normalize_phone(phone)
        except ValueError:
            invalid.append({"citizen_id": f"TEST-{index + 1}", "masked_phone": mask_phone(phone)})
            continue
        if normalized in normalized_seen:
            continue
        normalized_seen.add(normalized)
        recipients.append(
            {
                "citizen_id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"test:{normalized}")),
                "name": "Test Recipient",
                "phone_number": normalized,
                "masked_phone": mask_phone(normalized),
                "preferred_language": language,
                "area": "TEST MODE",
            }
        )

    return {
        "eligible": recipients,
        "summary": {
            "total_citizens": len(phone_numbers),
            "eligible": len(recipients),
            "invalid": len(invalid),
            "missing": 0,
            "duplicate": max(0, len(phone_numbers) - len(recipients) - len(invalid)),
            "inactive": 0,
            "unverified": 0,
            "actual_calls": len(recipients),
        },
        "invalid_recipients": invalid,
    }


def get_recipient_set(supabase: Client, payload: IvrBroadcastPreviewRequest) -> Dict[str, Any]:
    if payload.test_mode:
        if not payload.test_phone_numbers:
            return test_recipients([], payload.language)
        return test_recipients(payload.test_phone_numbers, payload.language)
    return eligible_registered_recipients(supabase, payload.target_area)


def stats_from_recipients(recipients: List[Dict[str, Any]]) -> Dict[str, int]:
    def count_status(states: set[str]) -> int:
        return sum(1 for recipient in recipients if str(recipient.get("status", "")).upper() in states)

    responses = [str(r.get("ivr_response") or "").upper() for r in recipients]
    return {
        "total_recipients": len(recipients),
        "calls_initiated": sum(1 for r in recipients if r.get("call_initiated_at") or r.get("provider_call_id")),
        "answered": count_status(ANSWERED_RECIPIENT_STATES),
        "no_answer": count_status({"NO_ANSWER"}),
        "busy": count_status({"BUSY"}),
        "failed": count_status({"FAILED", "UNREACHABLE"}),
        "pending": count_status(PENDING_RECIPIENT_STATES),
        "queued": count_status({"QUEUED"}),
        "retrying": count_status({"RETRYING"}),
        "safe": responses.count("SAFE"),
        "help_requested": responses.count("HELP_REQUIRED") + responses.count("MEDICAL_REQUIRED"),
        "evacuation_required": responses.count("EVACUATION_REQUIRED"),
    }


def derive_campaign_status(campaign: Dict[str, Any], stats: Dict[str, int]) -> str:
    status = str(campaign.get("status") or "DRAFT").upper()
    if status == "CANCELLED":
        return status
    total = stats["total_recipients"]
    if total == 0:
        return "FAILED"
    terminal = stats["answered"] + stats["no_answer"] + stats["busy"] + stats["failed"]
    if terminal < total:
        return "IN_PROGRESS" if stats["calls_initiated"] else "QUEUED"
    return "COMPLETED" if stats["failed"] == 0 and stats["no_answer"] == 0 and stats["busy"] == 0 else "PARTIALLY_COMPLETED"


def campaign_with_stats(supabase: Client, campaign: Dict[str, Any]) -> Dict[str, Any]:
    recipients_response = (
        call_table(supabase, "voice_campaign_recipients")
        .select("*")
        .eq("campaign_id", campaign["id"])
        .execute()
    )
    recipients = recipients_response.data or []
    stats = stats_from_recipients(recipients)
    completion = round(((stats["answered"] + stats["failed"] + stats["no_answer"] + stats["busy"]) / stats["total_recipients"]) * 100) if stats["total_recipients"] else 0
    return {
        **campaign,
        "title": campaign.get("title") or campaign.get("name"),
        "emergency_type": campaign.get("emergency_type") or campaign.get("mode") or "Emergency",
        "target_audience": campaign.get("target_audience") or ", ".join(campaign.get("target_districts") or []) or "Registered Citizens",
        "completion_percentage": completion,
        "derived_status": derive_campaign_status(campaign, stats),
        "stats": stats,
    }


def emit_event(supabase: Client, event_type: str, campaign_id: str, payload: Dict[str, Any]) -> None:
    try:
        call_table(supabase, "realtime_events").insert(
            {
                "event_type": event_type,
                "occurred_at": utc_now(),
                "source": "ivr_broadcast",
                "campaign_id": campaign_id,
                "payload": payload,
            }
        ).execute()
    except Exception:
        pass


def update_campaign_state(supabase: Client, campaign_id: str) -> None:
    campaign_response = call_table(supabase, "voice_campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign_response.data:
        return
    enriched = campaign_with_stats(supabase, campaign_response.data[0])
    updates = {
        "status": enriched["derived_status"],
        "total_calls": enriched["stats"]["total_recipients"],
        "safe_count": enriched["stats"]["safe"],
        "assistance_count": enriched["stats"]["help_requested"] + enriched["stats"]["evacuation_required"],
        "medical_count": enriched["stats"]["help_requested"],
    }
    if enriched["derived_status"] in {"COMPLETED", "PARTIALLY_COMPLETED", "FAILED"}:
        updates["completed_at"] = utc_now()
    try:
        call_table(supabase, "voice_campaigns").update(updates).eq("id", campaign_id).execute()
    except Exception:
        pass


async def process_queued_broadcast_calls(campaign_id: str, supabase: Client, limit: Optional[int] = None) -> None:
    max_calls = limit or int(os.getenv("IVR_BROADCAST_MAX_CALLS_PER_RUN", "25"))
    response = (
        call_table(supabase, "voice_campaign_recipients")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("status", "QUEUED")
        .limit(max_calls)
        .execute()
    )
    recipients = response.data or []
    if not recipients:
        update_campaign_state(supabase, campaign_id)
        return

    campaign_response = call_table(supabase, "voice_campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign_response.data:
        return
    campaign = campaign_response.data[0]

    try:
        call_table(supabase, "voice_campaigns").update({"status": "IN_PROGRESS"}).eq("id", campaign_id).execute()
    except Exception:
        pass

    for recipient in recipients:
        recipient_id = recipient["id"]
        attempts = int(recipient.get("attempt_count") or recipient.get("retry_count") or 0) + 1
        try:
            call_table(supabase, "voice_campaign_recipients").update(
                {
                    "status": "INITIATING",
                    "attempt_count": attempts,
                    "retry_count": max(0, attempts - 1),
                    "call_initiated_at": utc_now(),
                    "updated_at": utc_now(),
                }
            ).eq("id", recipient_id).execute()

            provider_call_id = await telephony.initiate_call(
                to_number=recipient["phone_number"],
                dialogue_flow_id=os.getenv("EXOTEL_APP_ID", "1328745"),
                metadata={
                    "broadcast_id": campaign_id,
                    "broadcast_recipient_id": recipient_id,
                    "language": recipient.get("preferred_language") or campaign.get("language") or "en",
                    "disaster_text": campaign.get("emergency_message") or campaign.get("message") or campaign.get("name"),
                },
            )

            call_insert = call_table(supabase, "voice_calls").insert(
                {
                    "recipient_id": recipient_id,
                    "provider_call_id": provider_call_id,
                    "language_used": recipient.get("preferred_language") or campaign.get("language") or "en",
                    "current_state": "INITIATED",
                    "started_at": utc_now(),
                }
            ).execute()
            call_id = (call_insert.data or [{}])[0].get("id")
            if call_id:
                call_table(supabase, "voice_call_events").insert(
                    {
                        "call_id": call_id,
                        "event_type": "CALL_INITIATED",
                        "payload": {"masked_phone": recipient.get("masked_phone"), "attempt": attempts},
                    }
                ).execute()

            call_table(supabase, "voice_campaign_recipients").update(
                {
                    "status": "INITIATED",
                    "provider_call_id": provider_call_id,
                    "last_error": None,
                    "updated_at": utc_now(),
                }
            ).eq("id", recipient_id).execute()
        except Exception as exc:
            call_table(supabase, "voice_campaign_recipients").update(
                {
                    "status": "FAILED",
                    "last_error": str(exc)[:300],
                    "updated_at": utc_now(),
                }
            ).eq("id", recipient_id).execute()

    update_campaign_state(supabase, campaign_id)
    emit_event(supabase, "IVR_BROADCAST_BATCH_PROCESSED", campaign_id, {"processed": len(recipients)})


@router.get("/config-status")
async def config_status(user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_VIEW]))):
    return {
        "status": "CONFIGURED" if telephony.is_configured() else "REQUIRES_EXOTEL_CONFIGURATION",
        "exotel": telephony.configuration_status(),
        "max_calls_per_run": int(os.getenv("IVR_BROADCAST_MAX_CALLS_PER_RUN", "25")),
    }


@router.post("/ivr-broadcasts/preview")
async def preview_ivr_broadcast(
    payload: IvrBroadcastPreviewRequest,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_VIEW])),
):
    recipients = get_recipient_set(supabase, payload)
    return {"status": "success", "data": recipients["summary"], "invalid_recipients": recipients["invalid_recipients"]}


@router.get("/ivr-broadcasts")
async def list_ivr_broadcasts(
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_VIEW])),
):
    response = call_table(supabase, "voice_campaigns").select("*").order("created_at", desc=True).limit(25).execute()
    campaigns = [campaign_with_stats(supabase, campaign) for campaign in (response.data or [])]
    return {"status": "success", "data": campaigns}


@router.get("/ivr-broadcasts/{broadcast_id}/recipients")
async def list_broadcast_recipients(
    broadcast_id: str,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_VIEW])),
):
    response = (
        call_table(supabase, "voice_campaign_recipients")
        .select("*")
        .eq("campaign_id", broadcast_id)
        .order("updated_at", desc=True)
        .limit(500)
        .execute()
    )
    recipients = response.data or []
    for recipient in recipients:
        recipient["phone_number"] = recipient.get("masked_phone") or mask_phone(recipient.get("phone_number", ""))
    return {"status": "success", "data": recipients}


@router.post("/ivr-broadcasts/start")
async def start_ivr_broadcast(
    payload: IvrBroadcastStartRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_CREATE])),
):
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Broadcast title is required.")
    if not payload.emergency_type.strip():
        raise HTTPException(status_code=400, detail="Disaster/emergency type is required.")
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Emergency message is required.")
    if not payload.language.strip():
        raise HTTPException(status_code=400, detail="Language is required.")
    if not telephony.is_configured():
        raise HTTPException(
            status_code=503,
            detail={"code": "REQUIRES_EXOTEL_CONFIGURATION", "exotel": telephony.configuration_status()},
        )

    if not payload.idempotency_key:
        payload.idempotency_key = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{payload.title}:{payload.message}:{payload.target_area}:{payload.test_mode}"))

    existing = (
        call_table(supabase, "voice_campaigns")
        .select("*")
        .eq("idempotency_key", payload.idempotency_key)
        .execute()
    )
    if existing.data:
        campaign = campaign_with_stats(supabase, existing.data[0])
        return {"status": "success", "idempotent": True, "data": campaign}

    recipient_set = get_recipient_set(supabase, payload)
    recipients = recipient_set["eligible"]
    if not recipients:
        raise HTTPException(status_code=400, detail="No eligible IVR recipients found for this broadcast.")

    broadcast_id = f"IVR-{uuid.uuid4().hex[:10].upper()}"
    now = utc_now()
    campaign_record = {
        "id": broadcast_id,
        "name": payload.title,
        "title": payload.title,
        "emergency_type": payload.emergency_type,
        "emergency_message": payload.message,
        "language": payload.language,
        "target_audience": payload.target_audience,
        "target_area": payload.target_area,
        "priority": payload.priority,
        "status": "QUEUED",
        "created_by": user_info.get("uid"),
        "created_by_role": user_info.get("role"),
        "started_by": user_info.get("uid"),
        "created_at": now,
        "started_at": now,
        "total_calls": len(recipients),
        "test_mode": payload.test_mode,
        "retry_policy": {"max_attempts": payload.max_attempts},
        "ivr_options": payload.ivr_options,
        "recipient_breakdown": recipient_set["summary"],
        "idempotency_key": payload.idempotency_key,
    }
    call_table(supabase, "voice_campaigns").insert(campaign_record).execute()

    recipient_rows = []
    for recipient in recipients:
        recipient_rows.append(
            {
                "campaign_id": broadcast_id,
                "citizen_id": recipient["citizen_id"],
                "user_id": None,
                "citizen_name": recipient["name"],
                "phone_number": recipient["phone_number"],
                "masked_phone": recipient["masked_phone"],
                "area": recipient["area"],
                "preferred_language": payload.language or recipient["preferred_language"],
                "status": "QUEUED",
                "attempt_count": 0,
                "retry_count": 0,
                "max_attempts": payload.max_attempts,
                "idempotency_key": f"{broadcast_id}:{recipient['citizen_id']}",
            }
        )
    call_table(supabase, "voice_campaign_recipients").upsert(
        recipient_rows,
        on_conflict="campaign_id,phone_number",
    ).execute()

    log_audit_event(
        supabase=supabase,
        actor_id=user_info.get("uid"),
        actor_role=user_info.get("role"),
        action=AuditAction.CAMPAIGN_START,
        entity_type="IVR_BROADCAST",
        entity_id=broadcast_id,
        after_state={**campaign_record, "recipient_count": len(recipients)},
        metadata={"test_mode": payload.test_mode, "invalid_recipients": recipient_set["summary"]["invalid"]},
        request=request,
    )
    emit_event(supabase, "IVR_BROADCAST_QUEUED", broadcast_id, {"recipients": len(recipients), "test_mode": payload.test_mode})

    background_tasks.add_task(process_queued_broadcast_calls, broadcast_id, supabase)
    return {"status": "success", "data": campaign_with_stats(supabase, campaign_record)}


@router.post("/ivr-broadcasts/{broadcast_id}/process-queue")
async def process_broadcast_queue(
    broadcast_id: str,
    background_tasks: BackgroundTasks,
    limit: Optional[int] = None,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_CREATE])),
):
    if not telephony.is_configured():
        raise HTTPException(status_code=503, detail={"code": "REQUIRES_EXOTEL_CONFIGURATION"})
    background_tasks.add_task(process_queued_broadcast_calls, broadcast_id, supabase, limit)
    return {"status": "success", "message": "Queued IVR jobs handed to the bounded broadcast worker."}


@router.post("/test-call")
async def trigger_test_call(
    target_phone: str,
    language: str = "en",
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_CREATE])),
):
    try:
        provider_call_id = await telephony.initiate_call(
            to_number=target_phone,
            dialogue_flow_id=os.getenv("EXOTEL_APP_ID", "1328745"),
            metadata={"language": language, "disaster_text": "PRANSETU test IVR broadcast"},
        )
        return {"status": "success", "provider_call_id": provider_call_id, "language": language}
    except RuntimeError as exc:
        if str(exc) == "REQUIRES_EXOTEL_CONFIGURATION":
            raise HTTPException(status_code=503, detail={"code": "REQUIRES_EXOTEL_CONFIGURATION"})
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/broadcast-call")
async def broadcast_call(
    request: Optional[EmergencyBroadcastRequest] = None,
    language: str = "en",
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.CAMPAIGN_CREATE])),
):
    body = request or EmergencyBroadcastRequest(
        disaster_text="CRITICAL EMERGENCY BROADCAST. PLEASE SEEK SHELTER IMMEDIATELY.",
        language=language,
    )
    start_payload = IvrBroadcastStartRequest(
        title="Emergency IVR Broadcast",
        emergency_type=body.severity,
        message=body.disaster_text,
        language=body.language,
        target_audience="REGISTERED_CITIZENS",
    )
    if not telephony.is_configured():
        raise HTTPException(status_code=503, detail={"code": "REQUIRES_EXOTEL_CONFIGURATION"})
    recipient_set = get_recipient_set(supabase, start_payload)
    return {
        "status": "ready",
        "message": "Use /ivr-broadcasts/start to create auditable recipient jobs before calling.",
        "recipient_preview": recipient_set["summary"],
    }


@router.get("/exotel/exoml")
@router.post("/exotel/exoml")
async def get_exotel_exoml(
    From: Optional[str] = None,
    CallSid: Optional[str] = None,
    CustomField: Optional[str] = None,
):
    disaster_msg = CustomField or "This is a critical emergency disaster warning from the PRANSETU State Emergency Response Centre. Severe weather and flood conditions are detected in your area."

    exoml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="woman" language="en-IN">Namaskar. {disaster_msg}</Say>
    <Gather action="https://pransetu-v1.vercel.app/api/v1/voice-campaigns/exotel/gather" numDigits="1" timeout="10" method="POST">
        <Say voice="woman" language="en-IN">Press 1 if you and your family are safe. Press 2 if you need emergency food and drinking water. Press 3 if you are trapped in rising floodwaters. Press 4 if anyone needs immediate medical rescue.</Say>
    </Gather>
    <Say voice="woman" language="en-IN">We did not receive your input. Stay on high ground and keep your phone charged. PRANSETU rescue teams are active.</Say>
    <Hangup/>
</Response>"""

    return Response(content=exoml_content, media_type="application/xml")


@router.post("/exotel/gather")
@router.get("/exotel/gather")
async def handle_exotel_gather(
    Digits: Optional[str] = None,
    From: Optional[str] = None,
    CallSid: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
):
    digit = (Digits or "").strip()
    response_map = {
        "1": ("SAFE", "Thank you. Your safe status has been confirmed with PRANSETU Emergency Operations Centre."),
        "2": ("HELP_REQUIRED", "Your request for food and clean drinking water has been logged with disaster relief logistics."),
        "3": ("EVACUATION_REQUIRED", "Critical alert received. A rescue request has been pinned on the GIS Command Map."),
        "4": ("MEDICAL_REQUIRED", "Critical medical alert received. Emergency responders have been notified."),
    }
    ivr_response, msg = response_map.get(digit, ("NO_RESPONSE", "Thank you for contacting PRANSETU Emergency Services. Stay safe."))

    try:
        if CallSid:
            call_response = call_table(supabase, "voice_calls").select("*").eq("provider_call_id", CallSid).execute()
            if call_response.data:
                call_record = call_response.data[0]
                recipient_id = call_record["recipient_id"]
                call_table(supabase, "voice_call_events").insert(
                    {"call_id": call_record["id"], "event_type": "DTMF_RECEIVED", "payload": {"digits": digit, "ivr_response": ivr_response}}
                ).execute()
                call_table(supabase, "voice_campaign_recipients").update(
                    {"ivr_response": ivr_response, "status": "COMPLETED", "webhook_updated_at": utc_now(), "updated_at": utc_now()}
                ).eq("id", recipient_id).execute()
                recipient_response = call_table(supabase, "voice_campaign_recipients").select("campaign_id").eq("id", recipient_id).execute()
                if recipient_response.data:
                    update_campaign_state(supabase, recipient_response.data[0]["campaign_id"])
    except Exception:
        pass

    response_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="woman" language="en-IN">{msg}</Say>
    <Hangup/>
</Response>"""

    return Response(content=response_xml, media_type="application/xml")
