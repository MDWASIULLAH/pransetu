from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Import routers later
# from app.api import sos, incidents, webhooks

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict to frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "PRANSETU Backend Operational"}

from app.api import sos, webhook, safeverify, incidents, resources, shelters, command_center, domino_ai, alerts, auth, audit, voice_campaigns, voice_webhooks, citizens

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["audit"])
app.include_router(sos.router, prefix=f"{settings.API_V1_STR}/sos", tags=["sos"])
app.include_router(webhook.router, prefix=f"{settings.API_V1_STR}/webhooks", tags=["webhooks"])
app.include_router(safeverify.router, prefix=f"{settings.API_V1_STR}/safeverify", tags=["safeverify"])
app.include_router(incidents.router, prefix=f"{settings.API_V1_STR}/incidents", tags=["incidents"])
app.include_router(resources.router, prefix=f"{settings.API_V1_STR}/resources", tags=["resources"])
app.include_router(shelters.router, prefix=f"{settings.API_V1_STR}/shelters", tags=["shelters"])
app.include_router(command_center.router, prefix=f"{settings.API_V1_STR}/command-center", tags=["command-center"])
app.include_router(domino_ai.router, prefix=f"{settings.API_V1_STR}/domino-ai", tags=["domino-ai"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["alerts"])
app.include_router(voice_campaigns.router, prefix=f"{settings.API_V1_STR}/voice-campaigns", tags=["voice-campaigns"])
app.include_router(voice_webhooks.router, prefix=f"{settings.API_V1_STR}/voice-webhooks", tags=["voice-webhooks"])
app.include_router(citizens.router, prefix=f"{settings.API_V1_STR}/citizens", tags=["citizens"])
