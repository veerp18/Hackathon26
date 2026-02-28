from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.database import get_db
from app.schemas import User, UserCreate, UserUpdate, CognitoUser
from app.services.user_service import UserService
from app.middleware.auth import get_current_user, require_role

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(require_role("system_admin"))
):
    """Create a new user (system_admin only)"""
    return await UserService.create(db, user_data)


@router.get("/me", response_model=User)
async def get_current_user_profile(
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(get_current_user)
):
    """Get current user profile"""
    user = await UserService.get_by_cognito_sub(db, current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/organization/{org_id}", response_model=list[User])
async def list_users_in_organization(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(get_current_user)
):
    """List users in an organization"""
    # Users can only list users in their own organization
    if str(org_id) != current_user.org_id and current_user.role != "system_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return await UserService.list_by_organization(db, org_id)


@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(get_current_user)
):
    """Get user by ID"""
    user = await UserService.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Users can only view users in their own organization
    if str(user.org_id) != current_user.org_id and current_user.role != "system_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return user


@router.patch("/{user_id}", response_model=User)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(require_role("system_admin"))
):
    """Update user (system_admin only)"""
    user = await UserService.update(db, user_id, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CognitoUser = Depends(require_role("system_admin"))
):
    """Delete user (system_admin only)"""
    deleted = await UserService.delete(db, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
