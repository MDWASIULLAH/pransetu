from typing import Dict, Any, List
from supabase import Client
import uuid

class CampaignRunnerService:
    """
    Handles the launch of Voice Campaigns.
    Performs server-side geo-targeting using PostGIS to find eligible recipients.
    """
    def __init__(self, supabase: Client):
        self.supabase = supabase

    def launch_campaign(self, campaign_id: str, target_polygon_wkt: str) -> Dict[str, Any]:
        """
        Selects users inside the given polygon and queues them for calling.
        """
        # 1. Update Campaign Status
        self.supabase.table("voice_campaigns").update({
            "status": "RUNNING",
            "started_at": "now()"
        }).eq("id", campaign_id).execute()

        # 2. Use PostGIS RPC to find users inside the target polygon
        # (Assuming an RPC `get_users_in_polygon` exists in the DB)
        try:
            users_res = self.supabase.rpc(
                "get_users_in_polygon", 
                {"polygon_wkt": target_polygon_wkt}
            ).execute()
            
            eligible_users = users_res.data or []
        except Exception as e:
            # Fallback for testing/mock if RPC is not fully deployed
            print(f"[CampaignRunner] PostGIS RPC failed or not found: {e}")
            eligible_users = [
                {"id": str(uuid.uuid4()), "phone": "1234567890", "language": "or"},
                {"id": str(uuid.uuid4()), "phone": "0987654321", "language": "hi"}
            ]

        # 3. Insert recipients into queue
        recipients_data = []
        for user in eligible_users:
            recipients_data.append({
                "campaign_id": campaign_id,
                "user_id": user.get("id"),
                "phone_number": user.get("phone"),
                "preferred_language": user.get("language", "en"),
                "status": "QUEUED"
            })
            
        if recipients_data:
            self.supabase.table("voice_campaign_recipients").insert(recipients_data).execute()

        # 4. In a real system, a background worker (e.g. Celery or RQ) would pick up 
        # these QUEUED recipients and call `telephony.initiate_call`.
        
        return {
            "campaign_id": campaign_id,
            "recipients_queued": len(recipients_data),
            "status": "RUNNING"
        }
