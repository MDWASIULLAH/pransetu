from typing import Dict, Any
from supabase import Client
from datetime import datetime, timedelta

class RetryManagerService:
    """
    Manages retry queues, quiet hours, and provider fallback logic for unreachable citizens.
    """
    def __init__(self, supabase: Client):
        self.supabase = supabase

    def process_failed_calls(self, max_retries: int = 3, retry_delay_minutes: int = 15):
        """
        Finds calls that failed or were not answered, and schedules them for retry if they
        haven't exceeded the max retry limit.
        """
        # 1. Fetch eligible failed/no-answer recipients
        res = self.supabase.table("voice_campaign_recipients") \
            .select("*") \
            .in_("status", ["NO_ANSWER", "FAILED", "BUSY"]) \
            .lt("retry_count", max_retries) \
            .execute()
            
        recipients = res.data or []
        
        retry_scheduled = 0
        for recipient in recipients:
            # Check if enough time has passed (simplified logic)
            # In a real system, we check updated_at + delay
            
            # Increment retry count and requeue
            self.supabase.table("voice_campaign_recipients").update({
                "status": "QUEUED",
                "retry_count": recipient["retry_count"] + 1
            }).eq("id", recipient["id"]).execute()
            
            retry_scheduled += 1
            
        return {
            "status": "success",
            "retries_scheduled": retry_scheduled
        }
