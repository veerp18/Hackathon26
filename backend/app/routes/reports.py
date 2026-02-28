from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional, List
from app.database import get_db
from app.schemas import (
    Report, ReportCreate, ReportUpdate, ReportHistory as ReportHistorySchema,
    CognitoUser
)
from app.services.report_service import ReportService
from app.services.user_service import UserService
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/", response_model=Report, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(get_current_user)
):
    """Create a new report"""
    # Get current user from database
    db_user = await UserService.get_by_cognito_sub(db, current_user.sub)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify assigned user exists and is in same organization
    assigned_user = await UserService.get_by_id(db, report_data.assigned_to)
    if not assigned_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned user not found"
        )
    
    if assigned_user.org_id != db_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot assign report to user in different organization"
        )
    
    try:
        report = await ReportService.create(
            db,
            report_data,
            created_by=db_user.id,
            org_id=db_user.org_id
        )
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create report: {str(e)}"
        )


@router.get("/", response_model=List[Report])
async def list_reports(
    state: Optional[str] = Query(None, description="Filter by state"),
    assigned_to_me: bool = Query(False, description="Show only reports assigned to me"),
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(get_current_user)
):
    """List reports (filtered by organization and optional parameters)"""
    # Get current user from database
    db_user = await UserService.get_by_cognito_sub(db, current_user.sub)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if assigned_to_me:
        # Get reports assigned to current user
        reports = await ReportService.list_by_user(db, db_user.id, state)
    else:
        # Get all reports in user's organization
        reports = await ReportService.list_by_organization(
            db,
            db_user.org_id,
            state=state
        )
    
    # Filter reports based on access permissions
    accessible_reports = []
    for report in reports:
        if await ReportService.can_user_access_report(
            db, report, db_user.id, db_user.role, db_user.org_id
        ):
            accessible_reports.append(report)
    
    return accessible_reports


@router.get("/{report_id}", response_model=Report)
async def get_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(get_current_user)
):
    """Get a specific report"""
    # Get current user from database
    db_user = await UserService.get_by_cognito_sub(db, current_user.sub)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    report = await ReportService.get_by_id(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check access permissions
    if not await ReportService.can_user_access_report(
        db, report, db_user.id, db_user.role, db_user.org_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return report


@router.patch("/{report_id}", response_model=Report)
async def update_report(
    report_id: UUID,
    report_data: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(get_current_user)
):
    """Update a report"""
    # Get current user from database
    db_user = await UserService.get_by_cognito_sub(db, current_user.sub)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    report = await ReportService.get_by_id(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check edit permissions
    if not await ReportService.can_user_edit_report(
        db, report, db_user.id, db_user.role
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this report"
        )
    
    try:
        updated_report = await ReportService.update(
            db, report_id, report_data, modified_by=db_user.id
        )
        return updated_report
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update report: {str(e)}"
        )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(get_current_user)
):
    """Delete a report (only draft reports)"""
    # Get current user from database
    db_user = await UserService.get_by_cognito_sub(db, current_user.sub)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    report = await ReportService.get_by_id(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Only creator or system admin can delete
    if str(report.created_by) != str(db_user.id) and db_user.role != "system_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator can delete this report"
        )
    
    try:
        deleted = await ReportService.delete(db, report_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{report_id}/history", response_model=List[ReportHistorySchema])
async def get_report_history(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(get_current_user)
):
    """Get version history for a report"""
    # Get current user from database
    db_user = await UserService.get_by_cognito_sub(db, current_user.sub)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    report = await ReportService.get_by_id(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check access permissions
    if not await ReportService.can_user_access_report(
        db, report, db_user.id, db_user.role, db_user.org_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    history = await ReportService.get_history(db, report_id)
    return history
