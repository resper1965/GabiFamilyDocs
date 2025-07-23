"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE gender AS ENUM ('male', 'female', 'other')")
    op.execute("CREATE TYPE familyrole AS ENUM ('family_admin', 'family_member')")
    op.execute("CREATE TYPE documenttype AS ENUM ('passport', 'id_card', 'driver_license', 'birth_certificate', 'marriage_certificate', 'diploma', 'visa', 'work_permit', 'residence_permit', 'tax_document', 'bank_statement', 'insurance', 'medical_record', 'other')")
    op.execute("CREATE TYPE subscriptionplan AS ENUM ('free', 'premium')")
    op.execute("CREATE TYPE subscriptionstatus AS ENUM ('active', 'expired', 'cancelled', 'pending')")
    op.execute("CREATE TYPE invitationstatus AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled')")

    # Create families table
    op.create_table('families',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_families_id'), 'families', ['id'], unique=False)

    # Create family_members table
    op.create_table('family_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('family_id', sa.Integer(), nullable=False),
        sa.Column('keycloak_user_id', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('birth_date', sa.Date(), nullable=False),
        sa.Column('gender', postgresql.ENUM('male', 'female', 'other', name='gender'), nullable=False),
        sa.Column('nationality', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('address_street', sa.String(length=255), nullable=True),
        sa.Column('address_number', sa.String(length=20), nullable=True),
        sa.Column('address_complement', sa.String(length=100), nullable=True),
        sa.Column('address_neighborhood', sa.String(length=100), nullable=True),
        sa.Column('address_city', sa.String(length=100), nullable=True),
        sa.Column('address_state', sa.String(length=100), nullable=True),
        sa.Column('address_country', sa.String(length=100), nullable=True),
        sa.Column('address_zipcode', sa.String(length=20), nullable=True),
        sa.Column('role', postgresql.ENUM('family_admin', 'family_member', name='familyrole'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['family_id'], ['families.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('keycloak_user_id')
    )
    op.create_index(op.f('ix_family_members_id'), 'family_members', ['id'], unique=False)

    # Create subscriptions table
    op.create_table('subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('family_id', sa.Integer(), nullable=False),
        sa.Column('plan', postgresql.ENUM('free', 'premium', name='subscriptionplan'), nullable=True),
        sa.Column('status', postgresql.ENUM('active', 'expired', 'cancelled', 'pending', name='subscriptionstatus'), nullable=True),
        sa.Column('max_members', sa.Integer(), nullable=True),
        sa.Column('max_documents', sa.Integer(), nullable=True),
        sa.Column('max_ai_requests_per_month', sa.Integer(), nullable=True),
        sa.Column('max_storage_mb', sa.Integer(), nullable=True),
        sa.Column('current_members', sa.Integer(), nullable=True),
        sa.Column('current_documents', sa.Integer(), nullable=True),
        sa.Column('current_ai_requests_this_month', sa.Integer(), nullable=True),
        sa.Column('current_storage_mb', sa.Integer(), nullable=True),
        sa.Column('price_monthly', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('billing_cycle_start', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('billing_cycle_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['family_id'], ['families.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('family_id')
    )
    op.create_index(op.f('ix_subscriptions_id'), 'subscriptions', ['id'], unique=False)

    # Create documents table
    op.create_table('documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('family_id', sa.Integer(), nullable=False),
        sa.Column('member_id', sa.Integer(), nullable=False),
        sa.Column('document_type', postgresql.ENUM('passport', 'id_card', 'driver_license', 'birth_certificate', 'marriage_certificate', 'diploma', 'visa', 'work_permit', 'residence_permit', 'tax_document', 'bank_statement', 'insurance', 'medical_record', 'other', name='documenttype'), nullable=False),
        sa.Column('document_number', sa.String(length=100), nullable=False),
        sa.Column('issuing_country', sa.String(length=100), nullable=False),
        sa.Column('issuing_authority', sa.String(length=255), nullable=True),
        sa.Column('issue_date', sa.Date(), nullable=True),
        sa.Column('expiration_date', sa.Date(), nullable=True),
        sa.Column('paperless_document_id', sa.Integer(), nullable=True),
        sa.Column('paperless_url', sa.String(length=500), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['family_id'], ['families.id'], ),
        sa.ForeignKeyConstraint(['member_id'], ['family_members.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)

    # Create invitations table
    op.create_table('invitations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('family_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'accepted', 'declined', 'expired', 'cancelled', name='invitationstatus'), nullable=True),
        sa.Column('invited_by_member_id', sa.Integer(), nullable=False),
        sa.Column('invited_name', sa.String(length=255), nullable=True),
        sa.Column('invited_role', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('member_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['family_id'], ['families.id'], ),
        sa.ForeignKeyConstraint(['invited_by_member_id'], ['family_members.id'], ),
        sa.ForeignKeyConstraint(['member_id'], ['family_members.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    op.create_index(op.f('ix_invitations_id'), 'invitations', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables
    op.drop_index(op.f('ix_invitations_id'), table_name='invitations')
    op.drop_table('invitations')
    op.drop_index(op.f('ix_documents_id'), table_name='documents')
    op.drop_table('documents')
    op.drop_index(op.f('ix_subscriptions_id'), table_name='subscriptions')
    op.drop_table('subscriptions')
    op.drop_index(op.f('ix_family_members_id'), table_name='family_members')
    op.drop_table('family_members')
    op.drop_index(op.f('ix_families_id'), table_name='families')
    op.drop_table('families')
    
    # Drop enum types
    op.execute("DROP TYPE invitationstatus")
    op.execute("DROP TYPE subscriptionstatus")
    op.execute("DROP TYPE subscriptionplan")
    op.execute("DROP TYPE documenttype")
    op.execute("DROP TYPE familyrole")
    op.execute("DROP TYPE gender")