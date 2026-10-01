"""initial pgcrypto extension

Revision ID: 8785004d3c8b
Revises:
Create Date: 2026-09-30 20:30:13.705238

"""

from collections.abc import Sequence

from alembic import op

revision: str = "8785004d3c8b"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS pgcrypto")
