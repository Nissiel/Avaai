"""Runtime management endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/runtime", tags=["Runtime"])


class RuntimeControlRequest(BaseModel):
    action: str

    def validate_action(self) -> str:
        action_normalized = self.action.lower()
        if action_normalized not in {"start", "stop", "restart"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported runtime action",
            )
        return action_normalized


@router.post("/control")
async def control_runtime(payload: RuntimeControlRequest) -> dict[str, str]:
    action = payload.validate_action()
    # Placeholder implementation: integration with process manager comes later.
    return {"status": "queued", "action": action}


@router.get("/status")
async def runtime_status() -> dict[str, str]:
    # Placeholder for future orchestration integration.
    return {"status": "ok"}
