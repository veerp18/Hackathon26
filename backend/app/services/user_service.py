from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.models import User
from app.schemas import UserCreate, UserUpdate


class UserService:
    @staticmethod
    async def create(db: AsyncSession, user_data: UserCreate) -> User:
        """Create a new user"""
        user = User(**user_data.model_dump())
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: UUID) -> User | None:
        """Get user by ID"""
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_by_cognito_sub(db: AsyncSession, cognito_sub: str) -> User | None:
        """Get user by Cognito sub"""
        result = await db.execute(
            select(User).where(User.cognito_sub == cognito_sub)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_by_organization(db: AsyncSession, org_id: UUID) -> list[User]:
        """List users in an organization"""
        result = await db.execute(
            select(User)
            .where(User.org_id == org_id)
            .order_by(User.created_at.desc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_subordinates(db: AsyncSession, supervisor_id: UUID) -> list[User]:
        """Get subordinates of a supervisor"""
        result = await db.execute(
            select(User).where(User.supervisor_id == supervisor_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def update(
        db: AsyncSession,
        user_id: UUID,
        user_data: UserUpdate
    ) -> User | None:
        """Update user"""
        user = await UserService.get_by_id(db, user_id)
        if not user:
            return None
        
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def delete(db: AsyncSession, user_id: UUID) -> bool:
        """Delete user"""
        user = await UserService.get_by_id(db, user_id)
        if not user:
            return False
        
        await db.delete(user)
        await db.commit()
        return True
