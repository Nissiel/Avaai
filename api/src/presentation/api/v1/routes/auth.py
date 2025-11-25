"""
Authentication routes - Login, Signup, Verify
Divine implementation with bcrypt + JWT + SQLAlchemy
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field, validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
import bcrypt
import jwt

from api.src.core.settings import get_settings
from api.src.core.rate_limiting import limiter
from api.src.infrastructure.database.session import get_session
from api.src.infrastructure.persistence.repositories.user_repository import UserRepository
from api.src.infrastructure.persistence.models.user import User
from api.src.presentation.dependencies.auth import get_current_user
from api.src.application.services.supabase_auth import get_supabase_auth_service, SupabaseAuthService
from supabase_auth.errors import AuthApiError

router = APIRouter(prefix="/auth", tags=["auth"])

# 🔐 DIVINE: Dev mode allows optional auth for local testing
DEV_MODE = get_settings().environment == "development"
security = HTTPBearer(auto_error=not DEV_MODE)  # Optional auth in dev
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


def serialize_user(user: User) -> dict:
    """Normalize user model into public API payload."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "locale": user.locale,
        "image": user.image,
        "onboarding_completed": user.onboarding_completed,
        "onboarding_step": user.onboarding_step,
        "phone_verified": user.phone_verified,
    }



# ============================================================================
# DTOs (Data Transfer Objects)
# ============================================================================

class SignupRequest(BaseModel):
    """User signup request"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, description="E.164 format")
    locale: str = Field("en", pattern=r'^[a-z]{2}$')

    @validator('phone', pre=True)
    def validate_phone(cls, v):
        """Validate phone is E.164 format or empty/None"""
        if v is None or v == "":
            return None
        import re
        if not re.match(r'^\+[1-9]\d{1,14}$', v):
            raise ValueError('Phone must be in E.164 format (e.g., +33612345678)')
        return v

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
    image: Optional[str] = None
    onboarding_completed: bool
    onboarding_step: int
    phone_verified: bool = False


class UserUpdateRequest(BaseModel):
    """Partial update for authenticated user profile."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(
        default=None,
        pattern=r'^\+?[1-9]\d{1,14}$',
        description="E.164 phone format, optional",
    )
    locale: Optional[str] = Field(default=None, pattern=r'^[a-z]{2}$')
    image: Optional[str] = Field(default=None, max_length=512)
    onboarding_completed: Optional[bool] = Field(
        default=None,
        description="Mark onboarding as completed",
    )


# ============================================================================
# Password Hashing (bcrypt)
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using bcrypt (cost=10 for balance of security/speed)"""
    # rounds=10 is ~4x faster than 12, still secure for production
    salt = bcrypt.gensalt(rounds=10)
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
# ROUTES
# ============================================================================

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")  # 🔒 SECURITY: Prevent automated account creation
async def signup(
    request: Request,  # Required for rate limiting
    data: SignupRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new user account with database persistence.

    Rate limited to 3 signups per minute per IP to prevent abuse.

    Flow (Supabase Auth enabled):
    1. Create user in Supabase Auth (triggers DB sync)
    2. Wait for user to appear in public.users
    3. Sign in to get tokens
    4. Return JWT tokens

    Flow (Legacy - Supabase Auth disabled):
    1. Validate email/phone uniqueness (database check)
    2. Hash password (bcrypt)
    3. Create User in database
    4. Return JWT tokens
    """
    import logging
    import asyncio
    logger = logging.getLogger("ava.auth")
    logger.info(f"Signup attempt for email: {data.email}")

    repository = UserRepository(session)

    # Check if Supabase Auth is enabled
    if settings.supabase_auth_enabled:
        try:
            # Create user in Supabase Auth
            supabase_service = get_supabase_auth_service()
            supabase_user = await supabase_service.create_user(
                email=data.email,
                password=data.password,
                name=data.name,
                phone=data.phone,
                locale=data.locale,
                email_confirm=True,  # Auto-confirm for now (can be changed)
            )

            logger.info(f"Created Supabase Auth user: {supabase_user.id}")

            # Wait for database trigger to sync user (max 3 seconds)
            user = None
            for _ in range(6):
                user = await repository.get_by_supabase_id(supabase_user.id)
                if user:
                    break
                await asyncio.sleep(0.5)

            if not user:
                logger.error(f"User sync failed for Supabase user {supabase_user.id}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="User synchronization failed"
                )

            # Sign in to get tokens
            _, access_token, refresh_token = await supabase_service.sign_in_with_password(
                email=data.email,
                password=data.password,
            )

            # Calculate token expiry (Supabase default is 1 hour)
            access_token_expires = timedelta(hours=1)

            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=int(access_token_expires.total_seconds()),
                user=serialize_user(user)
            )

        except AuthApiError as e:
            error_message = e.message.lower()
            if "already registered" in error_message or "already exists" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            logger.error(f"Supabase Auth error: {e.message}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e.message)
            )

    # Legacy flow (Supabase Auth disabled)
    # Check if email already exists
    existing_user = await repository.get_by_email(data.email)
    if existing_user:
        logger.warning(f"Signup rejected: Email already registered - {data.email}")
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

    # Generate tokens
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id}
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=int(access_token_expires.total_seconds()),
        user=serialize_user(user)
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")  # 🔒 SECURITY: Prevent brute force attacks
async def login(
    request: Request,  # Required for rate limiting
    data: LoginRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Login with email OR phone + password using database.

    Rate limited to 5 login attempts per minute per IP to prevent brute force.

    Flow (Supabase Auth enabled):
    1. Sign in via Supabase Auth
    2. Get user from public.users by supabase_user_id
    3. Return Supabase JWT tokens

    Flow (Legacy - Supabase Auth disabled):
    1. Detect if identifier is email or phone
    2. Find user in database
    3. Verify password (bcrypt)
    4. Return JWT tokens
    """
    import logging
    logger = logging.getLogger("ava.auth")

    repository = UserRepository(session)

    # Detect identifier type (email vs phone)
    identifier = data.identifier.strip()
    is_email = "@" in identifier

    # Check if Supabase Auth is enabled
    if settings.supabase_auth_enabled:
        if not is_email:
            # Supabase requires email for password auth
            # Try to find user by phone to get their email
            user = await repository.get_by_phone(identifier)
            if user:
                identifier = user.email
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )

        try:
            supabase_service = get_supabase_auth_service()
            supabase_user, access_token, refresh_token = await supabase_service.sign_in_with_password(
                email=identifier,
                password=data.password,
            )

            # Get user from database by supabase_user_id
            user = await repository.get_by_supabase_id(supabase_user.id)
            if not user:
                # User exists in Supabase but not in our DB - try to create/link
                user = await repository.get_or_create_by_supabase(
                    supabase_user_id=supabase_user.id,
                    email=supabase_user.email,
                    name=supabase_user.user_metadata.get("name") if supabase_user.user_metadata else None,
                )

            logger.info(f"Login successful via Supabase: {user.id} ({user.email})")

            # Supabase default token expiry is 1 hour
            access_token_expires = timedelta(hours=1)

            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=int(access_token_expires.total_seconds()),
                user=serialize_user(user)
            )

        except AuthApiError as e:
            logger.warning(f"Supabase login failed: {e.message}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

    # Legacy flow (Supabase Auth disabled)
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

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=int(access_token_expires.total_seconds()),
        user=serialize_user(user)
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")  # 🔒 SECURITY: Allow more refreshes but still prevent abuse
async def refresh_access_token(
    request: Request,  # Required for rate limiting
    data: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Refresh access token using refresh token.

    Rate limited to 10 refreshes per minute per IP (normal clients refresh ~1-2 times/hour).

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

    repository = UserRepository(session)
    user = await repository.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Generate new access token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=data.refresh_token,  # Keep same refresh token
        expires_in=int(access_token_expires.total_seconds()),
        user=serialize_user(user)
    )



@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user info
    Protected route example
    """
    payload = serialize_user(current_user)

    return UserResponse(
        id=payload["id"],
        email=payload["email"],
        name=payload.get("name"),
        phone=payload.get("phone"),
        locale=payload.get("locale", "en"),
        image=payload.get("image"),
        onboarding_completed=payload.get("onboarding_completed", False),
        onboarding_step=payload.get("onboarding_step", 0),
        phone_verified=payload.get("phone_verified", False),
    )


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Update current authenticated user profile fields.
    """
    update_fields = payload.dict(exclude_unset=True, exclude_none=True)

    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes provided",
        )

    repository = UserRepository(session)

    try:
        updated_user = await repository.update(current_user.id, **update_fields)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return serialize_user(updated_user)


class ResendVerificationRequest(BaseModel):
    """Request to resend verification email."""
    email: EmailStr


class PhoneVerificationRequest(BaseModel):
    """Request to send phone verification OTP."""
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$', description="Phone in E.164 format")


class PhoneVerifyOTPRequest(BaseModel):
    """Request to verify phone OTP."""
    phone: str = Field(..., pattern=r'^\+[1-9]\d{1,14}$', description="Phone in E.164 format")
    token: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")


@router.post("/resend-verification-email")
@limiter.limit("3/minute")
async def resend_verification_email(
    request: Request,
    data: ResendVerificationRequest,
):
    """
    Resend email verification link.

    Rate limited to 3 requests per minute per IP.
    """
    import logging
    logger = logging.getLogger("ava.auth")

    if not settings.supabase_auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification requires Supabase Auth"
        )

    try:
        supabase_service = get_supabase_auth_service()
        # Use the client to send a new verification email
        # The resend method sends a new magic link/OTP
        supabase_service._client.auth.resend({
            "type": "signup",
            "email": data.email,
        })

        logger.info(f"Resent verification email to: {data.email}")
        return {"message": "Verification email sent", "email": data.email}

    except AuthApiError as e:
        logger.error(f"Failed to resend verification email: {e.message}")
        # Don't reveal if email exists or not for security
        return {"message": "If an account exists, a verification email has been sent", "email": data.email}


@router.post("/send-phone-otp")
@limiter.limit("3/minute")
async def send_phone_otp(
    request: Request,
    data: PhoneVerificationRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Send OTP code to phone number for verification.

    Rate limited to 3 requests per minute per IP.
    User must be authenticated.
    """
    import logging
    logger = logging.getLogger("ava.auth")

    if not settings.supabase_auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone verification requires Supabase Auth"
        )

    # Verify the phone belongs to the current user
    if current_user.phone != data.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number does not match your account"
        )

    try:
        supabase_service = get_supabase_auth_service()

        # First update the user's phone in Supabase Auth if not set
        if current_user.supabase_user_id:
            await supabase_service.update_user(
                current_user.supabase_user_id,
                user_metadata={"phone": data.phone}
            )

        # Send OTP via Supabase (uses their configured SMS provider)
        supabase_service._client.auth.sign_in_with_otp({
            "phone": data.phone,
        })

        logger.info(f"Sent phone OTP to: {data.phone} for user {current_user.id}")
        return {"message": "OTP sent", "phone": data.phone}

    except AuthApiError as e:
        logger.error(f"Failed to send phone OTP: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to send OTP: {e.message}"
        )


@router.post("/verify-phone-otp")
@limiter.limit("5/minute")
async def verify_phone_otp(
    request: Request,
    data: PhoneVerifyOTPRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Verify phone OTP code.

    Rate limited to 5 attempts per minute per IP.
    User must be authenticated.
    """
    import logging
    logger = logging.getLogger("ava.auth")

    if not settings.supabase_auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone verification requires Supabase Auth"
        )

    # Verify the phone belongs to the current user
    if current_user.phone != data.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number does not match your account"
        )

    try:
        supabase_service = get_supabase_auth_service()

        # Verify the OTP
        response = supabase_service._client.auth.verify_otp({
            "phone": data.phone,
            "token": data.token,
            "type": "sms",
        })

        if response.user:
            # Update user's phone_verified status in our database
            repository = UserRepository(session)
            await repository.update(current_user.id, phone_verified=True)

            logger.info(f"Phone verified for user {current_user.id}: {data.phone}")
            return {
                "message": "Phone verified successfully",
                "phone": data.phone,
                "verified": True
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP code"
            )

    except AuthApiError as e:
        logger.error(f"Phone OTP verification failed: {e.message}")
        if "invalid" in e.message.lower() or "expired" in e.message.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Verification failed: {e.message}"
        )


@router.get("/verification-status")
async def get_verification_status(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user's email and phone verification status.
    """
    import logging
    logger = logging.getLogger("ava.auth")

    email_verified = True  # Default to true since we auto-confirm on signup

    # Check Supabase for actual verification status if enabled
    if settings.supabase_auth_enabled and current_user.supabase_user_id:
        try:
            supabase_service = get_supabase_auth_service()
            supabase_user = await supabase_service.get_user_by_id(current_user.supabase_user_id)
            if supabase_user:
                email_verified = supabase_user.email_confirmed_at is not None
        except Exception as e:
            logger.warning(f"Failed to get Supabase verification status: {e}")

    return {
        "email": current_user.email,
        "email_verified": email_verified,
        "phone": current_user.phone,
        "phone_verified": current_user.phone_verified,
    }
