"""
Authentication routes - Login, Signup, Verify
Divine implementation with bcrypt + JWT + SQLAlchemy
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field, validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
import bcrypt
import jwt

from api.src.core.settings import get_settings
from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.persistence.repositories.user_repository import UserRepository

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()
settings = get_settings()


# JWT Configuration
SECRET_KEY = settings.jwt_secret_key if hasattr(settings, 'jwt_secret_key') else "CHANGE_ME_IN_PRODUCTION"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Default user fixtures (for initial seeding)
DEFAULT_USER_FIXTURES = [
    {
        "email": "test@divine.ai",
        "password": "Divine123!",  # Will be hashed on seed
        "name": "Divine Test User",
        "phone": "+33123456789",
        "locale": "fr",
    },
]



# ============================================================================
# DTOs (Data Transfer Objects)
# ============================================================================

class SignupRequest(BaseModel):
    """User signup request"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r'^\+[1-9]\d{1,14}$', description="E.164 format")
    locale: str = Field("en", pattern=r'^[a-z]{2}$')
    
    @validator('password')
    def validate_password(cls, v):
        """Ensure password has minimum strength"""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class LoginRequest(BaseModel):
    """User login request - email OR phone + password"""
    identifier: str = Field(..., description="Email or phone number")
    password: str
    remember: bool = False


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class UserResponse(BaseModel):
    """User info response"""
    id: str
    email: str
    name: Optional[str]
    phone: Optional[str]
    locale: str
    onboarding_completed: bool
    onboarding_step: int


# ============================================================================
# Password Hashing (bcrypt)
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using bcrypt (cost=12 for security)"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


async def seed_default_users(session: AsyncSession):
    """Seed default users for development (run once on startup)."""
    repository = UserRepository(session)
    
    for fixture in DEFAULT_USER_FIXTURES:
        # Check if user already exists
        existing = await repository.get_by_email(fixture["email"])
        if existing:
            continue
        
        # Create user with hashed password
        try:
            await repository.create(
                email=fixture["email"],
                password=hash_password(fixture["password"]),
                name=fixture.get("name"),
                phone=fixture.get("phone"),
                locale=fixture.get("locale", "en"),
            )
        except IntegrityError:
            # User already exists (race condition), skip
            await session.rollback()
            continue



# ============================================================================
# JWT Token Generation
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token (longer expiry)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


# ============================================================================
# Auth Dependency (for protected routes)
# ============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Dependency to get current authenticated user from JWT token
    Usage: user = Depends(get_current_user)
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # TODO: Fetch user from database when DB is connected
    return {"id": user_id, **payload}


# ============================================================================
# ROUTES
# ============================================================================

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    data: SignupRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new user account with database persistence.
    
    Flow:
    1. Validate email/phone uniqueness (database check)
    2. Hash password (bcrypt)
    3. Create User in database
    4. Send verification email (TODO)
    5. Return JWT tokens
    """
    repository = UserRepository(session)
    
    # Check if email already exists
    existing_user = await repository.get_by_email(data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_pwd = hash_password(data.password)
    
    # Create user in database
    try:
        user = await repository.create(
            email=data.email,
            password=hashed_pwd,
            name=data.name,
            phone=data.phone,
            locale=data.locale,
        )
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or phone already registered"
        )
    
    # TODO: Create organization for user in Phase 2
    # org = Org(name=f"{data.name}'s Organization", ...)
    # org_user = OrgUser(user_id=user.id, org_id=org.id, role="OWNER")
    
    # Generate tokens
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id}
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "locale": user.locale,
            "onboarding_completed": user.onboarding_completed,
            "onboarding_step": user.onboarding_step
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Login with email OR phone + password using database.
    
    Flow:
    1. Detect if identifier is email or phone
    2. Find user in database
    3. Verify password (bcrypt)
    4. Return JWT tokens
    """
    repository = UserRepository(session)
    
    # Detect identifier type (email vs phone)
    identifier = data.identifier.strip()
    is_email = "@" in identifier
    
    # Fetch user from database
    if is_email:
        user = await repository.get_by_email(identifier)
    else:
        user = await repository.get_by_phone(identifier)
    
    if not user or not user.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Generate tokens
    access_token_expires = timedelta(days=30) if data.remember else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id}
    )

    user_payload = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "locale": user.locale,
        "onboarding_completed": user.onboarding_completed,
        "onboarding_step": user.onboarding_step,
        "phone": user.phone,
    }
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=int(access_token_expires.total_seconds()),
        user=user_payload
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(data: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    
    Send refresh token in JSON body:
    {"refresh_token": "your_refresh_token_here"}
    """
    payload = verify_token(data.refresh_token)
    
    # Verify it's a refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id = payload.get("sub")
    email = payload.get("email", "")
    
    # Generate new access token
    access_token = create_access_token(
        data={"sub": user_id, "email": email}
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=data.refresh_token,  # Keep same refresh token
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={"id": user_id, "email": email}
    )



@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current authenticated user info
    Protected route example
    """
    # TODO: Fetch from database
    return UserResponse(
        id=current_user["id"],
        email=current_user.get("email", ""),
        name="Test User",
        phone=None,
        locale="en",
        onboarding_completed=False,
        onboarding_step=0
    )


@router.post("/verify-email")
async def verify_email(token: str):
    """
    Verify user email with token sent via email
    TODO: Implement email verification flow
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Email verification not yet implemented"
    )


@router.post("/verify-phone")
async def verify_phone(phone: str, code: str):
    """
    Verify user phone with SMS code
    TODO: Implement phone verification flow (Twilio SMS)
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Phone verification not yet implemented"
    )
