from typing import Dict, Any, Optional
from supabase import Client
from app.services.ai_extractor import AIExtractorService

class DialogueEngine:
    """
    Manages the conversational state machine for automated emergency calls.
    Handles dynamic branching based on structured NLP extractions or DTMF inputs.
    """
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.ai_extractor = AIExtractorService()

    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a dialogue node configuration from the database.
        """
        res = self.supabase.table("voice_dialogue_nodes").select("*").eq("id", node_id).execute()
        if not res.data:
            return None
        return res.data[0]

    def process_speech_input(self, call_id: str, current_node_id: str, speech_text: str) -> Dict[str, Any]:
        """
        Processes speech using the AI Extractor and transitions the state machine.
        """
        # 1. Extract intents using strict NLP
        assessment = self.ai_extractor.extract_intent(speech_text)
        
        # 2. Persist the assessment
        self.supabase.table("voice_assessments").insert({
            "call_id": call_id,
            "severity": assessment["severity"],
            "extracted_entities": assessment["entities"],
            "confidence_score": assessment["confidence"]
        }).execute()
        
        # 3. Determine the next node based on the current node's logic
        current_node = self.get_node(current_node_id)
        if not current_node:
            return {"action": "hangup", "reason": "invalid_node"}
            
        next_node_map = current_node.get("next_node_map", {})
        
        next_node_id = "END_CALL"
        if assessment["severity"] == "CRITICAL" and "critical" in next_node_map:
            next_node_id = next_node_map["critical"]
        elif assessment["severity"] == "NEEDS_ASSISTANCE" and "needs_assistance" in next_node_map:
            next_node_id = next_node_map["needs_assistance"]
        elif "default" in next_node_map:
            next_node_id = next_node_map["default"]
            
        if next_node_id == "END_CALL":
            return {"action": "hangup"}
            
        # Transition to next node
        next_node = self.get_node(next_node_id)
        return {
            "action": "play_node",
            "node_id": next_node_id,
            "prompt": next_node["prompt_text"] if next_node else {}
        }
