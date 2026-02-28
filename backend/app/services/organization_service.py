from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.models import Organization
from app.schemas import OrganizationCreate, OrganizationUpdate


class OrganizationService:
    @staticmethod
    async def create(db: AsyncSession, org_data: OrganizationCreate) -> Organization:
        """Create a new organization"""
        org = Organization(**org_data.model_dump())
        db.add(org)
        await db.commit()
        await db.refresh(org)
        return org
    
    @staticmethod
    async def get_by_id(db: AsyncSession, org_id: UUID) -> Organization | None:
        """Get organization by ID"""
        result = await db.execute(
            select(Organization).where(Organization.id == org_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_all(db: AsyncSession) -> list[Organization]:
        """List all organizations"""
        result = await db.execute(
            select(Organization).order_by(Organization.created_at.desc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def update(
        db: AsyncSession,
        org_id: UUID,
        org_data: OrganizationUpdate
    ) -> Organization | None:
        """Update organization"""
        org = await OrganizationService.get_by_id(db, org_id)
        if not org:
            return None
        
        update_data = org_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(org, field, value)
        
        await db.commit()
        await db.refresh(org)
        return org
    
    @staticmethod
    async def delete(db: AsyncSession, org_id: UUID) -> bool:
        """Delete organization"""
        org = await OrganizationService.get_by_id(db, org_id)
        if not org:
            return False
        
        await db.delete(org)
        await db.commit()
        return True
