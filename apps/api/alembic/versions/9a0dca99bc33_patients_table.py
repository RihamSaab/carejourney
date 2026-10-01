"""patients table

Revision ID: 9a0dca99bc33
Revises: 094711f8a74f
Create Date: 2026-10-01 12:40:23.402054

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '9a0dca99bc33'
down_revision: str | Sequence[str] | None = '094711f8a74f'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('patients',
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('date_of_birth', sa.Date(), nullable=True),
    sa.Column('phone', sa.String(length=32), nullable=True),
    sa.Column('timezone', sa.String(length=64), nullable=False),
    sa.Column('preferred_language', sa.String(length=8), nullable=False),
    sa.Column('emergency_contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id')
    )


def downgrade() -> None:
    op.drop_table('patients')
