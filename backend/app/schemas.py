from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID
from typing import Literal, Optional, Dict, Any


# Organization Schemas
class OrganizationBase(BaseModel):
    name: str
    type: Literal["police", "medical"]


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[Literal["police", "medical"]] = None


class Organization(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# User Schemas
UserRole = Literal[
    "system_admin",
    "dispatcher",
    "police_worker",
    "police_chief",
    "triage_nurse",
    "er_doctor",
    "er_paramedic",
    "er_attending"
]


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole


class UserCreate(UserBase):
    cognito_sub: str
    org_id: UUID
    supervisor_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    supervisor_id: Optional[UUID] = None


class User(UserBase):
    id: UUID
    cognito_sub: str
    org_id: UUID
    supervisor_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Report Schemas
ReportState = Literal["draft", "in_progress", "under_review", "locked"]
ReportType = Literal["incident", "medical_chart"]


class ReportBase(BaseModel):
    schema_type: ReportType
    data: Dict[str, Any] = Field(default_factory=dict)


class ReportCreate(ReportBase):
    assigned_to: UUID


class ReportUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None
    state: Optional[ReportState] = None
    assigned_to: Optional[UUID] = None


class Report(ReportBase):
    id: UUID
    org_id: UUID
    created_by: UUID
    assigned_to: UUID
    state: ReportState
    version: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Report History Schema
class ReportHistory(BaseModel):
    id: UUID
    report_id: UUID
    modified_by: UUID
    data: Dict[str, Any]
    version: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Cognito User (from JWT token)
class CognitoUser(BaseModel):
    sub: str
    email: str
    org_id: Optional[str] = Field(default=None, alias="custom:org_id")
    role: Optional[UserRole] = Field(default=None, alias="custom:role")
    groups: Optional[list[str]] = Field(default=None, alias="cognito:groups")
    
    class Config:
        populate_by_name = True
