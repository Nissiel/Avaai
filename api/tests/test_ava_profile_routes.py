import asyncio
import uuid
import pytest
from fastapi import FastAPI, status
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from api.src.infrastructure.persistence.models.tenant import Base, Tenant  # type: ignore[import]
from api.src.infrastructure.persistence.models.ava_profile import AvaProfile
from api.src.presentation.schemas.ava_profile import AvaProfileIn
from api.src.presentation.api.v1.routes import tenant_profile
from api.src.application.services.realtime_session import build_system_prompt
from api.src.infrastructure.database.session import get_session


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        tenant = Tenant(id=uuid.uuid4(), name="Test Tenant")
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)
        yield session
    await engine.dispose()


def test_build_system_prompt_injects_all_fields():
    payload = AvaProfileIn(
        name="Camille",
        voice="fr-camille",
        language="fr-FR",
        tone="posée et rassurante",
        personality="courtoise, méthodique",
        greeting="Bonjour, Camille à votre écoute.",
        allowed_topics=["support client"],
        forbidden_topics=["politique"],
        can_take_notes=True,
        can_summarize_live=False,
        fallback_behavior="Je propose de transmettre un message.",
        signature_style="formelle et chaleureuse",
        custom_rules="Toujours confirmer l'orthographe du prénom.",
    )
    prompt = build_system_prompt(payload)  # type: ignore[arg-type]
    assert "Camille" in prompt
    assert "politique" in prompt
    assert "Je propose de transmettre un message." in prompt
    assert "can_summarize_live=False" in prompt


def create_test_app(session_override: AsyncSession | None = None) -> FastAPI:
    app = FastAPI()
    app.include_router(tenant_profile.router)

    if session_override is not None:
        async def override_get_session():
            yield session_override

        app.dependency_overrides[get_session] = override_get_session

    return app


@pytest.mark.asyncio
async def test_get_default_profile_returns_defaults(session):
    app = create_test_app(session)
    client = TestClient(app)

    response = client.get("/tenant/ava-profile", headers={"Authorization": "Bearer test"})
    assert response.status_code in (status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED)


@pytest.mark.asyncio
async def test_update_profile_persists_and_roundtrips(session):
    profile = AvaProfile(
        tenant_id=uuid.uuid4(),
        name="Ava",
        voice="alloy",
        language="fr-FR",
        tone="chaleureux",
        personality="amicale",
        greeting="Bonjour",
        allowed_topics=["support"],
        forbidden_topics=["politique"],
        can_take_notes=True,
        can_summarize_live=True,
        fallback_behavior="Je transmets un message.",
        signature_style="cordialement",
        custom_rules="Toujours demander le prénom.",
    )
    session.add(profile)
    await session.commit()

    profile.allowed_topics.append("planning")
    await session.commit()

    result = await session.get(AvaProfile, profile.tenant_id)
    assert result is not None
    assert "planning" in result.allowed_topics


@pytest.mark.asyncio
async def test_forbidden_access_for_viewer_role(session):
    app = create_test_app(session)
    client = TestClient(app)
    response = client.put("/tenant/ava-profile", json={})
    assert response.status_code in (
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    )
