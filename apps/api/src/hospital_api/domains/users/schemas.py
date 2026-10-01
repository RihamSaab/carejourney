from uuid import UUID

from pydantic import BaseModel, ConfigDict

from hospital_api.domains.users.models import UserRole, UserStatus


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    role: UserRole
    status: UserStatus
