from typing import Dict, Any, List
from supabase import Client
import uuid

class RulesEngine:
    """
    Evaluates policy rules against voice assessments.
    Never allows arbitrary AI dispatch; strictly enforces predefined escalation paths.
    """
    def __init__(self, supabase: Client):
        self.supabase = supabase

    def evaluate_assessment(self, assessment_id: str) -> List[Dict[str, Any]]:
        """
        Reads an assessment and triggers appropriate actions (e.g., creating an escalation record).
        """
        res = self.supabase.table("voice_assessments").select("*, voice_calls(recipient_id, voice_campaign_recipients(*))").eq("id", assessment_id).execute()
        if not res.data:
            return []
            
        assessment = res.data[0]
        severity = assessment.get("severity")
        entities = assessment.get("extracted_entities", {})
        
        actions_taken = []
        
        # Rule 1: CRITICAL trapped/injured -> Escalation
        if severity == "CRITICAL" and (entities.get("trapped") or entities.get("injured")):
            escalation_record = {
                "assessment_id": assessment_id,
                "rule_fired": "CRITICAL_TRAPPED_INJURED",
                "action_taken": "CREATE_DISPATCH_QUEUE_ITEM"
            }
            self.supabase.table("voice_escalations").insert(escalation_record).execute()
            actions_taken.append(escalation_record)
            
            # NOTE: In a full system, this would also push an alert to the operator dashboard
            # via Supabase Realtime so the operator can manually authorize physical dispatch.

        # Rule 2: NEEDS_ASSISTANCE supplies -> Resource Request
        elif severity == "NEEDS_ASSISTANCE" and entities.get("supplies_required"):
            escalation_record = {
                "assessment_id": assessment_id,
                "rule_fired": "NEEDS_ASSISTANCE_SUPPLIES",
                "action_taken": "LOG_RESOURCE_REQUEST"
            }
            self.supabase.table("voice_escalations").insert(escalation_record).execute()
            actions_taken.append(escalation_record)
            
        return actions_taken
