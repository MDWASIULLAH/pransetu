from fastapi import APIRouter, Depends, HTTPException, Body, Query
from supabase import Client
from datetime import datetime, timezone
import uuid
import math
from app.core.db import get_supabase_client
from app.core.security import require_permissions
from app.core.rbac import Permission
from typing import Optional, Dict, Any, List

router = APIRouter()

# Haversine distance calculator in kilometers
def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

@router.get("/")
def list_resources(
    resource_type: Optional[str] = None,
    status: Optional[str] = None,
    district: Optional[str] = None,
    verification_status: Optional[str] = Query(None, description="Filter by verification status (default: VERIFIED for coordinators)"),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_VIEW]))
):
    """List verified active resources for Rescue Coordinators and EOC Operators."""
    try:
        query = supabase.table('resources').select("*")
        v_status = verification_status if verification_status is not None else "VERIFIED"
        if v_status != "ALL":
            query = query.eq("verification_status", v_status)
            
        if resource_type:
            query = query.eq("type", resource_type)
        if status:
            query = query.eq("status", status)
        if district:
            query = query.eq("district", district)
            
        response = query.order("created_at", desc=True).execute()
        return {"data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/register")
def register_resource(
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_REGISTER]))
):
    """Register a new resource by an authorized agency. Initialized to PENDING."""
    try:
        resource_id = payload.get("id") or f"RES-{payload.get('type', 'GEN')[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
        
        resource_record = {
            "id": resource_id,
            "name": payload.get("name"),
            "type": payload.get("type"),
            "organization": payload.get("organization"),
            "district": payload.get("district", "Puri"),
            "location": payload.get("location", "POINT(85.8245 19.8135)"),
            "status": "UNAVAILABLE",
            "verification_status": "PENDING",
            "agency_type": payload.get("agency_type", "GOVERNMENT"),
            "registration_number": payload.get("registration_number"),
            "contact_person": payload.get("contact_person"),
            "contact_phone": payload.get("contact_phone"),
            "contact_email": payload.get("contact_email"),
            "capacity": payload.get("capacity", 1),
            "is_multi_capacity": payload.get("is_multi_capacity", False),
            "attributes": payload.get("attributes", {}),
            "notes": payload.get("notes", f"Registered by {user_info.get('role')} ({user_info.get('sub')})")
        }
        
        response = supabase.table('resources').insert(resource_record).execute()
        
        supabase.table('resource_audit_logs').insert({
            "resource_id": resource_id,
            "old_status": "NEW",
            "new_status": "PENDING_VERIFICATION",
            "changed_by": user_info.get("sub"),
            "notes": f"Resource registration submitted by {resource_record['agency_type']} agency: {resource_record['organization']}"
        }).execute()
        
        return {
            "status": "success",
            "message": "Resource registration submitted. Awaiting Super Admin verification.",
            "data": response.data[0] if response.data else resource_record
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pending")
def list_pending_verifications(
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_VERIFY]))
):
    """Super Admin endpoint to inspect all pending resource registrations."""
    try:
        response = supabase.table('resources').select("*").eq("verification_status", "PENDING").order("created_at", desc=True).execute()
        return {"data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{resource_id}/verify")
def verify_resource(
    resource_id: str,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_VERIFY]))
):
    """Super Admin approves and verifies a resource, releasing it to active pool."""
    try:
        res = supabase.table('resources').select("*").eq("id", resource_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Resource not found")
            
        resource = res.data[0]
        if resource.get("verification_status") == "VERIFIED":
            return {"status": "success", "message": "Resource is already verified."}
            
        update_res = supabase.table('resources').update({
            "verification_status": "VERIFIED",
            "status": "AVAILABLE"
        }).eq("id", resource_id).execute()
        
        try:
            supabase.table('resource_audit_logs').insert({
                "resource_id": resource_id,
                "old_status": "PENDING_VERIFICATION",
                "new_status": "AVAILABLE",
                "changed_by": user_info["sub"],
                "notes": f"Super Admin verified and activated asset: {resource.get('name')}"
            }).execute()
        except Exception:
            pass
        
        return {"status": "success", "message": "Resource verified and added to real-time available pool.", "data": update_res.data[0] if update_res.data else {}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{resource_id}/reject")
def reject_resource(
    resource_id: str,
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_VERIFY]))
):
    """Super Admin rejects a registration."""
    try:
        reason = payload.get("reason", "Verification rejected by Super Admin")
        update_res = supabase.table('resources').update({
            "verification_status": "REJECTED",
            "status": "UNAVAILABLE",
            "rejection_reason": reason
        }).eq("id", resource_id).execute()
        
        try:
            supabase.table('resource_audit_logs').insert({
                "resource_id": resource_id,
                "old_status": "PENDING_VERIFICATION",
                "new_status": "REJECTED",
                "changed_by": user_info["sub"],
                "notes": f"Rejection reason: {reason}"
            }).execute()
        except Exception:
            pass
        
        return {"status": "success", "message": "Resource registration rejected.", "data": update_res.data[0] if update_res.data else {}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# RESCUE DISPATCH & RECOMMENDATION ENGINE
# ==========================================

@router.get("/dispatch-recommendations/{incident_id}")
def get_dispatch_recommendations(
    incident_id: str,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_DISPATCH, Permission.RESOURCE_VIEW]))
) -> Dict[str, Any]:
    """
    Computes pre-dispatch decision intelligence and deterministic AI resource recommendations.
    Never automatically dispatches: provides rationale for authorized human coordinator approval.
    """
    try:
        # 1. Fetch Incident Data
        inc_res = supabase.table('incidents').select("*").eq("id", incident_id).execute()
        
        if inc_res.data:
            incident = inc_res.data[0]
        else:
            # Fallback mock incident for demonstration
            incident = {
                "id": incident_id,
                "district": "Puri",
                "center_lat": 19.8135,
                "center_lng": 85.8312,
                "priority_score": 94,
                "sos_count": 6,
                "affected_people": 14,
                "critical_count": 3,
                "medical_required": True,
                "hazard_severity": "HIGH_FLOOD_SURGE",
                "location_accuracy_m": 12,
                "trapped_count": 4,
                "status": "ACTIVE"
            }

        inc_lat = incident.get("center_lat", 19.8135)
        inc_lng = incident.get("center_lng", 85.8312)
        people_count = incident.get("affected_people", 6)
        medical_req = incident.get("medical_required", True)
        hazard = incident.get("hazard_severity", "HIGH_FLOOD_SURGE")
        trapped = incident.get("trapped_count", 0) > 0 or "FLOOD" in str(hazard).upper()
        priority_score = incident.get("priority_score", 92)

        # 2. Fetch Available Verified Resources
        avail_res = supabase.table('resources').select("*").eq("verification_status", "VERIFIED").eq("status", "AVAILABLE").execute()
        available_resources = avail_res.data or []

        # Categorize Inventory
        inventory = {
            "ambulances": 0,
            "rescue_teams": 0,
            "boats": 0,
            "medical_teams": 0,
            "vehicles": 0
        }
        
        res_with_distance = []
        for r in available_resources:
            r_type = r.get("type")
            if r_type == "AMBULANCE": inventory["ambulances"] += 1
            elif r_type == "RESCUE_TEAM": inventory["rescue_teams"] += 1
            elif r_type == "BOAT": inventory["boats"] += 1
            elif r_type == "MEDICAL_TEAM": inventory["medical_teams"] += 1
            elif r_type == "RESCUE_VEHICLE": inventory["vehicles"] += 1

            # Estimate distance from default coordinates or location attribute
            r_lat = r.get("attributes", {}).get("lat", 19.825)
            r_lng = r.get("attributes", {}).get("lng", 85.842)
            dist_km = calculate_distance_km(inc_lat, inc_lng, r_lat, r_lng)
            eta_mins = max(4, int((dist_km / 45.0) * 60)) # Avg speed 45km/h
            
            res_item = {**r, "distance_km": dist_km, "eta_minutes": eta_mins}
            res_with_distance.append(res_item)

        # Sort available resources by distance
        res_with_distance.sort(key=lambda x: x["distance_km"])

        # 3. Deterministic AI Recommendation Engine (Explainable Rules)
        recommendations = []

        # Rule 1: Medical Trauma / Oxygen Needed
        if medical_req or incident.get("critical_count", 0) > 0:
            suggested_amb = next((r for r in res_with_distance if r["type"] == "AMBULANCE"), None)
            suggested_med = next((r for r in res_with_distance if r["type"] == "MEDICAL_TEAM"), None)
            recommendations.append({
                "resource_type": "AMBULANCE",
                "recommended_asset_id": suggested_amb["id"] if suggested_amb else "RES-AMB-01",
                "recommended_asset_name": suggested_amb["name"] if suggested_amb else "ALS Advanced Cardiac Unit 01",
                "rationale": "Critical medical trauma / respiratory support required on-scene",
                "priority_weight": "+35 pts"
            })
            if suggested_med:
                recommendations.append({
                    "resource_type": "MEDICAL_TEAM",
                    "recommended_asset_id": suggested_med["id"],
                    "recommended_asset_name": suggested_med["name"],
                    "rationale": "Mobile trauma doctors for on-site triage",
                    "priority_weight": "+20 pts"
                })

        # Rule 2: Water Hazard / Inundation Zone
        if "FLOOD" in str(hazard).upper() or "SURGE" in str(hazard).upper():
            suggested_boat = next((r for r in res_with_distance if r["type"] == "BOAT"), None)
            recommendations.append({
                "resource_type": "BOAT",
                "recommended_asset_id": suggested_boat["id"] if suggested_boat else "RES-BOAT-01",
                "recommended_asset_name": suggested_boat["name"] if suggested_boat else "Zodiac IRB Flood Vessel #1",
                "rationale": "Submerged road network and coastal surge require shallow-draft boat extraction",
                "priority_weight": "+30 pts"
            })

        # Rule 3: Mass Population / Trapped Group (>= 6 people)
        if people_count >= 6:
            suggested_team = next((r for r in res_with_distance if r["type"] == "RESCUE_TEAM"), None)
            recommendations.append({
                "resource_type": "RESCUE_TEAM",
                "recommended_asset_id": suggested_team["id"] if suggested_team else "RES-NDRF-01",
                "recommended_asset_name": suggested_team["name"] if suggested_team else "NDRF 03 Battalion Team Alpha",
                "rationale": f"High victim density ({people_count} affected pax) requires multi-person NDRF search & rescue team",
                "priority_weight": "+25 pts"
            })

        # Rule 4: Trapped Structures
        if trapped:
            suggested_veh = next((r for r in res_with_distance if r["type"] == "RESCUE_VEHICLE"), None)
            if suggested_veh:
                recommendations.append({
                    "resource_type": "RESCUE_VEHICLE",
                    "recommended_asset_id": suggested_veh["id"],
                    "recommended_asset_name": suggested_veh["name"],
                    "rationale": "Heavy hydraulic cutting gear and amphibious terrain navigation needed",
                    "priority_weight": "+15 pts"
                })

        response_data = {
            "incident_info": {
                "incident_id": incident_id,
                "priority_score": priority_score,
                "people_affected": people_count,
                "medical_required": medical_req,
                "hazard_severity": hazard,
                "location_accuracy": f"±{incident.get('location_accuracy_m', 12)}m",
                "coordinates": f"{inc_lat:.4f}° N, {inc_lng:.4f}° E",
                "district": incident.get("district", "Puri")
            },
            "inventory_readiness": inventory,
            "deterministic_recommendations": recommendations,
            "available_resources": res_with_distance
        }

        return {"status": "success", "data": response_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/dispatch-batch")
def dispatch_batch_resources(
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_DISPATCH]))
):
    """
    Authorized human confirmation endpoint for multi-resource dispatch.
    Strictly verifies authorization, concurrency locks, and logs complete audit trail.
    """
    try:
        incident_id = payload.get("incident_id")
        resource_ids = payload.get("resource_ids", [])
        notes = payload.get("notes", "Tactical dispatch authorized by Rescue Coordinator")
        
        if not incident_id or not resource_ids:
            raise HTTPException(status_code=400, detail="incident_id and resource_ids list required")

        dispatched_assignments = []
        now_ts = datetime.now(timezone.utc).isoformat()

        for res_id in resource_ids:
            # 1. Fetch resource and verify availability
            res_query = supabase.table('resources').select("*").eq("id", res_id).execute()
            if not res_query.data:
                raise HTTPException(status_code=404, detail=f"Resource {res_id} not found")
                
            resource = res_query.data[0]
            if resource.get("verification_status") != "VERIFIED":
                raise HTTPException(status_code=403, detail=f"Cannot dispatch unverified resource {res_id}")

            if not resource.get("is_multi_capacity") and resource["status"] not in ["AVAILABLE", "ONLINE"]:
                raise HTTPException(status_code=409, detail=f"Resource {res_id} is currently {resource['status']} and cannot be double-booked.")

            new_status = "EN_ROUTE" # Initial active lifecycle status
            
            # 2. Concurrency-safe atomic status update
            upd = supabase.table('resources').update({
                "status": new_status,
                "assigned_incident_id": incident_id
            }).eq("id", res_id).eq("status", resource["status"]).execute()
            
            if not upd.data:
                raise HTTPException(status_code=409, detail=f"Concurrency collision: {res_id} was dispatched by another coordinator.")

            # 3. Create Rescue Assignment
            assignment_id = str(uuid.uuid4())
            assign_record = {
                "id": assignment_id,
                "incident_id": incident_id,
                "resource_id": res_id,
                "assigned_by": user_info.get("sub"),
                "status": new_status,
                "dispatch_time": now_ts,
                "notes": notes
            }
            supabase.table('rescue_assignments').insert(assign_record).execute()

            # 4. Create Immutable Audit Log
            supabase.table('resource_audit_logs').insert({
                "resource_id": res_id,
                "incident_id": incident_id,
                "assignment_id": assignment_id,
                "old_status": resource["status"],
                "new_status": new_status,
                "changed_by": user_info.get("sub"),
                "notes": f"Dispatched to incident {incident_id} by {user_info.get('role', 'OFFICER')} ({user_info.get('sub')}). Notes: {notes}"
            }).execute()

            dispatched_assignments.append({
                "assignment_id": assignment_id,
                "resource_id": res_id,
                "resource_name": resource.get("name"),
                "resource_type": resource.get("type"),
                "status": new_status,
                "dispatch_time": now_ts
            })

        # Update Incident status to RESCUE_DISPATCHED
        try:
            supabase.table('incidents').update({"status": "RESCUE_DISPATCHED"}).eq("id", incident_id).execute()
        except Exception:
            pass

        return {
            "status": "success",
            "message": f"Successfully dispatched {len(dispatched_assignments)} assets to incident {incident_id}.",
            "data": dispatched_assignments
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/assignments/{assignment_id}/lifecycle")
def update_assignment_lifecycle(
    assignment_id: str,
    payload: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_DISPATCH]))
):
    """
    Progresses the rescue lifecycle stage:
    DISPATCHED ➔ EN_ROUTE ➔ ON_SCENE (records arrival_time) ➔ RESCUING ➔ COMPLETED (records completion_time and frees resource back to AVAILABLE).
    """
    try:
        new_status = payload.get("status")
        notes = payload.get("notes", "")
        valid_statuses = ["DISPATCHED", "EN_ROUTE", "ON_SCENE", "RESCUING", "COMPLETED", "CANCELLED"]
        
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status {new_status}. Must be one of {valid_statuses}")

        # Fetch assignment
        assign_query = supabase.table('rescue_assignments').select("*").eq("id", assignment_id).execute()
        if not assign_query.data:
            raise HTTPException(status_code=404, detail="Rescue assignment not found")

        assignment = assign_query.data[0]
        res_id = assignment["resource_id"]
        old_status = assignment["status"]
        now_ts = datetime.now(timezone.utc).isoformat()

        update_fields = {"status": new_status, "updated_at": now_ts}
        if new_status == "ON_SCENE":
            update_fields["arrival_time"] = now_ts
        elif new_status == "COMPLETED":
            update_fields["completion_time"] = now_ts

        # 1. Update assignment
        supabase.table('rescue_assignments').update(update_fields).eq("id", assignment_id).execute()

        # 2. Update underlying Resource
        if new_status == "COMPLETED" or new_status == "CANCELLED":
            # Release resource back to pool
            supabase.table('resources').update({
                "status": "AVAILABLE",
                "assigned_incident_id": None
            }).eq("id", res_id).execute()
        else:
            supabase.table('resources').update({
                "status": new_status
            }).eq("id", res_id).execute()

        # 3. Create Audit Trail Entry
        supabase.table('resource_audit_logs').insert({
            "resource_id": res_id,
            "incident_id": assignment.get("incident_id"),
            "assignment_id": assignment_id,
            "old_status": old_status,
            "new_status": new_status,
            "changed_by": user_info.get("sub"),
            "notes": f"Lifecycle transition: {old_status} ➔ {new_status}. {notes}".strip()
        }).execute()

        return {
            "status": "success",
            "message": f"Assignment transitioned from {old_status} to {new_status}.",
            "data": {
                "assignment_id": assignment_id,
                "old_status": old_status,
                "new_status": new_status,
                "timestamp": now_ts
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assignments/active")
def list_active_assignments(
    incident_id: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_VIEW]))
):
    """Lists all currently active ongoing rescue operations."""
    try:
        query = supabase.table('rescue_assignments').select("*, resources(name, type, organization, district)").in_("status", ["DISPATCHED", "EN_ROUTE", "ON_SCENE", "RESCUING"])
        if incident_id:
            query = query.eq("incident_id", incident_id)
            
        response = query.order("dispatch_time", desc=True).execute()
        return {"data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit-trail")
def get_resource_audit_trail(
    resource_id: Optional[str] = None,
    incident_id: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_VIEW]))
):
    """Fetches chronological audit logs of all dispatch and status transitions."""
    try:
        query = supabase.table('resource_audit_logs').select("*")
        if resource_id:
            query = query.eq("resource_id", resource_id)
        if incident_id:
            query = query.eq("incident_id", incident_id)
            
        response = query.order("changed_at", desc=True).limit(100).execute()
        return {"data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics")
def get_resource_metrics(
    supabase: Client = Depends(get_supabase_client),
    user_info: dict = Depends(require_permissions([Permission.RESOURCE_VIEW]))
):
    """Aggregate real-time metrics of verified assets for EOC Command Center."""
    try:
        res = supabase.table('resources').select("type, status, verification_status").eq("verification_status", "VERIFIED").execute()
        
        metrics = {
            "available_ambulances": 0,
            "dispatched_ambulances": 0,
            "available_rescue_teams": 0,
            "active_rescue_teams": 0,
            "available_boats": 0,
            "available_medical_teams": 0
        }
        
        for r in (res.data or []):
            t = r.get("type")
            s = r.get("status")
            if t == "AMBULANCE":
                if s == "AVAILABLE": metrics["available_ambulances"] += 1
                elif s in ["DISPATCHED", "EN_ROUTE", "ON_SCENE", "TRANSPORTING"]: metrics["dispatched_ambulances"] += 1
            elif t == "RESCUE_TEAM":
                if s == "AVAILABLE": metrics["available_rescue_teams"] += 1
                elif s in ["ASSIGNED", "EN_ROUTE", "ON_SCENE", "RESCUING"]: metrics["active_rescue_teams"] += 1
            elif t == "BOAT" and s == "AVAILABLE":
                metrics["available_boats"] += 1
            elif t == "MEDICAL_TEAM" and s == "AVAILABLE":
                metrics["available_medical_teams"] += 1
                
        return {"data": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
