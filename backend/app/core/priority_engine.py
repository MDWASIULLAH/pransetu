from supabase import Client
from datetime import datetime, timezone
import math
import logging

logger = logging.getLogger(__name__)

def evaluate_incident_priority(supabase: Client, incident_id: str) -> dict:
    """
    Evaluates the Domino-AI heuristic priority score for a given incident.
    Returns the score and a list of human-readable explainable factors.
    """
    try:
        # 1. Fetch the raw context via PostGIS RPC
        context_res = supabase.rpc("get_incident_priority_context", {"p_incident_id": incident_id}).execute()
        
        if not context_res.data:
            raise ValueError(f"Incident {incident_id} not found or has no context.")
            
        ctx = context_res.data[0]
        
        score = 0.0
        factors = []
        
        # Base Urgency (Max 40 points)
        medical = ctx.get('medical_count') or 0
        critical = ctx.get('critical_count') or 0
        total_sos = ctx.get('sos_count') or 1
        
        if medical > 0:
            score += 25
            factors.append(f"+ Medical emergency ({medical} cases) (+25 pts)")
        
        if critical > medical:
            added = 15
            score += added
            factors.append(f"+ High hazard severity ({critical} critical signals) (+{added} pts)")
            
        # Scale (Max 25 points) - Logarithmic scaling for people affected
        people = ctx.get('affected_people') or 1
        if people > 1:
            pts = min(25.0, round(10 * math.log10(people), 1))
            score += pts
            factors.append(f"+ {people} people affected (+{pts} pts)")
            
        # Age/Waiting time (Max 15 points)
        latest = ctx.get('latest_activity')
        if latest:
            latest_dt = datetime.fromisoformat(latest.replace('Z', '+00:00'))
            mins_waiting = (datetime.now(timezone.utc) - latest_dt).total_seconds() / 60
            if mins_waiting > 10:
                pts = min(15.0, round(mins_waiting / 10, 1))
                score += pts
                factors.append(f"+ Waiting {int(mins_waiting)} minutes (+{pts} pts)")
                
        # Rescue Proximity (Max 10 points)
        res_km = ctx.get('nearest_resource_km')
        if res_km is not None:
            if res_km < 10:
                pts = round(10.0 - res_km, 1)
                score += pts
                factors.append(f"+ Available Rescue Team {res_km:.1f}km away (+{pts} pts)")
            else:
                factors.append(f"- Nearest team is {res_km:.1f}km away (-0 pts)")
        else:
            factors.append(f"- No available resources found globally (-0 pts)")
            
        # Shelter Proximity (Max 10 points)
        shelter_km = ctx.get('nearest_shelter_km')
        if shelter_km is not None and shelter_km < 5:
            pts = round(5.0 - shelter_km, 1)
            score += pts
            factors.append(f"+ Operational Shelter {shelter_km:.1f}km away (+{pts} pts)")
            
        # Location Penalty
        # If the incident hasn't been properly clustered/located yet
        if ctx.get('affected_people') == 0:
            score -= 10
            factors.append(f"- Location confidence low (-10 pts)")
            
        # Cap score between 0 and 100
        final_score = round(max(0.0, min(100.0, score)), 1)
        
        # Save back to database
        payload = {
            "priority_score": final_score,
            "priority_factors": {"score": final_score, "factors": factors}
        }
        
        supabase.table('incidents').update(payload).eq('id', incident_id).execute()
        
        return payload

    except Exception as e:
        logger.error(f"Failed to evaluate priority for incident {incident_id}: {e}")
        raise e
