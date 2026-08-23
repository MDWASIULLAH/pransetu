from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class SOSSeverity(str, Enum):
    CRITICAL = 'CRITICAL'
    HIGH = 'HIGH'
    MEDIUM = 'MEDIUM'
    LOW = 'LOW'

class DeliveryState(str, Enum):
    CREATED = 'CREATED'
    STORED = 'STORED'
    RELAYING = 'RELAYING'
    RELAYED = 'RELAYED'
    GATEWAY_RECEIVED = 'GATEWAY_RECEIVED'
    SERVER_DELIVERED = 'SERVER_DELIVERED'
    CLOSED = 'CLOSED'

class SOSSource(str, Enum):
    ANDROID = 'ANDROID'
    IVR = 'IVR'
    EXTERNAL = 'EXTERNAL'

class SOSRecordCreate(BaseModel):
    sos_id: str = Field(description="Unique identifier generated at source")
    protocol_version: str = Field(default="1.0", description="Schema protocol version")
    device_id: str = Field(description="Originating device identifier")
    source: SOSSource = Field(description="Source of the SOS packet")
    latitude: float = Field(description="Latitude")
    longitude: float = Field(description="Longitude")
    accuracy_m: float = Field(description="Location accuracy in meters")
    location_timestamp: datetime = Field(description="Timestamp when the location was recorded")
    people_count: int = Field(default=1, description="Number of people involved")
    medical_required: bool = Field(default=False, description="Whether medical assistance is required")
    severity: SOSSeverity = Field(default=SOSSeverity.MEDIUM, description="Self-reported severity")
    message: Optional[str] = Field(default=None, description="Optional text message")
    hop_count: int = Field(default=0, description="Number of hops taken")
    ttl: int = Field(default=24, description="Time to live or max hops")
    relay_trail: Optional[List[str]] = Field(default=[], description="Path of nodes traversed")
    
    # Optional sensitive fields
    user_id: Optional[str] = None
    phone_reference: Optional[str] = None

class SOSRecordResponse(SOSRecordCreate):
    created_at: datetime
    delivery_state: DeliveryState
    incident_id: Optional[str] = None
    priority_score: Optional[int] = Field(default=None, description="Computed priority 0-100")
    acknowledged_by: Optional[str] = None

    class Config:
        from_attributes = True
