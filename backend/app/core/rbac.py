from enum import Enum
from typing import List, Dict

class Role(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    DISASTER_MANAGEMENT_OFFICER = "DISASTER_MANAGEMENT_OFFICER"
    EOC_OPERATOR = "EOC_OPERATOR"
    RESCUE_COORDINATOR = "RESCUE_COORDINATOR"
    OBSERVER = "OBSERVER"

class Permission(str, Enum):
    # SOS
    SOS_VIEW = "sos.view"
    SOS_ACKNOWLEDGE = "sos.acknowledge"
    SOS_ESCALATE = "sos.escalate"
    SOS_EXACT_LOCATION = "sos.exact_location"
    SOS_MASK_PHONE = "sos.mask_phone"
    # Incidents
    INCIDENT_VIEW = "incident.view"
    INCIDENT_MANAGE = "incident.manage"
    INCIDENT_PRIORITY_CHANGE = "incident.priority.change"
    # Rescue
    RESCUE_VIEW = "rescue.view"
    RESCUE_ASSIGN = "rescue.assign"
    RESCUE_DISPATCH = "rescue.dispatch"
    # Resources & Logistics
    RESOURCE_VIEW = "resource.view"
    RESOURCE_REGISTER = "resource.register"
    RESOURCE_VERIFY = "resource.verify"
    RESOURCE_MANAGE = "resource.manage"
    RESOURCE_DISPATCH = "resource.dispatch"
    # Shelters & Evacuation
    SHELTER_VIEW = "shelter.view"
    SHELTER_MANAGE = "shelter.manage"
    SHELTER_STATUS_UPDATE = "shelter.status_update"
    SHELTER_INTAKE = "shelter.intake"
    # IVR & Voice
    CAMPAIGN_VIEW = "campaign.view"
    CAMPAIGN_CREATE = "campaign.create"
    # Alerts
    ALERT_PUBLISH = "alert.publish"
    # Admin
    USERS_MANAGE = "users.manage"
    SYSTEM_CONFIG = "system.config"
    AUDIT_VIEW = "audit.view"

ROLE_PERMISSIONS: Dict[Role, List[Permission]] = {
    Role.SUPER_ADMIN: [p for p in Permission],
    Role.DISASTER_MANAGEMENT_OFFICER: [
        Permission.SOS_VIEW, Permission.SOS_EXACT_LOCATION, Permission.SOS_MASK_PHONE,
        Permission.INCIDENT_VIEW, Permission.INCIDENT_MANAGE, Permission.INCIDENT_PRIORITY_CHANGE,
        Permission.RESCUE_VIEW, Permission.RESCUE_ASSIGN, Permission.RESCUE_DISPATCH,
        Permission.RESOURCE_VIEW, Permission.RESOURCE_REGISTER, Permission.RESOURCE_MANAGE, Permission.RESOURCE_DISPATCH,
        Permission.SHELTER_VIEW, Permission.SHELTER_MANAGE, Permission.SHELTER_STATUS_UPDATE, Permission.SHELTER_INTAKE,
        Permission.CAMPAIGN_VIEW, Permission.CAMPAIGN_CREATE, Permission.ALERT_PUBLISH
    ],
    Role.EOC_OPERATOR: [
        Permission.SOS_VIEW, Permission.SOS_ACKNOWLEDGE, Permission.SOS_ESCALATE,
        Permission.SOS_EXACT_LOCATION, Permission.SOS_MASK_PHONE,
        Permission.INCIDENT_VIEW, Permission.INCIDENT_MANAGE,
        Permission.RESOURCE_VIEW, Permission.RESOURCE_REGISTER,
        Permission.SHELTER_VIEW, Permission.SHELTER_STATUS_UPDATE, Permission.SHELTER_INTAKE,
        Permission.CAMPAIGN_VIEW
    ],
    Role.RESCUE_COORDINATOR: [
        Permission.INCIDENT_VIEW, Permission.RESCUE_VIEW, Permission.RESCUE_ASSIGN, Permission.RESCUE_DISPATCH,
        Permission.RESOURCE_VIEW, Permission.RESOURCE_DISPATCH,
        Permission.SHELTER_VIEW, Permission.SHELTER_INTAKE
    ],
    Role.OBSERVER: [
        Permission.SOS_VIEW, Permission.INCIDENT_VIEW, Permission.RESCUE_VIEW, Permission.RESOURCE_VIEW, Permission.SHELTER_VIEW
    ]
}

def has_permission(role: str, permission: str) -> bool:
    try:
        enum_role = Role(role)
        enum_perm = Permission(permission)
        return enum_perm in ROLE_PERMISSIONS.get(enum_role, [])
    except ValueError:
        return False
