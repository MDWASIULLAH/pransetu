from typing import Dict, Any, List
from supabase import Client

class HotspotAggregatorService:
    """
    Integrates voice-confirmed emergencies with the existing SOS hotspot system.
    Identifies high-confidence hotspots based on geographic and temporal clustering.
    """
    def __init__(self, supabase: Client):
        self.supabase = supabase

    def evaluate_hotspots(self, radius_m: float = 500.0, time_window_hours: int = 2) -> Dict[str, Any]:
        """
        Queries the database to cluster recent SOS events and Critical Voice Assessments.
        """
        # In a real implementation, this would use PostGIS ST_ClusterDBSCAN or similar
        # to find dense clusters of critical events.
        
        # Simulated PostGIS RPC call
        try:
            res = self.supabase.rpc(
                "aggregate_emergency_hotspots",
                {
                    "radius_meters": radius_m,
                    "time_window_hrs": time_window_hours
                }
            ).execute()
            
            hotspots = res.data or []
            return {
                "status": "success",
                "hotspots_detected": len(hotspots),
                "data": hotspots
            }
        except Exception as e:
            print(f"[HotspotAggregator] Failed to run PostGIS aggregation: {e}")
            return {
                "status": "error",
                "reason": str(e)
            }
