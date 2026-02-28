from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from typing import Optional, List
from app.models import Report, ReportHistory, User
from app.schemas import ReportCreate, ReportUpdate


class ReportService:
    """Service for managing reports"""
    
    @staticmethod
    async def create(
        db: AsyncSession,
        report_data: ReportCreate,
        created_by: UUID,
        org_id: UUID
    ) -> Report:
        """Create a new report"""
        report = Report(
            org_id=org_id,
            created_by=created_by,
            assigned_to=report_data.assigned_to,
            schema_type=report_data.schema_type,
            data=report_data.data,
            state="draft",
            version=1
        )
        
        db.add(report)
        await db.commit()
        await db.refresh(report)
        
        # Create initial history entry
        history = ReportHistory(
            report_id=report.id,
            modified_by=created_by,
            data=report.data,
            version=1
        )
        db.add(history)
        await db.commit()
        
        return report
    
    @staticmethod
    async def get_by_id(db: AsyncSession, report_id: UUID) -> Optional[Report]:
        """Get report by ID"""
        result = await db.execute(
            select(Report).where(Report.id == report_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_by_organization(
        db: AsyncSession,
        org_id: UUID,
        state: Optional[str] = None,
        assigned_to: Optional[UUID] = None
    ) -> List[Report]:
        """List reports for an organization with optional filters"""
        query = select(Report).where(Report.org_id == org_id)
        
        if state:
            query = query.where(Report.state == state)
        
        if assigned_to:
            query = query.where(Report.assigned_to == assigned_to)
        
        query = query.order_by(Report.created_at.desc())
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def list_by_user(
        db: AsyncSession,
        user_id: UUID,
        state: Optional[str] = None
    ) -> List[Report]:
        """List reports assigned to a user"""
        query = select(Report).where(Report.assigned_to == user_id)
        
        if state:
            query = query.where(Report.state == state)
        
        query = query.order_by(Report.created_at.desc())
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def update(
        db: AsyncSession,
        report_id: UUID,
        report_data: ReportUpdate,
        modified_by: UUID
    ) -> Optional[Report]:
        """Update a report and create history entry"""
        report = await ReportService.get_by_id(db, report_id)
        if not report:
            return None
        
        # Check if report is locked
        if report.state == "locked":
            raise ValueError("Cannot update a locked report")
        
        # Update fields
        if report_data.data is not None:
            report.data = report_data.data
            report.version += 1
            
            # Create history entry
            history = ReportHistory(
                report_id=report.id,
                modified_by=modified_by,
                data=report.data,
                version=report.version
            )
            db.add(history)
        
        if report_data.state is not None:
            # Validate state transition
            if not ReportService._is_valid_state_transition(report.state, report_data.state):
                raise ValueError(f"Invalid state transition from {report.state} to {report_data.state}")
            report.state = report_data.state
        
        if report_data.assigned_to is not None:
            report.assigned_to = report_data.assigned_to
        
        await db.commit()
        await db.refresh(report)
        
        return report
    
    @staticmethod
    def _is_valid_state_transition(current_state: str, new_state: str) -> bool:
        """Validate state transitions"""
        valid_transitions = {
            "draft": ["in_progress", "locked"],
            "in_progress": ["under_review", "draft"],
            "under_review": ["locked", "in_progress"],
            "locked": []  # Cannot transition from locked
        }
        
        return new_state in valid_transitions.get(current_state, [])
    
    @staticmethod
    async def delete(db: AsyncSession, report_id: UUID) -> bool:
        """Delete a report (only if in draft state)"""
        report = await ReportService.get_by_id(db, report_id)
        if not report:
            return False
        
        # Only allow deletion of draft reports
        if report.state != "draft":
            raise ValueError("Can only delete reports in draft state")
        
        await db.delete(report)
        await db.commit()
        
        return True
    
    @staticmethod
    async def get_history(
        db: AsyncSession,
        report_id: UUID
    ) -> List[ReportHistory]:
        """Get version history for a report"""
        result = await db.execute(
            select(ReportHistory)
            .where(ReportHistory.report_id == report_id)
            .order_by(ReportHistory.version.desc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def can_user_access_report(
        db: AsyncSession,
        report: Report,
        user_id: UUID,
        user_role: str,
        user_org_id: UUID
    ) -> bool:
        """Check if user can access a report"""
        # System admin can access all reports
        if user_role == "system_admin":
            return True
        
        # User must be in same organization
        if str(report.org_id) != str(user_org_id):
            return False
        
        # User can access if they created it or it's assigned to them
        if str(report.created_by) == str(user_id) or str(report.assigned_to) == str(user_id):
            return True
        
        # Supervisors can access their subordinates' reports
        result = await db.execute(
            select(User).where(User.id == report.assigned_to)
        )
        assigned_user = result.scalar_one_or_none()
        
        if assigned_user and assigned_user.supervisor_id == user_id:
            return True
        
        # Chiefs and attendings can view all reports in their org
        if user_role in ["police_chief", "er_attending"]:
            return True
        
        return False
    
    @staticmethod
    async def can_user_edit_report(
        db: AsyncSession,
        report: Report,
        user_id: UUID,
        user_role: str
    ) -> bool:
        """Check if user can edit a report"""
        # Cannot edit locked reports
        if report.state == "locked":
            return False
        
        # System admin can edit all reports
        if user_role == "system_admin":
            return True
        
        # User can edit if it's assigned to them
        if str(report.assigned_to) == str(user_id):
            return True
        
        # Chiefs and attendings can edit reports in under_review state
        if report.state == "under_review" and user_role in ["police_chief", "er_attending"]:
            return True
        
        return False
