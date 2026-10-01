from typing import Annotated

from fastapi import APIRouter, Depends

from hospital_api.domains.auth.dependencies import get_current_user
from hospital_api.domains.users.models import User
from hospital_api.domains.users.schemas import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user
