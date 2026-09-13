from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.models.user import Role, User

router = APIRouter(prefix="/cars", tags=["Cars"])


@router.get("/my-cars")
async def get_my_cars(
    current_user: Annotated[User, Depends(require_roles([Role.OWNER]))],
) -> dict[str, object]:
    return {
        "owner_id": current_user.id,
        "message": "Owner car management endpoint is ready",
        "cars": [],
    }
