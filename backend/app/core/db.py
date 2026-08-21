from supabase import create_client, Client
from app.core.config import settings
import os

def get_supabase_client() -> Client:
    """Returns a Supabase client configured with the service role key to bypass RLS for backend operations."""
    url = os.environ.get("SUPABASE_URL", settings.SUPABASE_URL)
    key = os.environ.get("SUPABASE_KEY", settings.SUPABASE_KEY)
    
    if not url or not key:
         raise ValueError("Supabase URL and Key must be set in environment variables")
         
    supabase: Client = create_client(url, key)
    return supabase
