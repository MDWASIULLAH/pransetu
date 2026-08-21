from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PRANSETU Backend"
    API_V1_STR: str = "/api/v1"
    
    SUPABASE_URL: str
    SUPABASE_KEY: str # Service role key required for backend bypass of RLS
    SUPABASE_JWT_SECRET: str
    
    TWILIO_AUTH_TOKEN: str = "your-twilio-auth-token-here"
    
    class Config:
        env_file = ".env"

settings = Settings()
