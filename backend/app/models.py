from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="organization", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("type IN ('police', 'medical')", name="check_org_type"),
        Index("idx_organizations_type", "type"),
    )


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cognito_sub = Column(String(255), nullable=False, unique=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    role = Column(String(50), nullable=False)
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    supervisor = relationship("User", remote_side=[id], backref="subordinates")
    created_reports = relationship("Report", foreign_keys="Report.created_by", back_populates="creator")
    assigned_reports = relationship("Report", foreign_keys="Report.assigned_to", back_populates="assignee")
    
    __table_args__ = (
        CheckConstraint(
            "role IN ('system_admin', 'dispatcher', 'police_worker', 'police_chief', "
            "'triage_nurse', 'er_doctor', 'er_paramedic', 'er_attending')",
            name="check_user_role"
        ),
        Index("idx_users_org_id", "org_id"),
        Index("idx_users_role", "role"),
        Index("idx_users_supervisor_id", "supervisor_id"),
        Index("idx_users_cognito_sub", "cognito_sub"),
    )


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    state = Column(String(20), nullable=False, default="draft")
    schema_type = Column(String(50), nullable=False)
    data = Column(JSONB, nullable=False, default={})
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="reports")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_reports")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_reports")
    history = relationship("ReportHistory", back_populates="report", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("state IN ('draft', 'in_progress', 'under_review', 'locked')", name="check_report_state"),
        CheckConstraint("schema_type IN ('incident', 'medical_chart')", name="check_schema_type"),
        Index("idx_reports_org_id", "org_id"),
        Index("idx_reports_state", "state"),
        Index("idx_reports_assigned_to", "assigned_to"),
        Index("idx_reports_created_at", "created_at"),
        Index("idx_reports_data_gin", "data", postgresql_using="gin"),
    )


class ReportHistory(Base):
    __tablename__ = "report_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    modified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    data = Column(JSONB, nullable=False)
    version = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    report = relationship("Report", back_populates="history")
    modifier = relationship("User")
    
    __table_args__ = (
        Index("idx_report_history_report_id", "report_id"),
        Index("idx_report_history_created_at", "created_at"),
    )
