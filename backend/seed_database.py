#!/usr/bin/env python3
"""
Seed the database with initial organizations and users
"""
import asyncio
from uuid import UUID
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Organization, User


# Cognito user data (from COGNITO_USERS.md)
COGNITO_USERS = {
    "admin@cuhackit.com": {
        "sub": "f4984458-0021-704f-94bb-be1886b2cc02",
        "role": "system_admin",
        "org_type": None  # System admin doesn't belong to an org
    },
    "dispatcher@cuhackit.com": {
        "sub": "245844f8-f0e1-70f6-6997-00ce87e73fa9",
        "role": "dispatcher",
        "org_type": "police"
    },
    "police-worker@cuhackit.com": {
        "sub": "d4f86428-90f1-7084-3bd2-2790aa133007",
        "role": "police_worker",
        "org_type": "police"
    },
    "police-chief@cuhackit.com": {
        "sub": "34286488-f061-7029-ba00-5e87fc9ed2cb",
        "role": "police_chief",
        "org_type": "police"
    },
    "triage-nurse@cuhackit.com": {
        "sub": "5468a498-9031-706d-6d99-5b254d13d7e0",
        "role": "triage_nurse",
        "org_type": "medical"
    },
    "er-doctor@cuhackit.com": {
        "sub": "a408c438-3021-7004-9890-de18a32ef106",
        "role": "er_doctor",
        "org_type": "medical"
    },
    "er-paramedic@cuhackit.com": {
        "sub": "04f8c438-c081-7009-dd53-8da667fc6840",
        "role": "er_paramedic",
        "org_type": "medical"
    },
    "er-attending@cuhackit.com": {
        "sub": "14088498-60c1-706b-5780-c3c08f9c1794",
        "role": "er_attending",
        "org_type": "medical"
    }
}


async def seed_database():
    """Seed the database with initial data"""
    async with AsyncSessionLocal() as session:
        try:
            # Create organizations
            print("Creating organizations...")
            
            # Check if organizations already exist
            result = await session.execute(select(Organization))
            existing_orgs = result.scalars().all()
            
            if existing_orgs:
                print(f"Found {len(existing_orgs)} existing organizations")
                police_org = next((org for org in existing_orgs if org.type == "police"), None)
                medical_org = next((org for org in existing_orgs if org.type == "medical"), None)
            else:
                police_org = None
                medical_org = None
            
            if not police_org:
                police_org = Organization(
                    name="City Police Department",
                    type="police"
                )
                session.add(police_org)
                print("✓ Created City Police Department")
            
            if not medical_org:
                medical_org = Organization(
                    name="City General Hospital",
                    type="medical"
                )
                session.add(medical_org)
                print("✓ Created City General Hospital")
            
            await session.commit()
            await session.refresh(police_org)
            await session.refresh(medical_org)
            
            # Create users
            print("\nCreating users...")
            
            for email, user_data in COGNITO_USERS.items():
                # Check if user already exists
                result = await session.execute(
                    select(User).where(User.cognito_sub == user_data["sub"])
                )
                existing_user = result.scalar_one_or_none()
                
                if existing_user:
                    print(f"  User {email} already exists, skipping")
                    continue
                
                # Determine organization
                if user_data["org_type"] == "police":
                    org_id = police_org.id
                elif user_data["org_type"] == "medical":
                    org_id = medical_org.id
                else:
                    # System admin - use police org for now
                    org_id = police_org.id
                
                user = User(
                    cognito_sub=user_data["sub"],
                    email=email,
                    role=user_data["role"],
                    org_id=org_id,
                    supervisor_id=None  # We'll set supervisors later if needed
                )
                session.add(user)
                print(f"  ✓ Created {email} ({user_data['role']})")
            
            await session.commit()
            
            # Set up supervisor relationships
            print("\nSetting up supervisor relationships...")
            
            # Get police chief and police worker
            result = await session.execute(
                select(User).where(User.email == "police-chief@cuhackit.com")
            )
            police_chief = result.scalar_one_or_none()
            
            result = await session.execute(
                select(User).where(User.email == "police-worker@cuhackit.com")
            )
            police_worker = result.scalar_one_or_none()
            
            if police_chief and police_worker:
                police_worker.supervisor_id = police_chief.id
                print("  ✓ Set police chief as supervisor of police worker")
            
            # Get ER attending and ER doctor
            result = await session.execute(
                select(User).where(User.email == "er-attending@cuhackit.com")
            )
            er_attending = result.scalar_one_or_none()
            
            result = await session.execute(
                select(User).where(User.email == "er-doctor@cuhackit.com")
            )
            er_doctor = result.scalar_one_or_none()
            
            if er_attending and er_doctor:
                er_doctor.supervisor_id = er_attending.id
                print("  ✓ Set ER attending as supervisor of ER doctor")
            
            await session.commit()
            
            print("\n✅ Database seeded successfully!")
            
        except Exception as e:
            print(f"\n❌ Error seeding database: {e}")
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(seed_database())
