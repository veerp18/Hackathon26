from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import requests
from functools import lru_cache
from app.config import get_settings
from app.schemas import CognitoUser

settings = get_settings()
security = HTTPBearer()


@lru_cache()
def get_cognito_public_keys():
    """Fetch Cognito public keys for JWT verification"""
    jwks_url = f"{settings.cognito_issuer}/.well-known/jwks.json"
    response = requests.get(jwks_url)
    return response.json()


def verify_token(token: str) -> CognitoUser:
    """Verify JWT token from AWS Cognito"""
    try:
        # Get public keys
        jwks = get_cognito_public_keys()
        
        # Decode token header to get key id
        unverified_header = jwt.get_unverified_header(token)
        
        # Find the correct key
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key"
            )
        
        # Verify and decode token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.cognito_client_id,
            issuer=settings.cognito_issuer,
        )
        
        return CognitoUser(**payload)
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid token: {str(e)}"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> CognitoUser:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    return verify_token(token)


def require_role(*allowed_roles: str):
    """Dependency factory to require specific roles"""
    async def role_checker(current_user: CognitoUser = Depends(get_current_user)) -> CognitoUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {allowed_roles}, Current: {current_user.role}"
            )
        return current_user
    return role_checker
