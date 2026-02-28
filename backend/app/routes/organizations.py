from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.database import get_db
from app.schemas import Organization, OrganizationCreate, OrganizationUpdate, CognitoUser
from app.services.organization_service import OrganizationService
from app.middleware.auth import get_current_user, require_role

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


@router.post("/", response_model=Organization, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(require_role("system_admin"))
):
    """Create a new organization (system_admin only)"""
    return await OrganizationService.create(db, org_data)


@router.get("/", response_model=list[Organization])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(require_role("system_admin"))
):
    """List all organizations (system_admin only)"""
    return await OrganizationService.list_all(db)


@router.get("/{org_id}", response_model=Organization)
async def get_organization(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(get_current_user)
):
    """Get organization by ID"""
    # Users can only view their own organization unless they're system_admin
    if str(org_id) != current_user.org_id and current_user.role != "system_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    org = await OrganizationService.get_by_id(db, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return org


@router.patch("/{org_id}", response_model=Organization)
async def update_organization(
    org_id: UUID,
    org_data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(require_role("system_admin"))
):
    """Update organization (system_admin only)"""
    org = await OrganizationService.update(db, org_id, org_data)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return org


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(require_role("system_admin"))
):
    """Delete organization (system_admin only)"""
    deleted = await OrganizationService.delete(db, org_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
