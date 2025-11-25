"""Normalize studio_configs into separate configuration tables

This migration:
1. Creates email_configs table
2. Creates voice_configs table
3. Creates ai_configs table
4. Creates transcriber_configs table
5. Migrates data from studio_configs to new tables
6. Drops redundant columns from studio_configs

Revision ID: f4d3e5f6g7h8
Revises: e3c2d4e5f6g7
Create Date: 2024-01-01 00:00:03.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f4d3e5f6g7h8'
down_revision = 'e3c2d4e5f6g7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # === STEP 1: Create email_configs table ===
    op.create_table(
        'email_configs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('studio_config_id', sa.String(36), sa.ForeignKey('studio_configs.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('admin_email', sa.String(255), nullable=True),
        sa.Column('fallback_email', sa.String(255), nullable=True),
        sa.Column('summary_email', sa.String(255), nullable=True),
        sa.Column('smtp_server', sa.String(255), default='', nullable=False),
        sa.Column('smtp_port', sa.String(10), default='587', nullable=False),
        sa.Column('smtp_username', sa.String(255), default='', nullable=False),
        sa.Column('smtp_password_encrypted', sa.Text(), default='', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_email_configs_studio_config_id', 'email_configs', ['studio_config_id'], unique=True)

    # === STEP 2: Create voice_configs table ===
    op.create_table(
        'voice_configs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('studio_config_id', sa.String(36), sa.ForeignKey('studio_configs.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('voice_provider', sa.String(50), default='11labs', nullable=False),
        sa.Column('voice_id', sa.String(255), default='sarah', nullable=False),
        sa.Column('voice_speed', sa.Float(), default=1.0, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_voice_configs_studio_config_id', 'voice_configs', ['studio_config_id'], unique=True)

    # === STEP 3: Create ai_configs table ===
    op.create_table(
        'ai_configs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('studio_config_id', sa.String(36), sa.ForeignKey('studio_configs.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('ai_model', sa.String(100), default='gpt-4o-mini', nullable=False),
        sa.Column('ai_temperature', sa.Float(), default=0.7, nullable=False),
        sa.Column('ai_max_tokens', sa.Integer(), default=500, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_ai_configs_studio_config_id', 'ai_configs', ['studio_config_id'], unique=True)

    # === STEP 4: Create transcriber_configs table ===
    op.create_table(
        'transcriber_configs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('studio_config_id', sa.String(36), sa.ForeignKey('studio_configs.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('transcriber_provider', sa.String(50), default='deepgram', nullable=False),
        sa.Column('transcriber_model', sa.String(100), default='nova-2', nullable=False),
        sa.Column('transcriber_language', sa.String(10), default='en', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_transcriber_configs_studio_config_id', 'transcriber_configs', ['studio_config_id'], unique=True)

    # === STEP 5: Migrate data to new tables ===

    # Migrate email configs
    op.execute("""
        INSERT INTO email_configs (id, studio_config_id, admin_email, fallback_email, summary_email,
                                   smtp_server, smtp_port, smtp_username, smtp_password_encrypted,
                                   created_at, updated_at)
        SELECT gen_random_uuid()::text, id, admin_email, fallback_email, summary_email,
               COALESCE(smtp_server, ''), COALESCE(smtp_port, '587'),
               COALESCE(smtp_username, ''), COALESCE(smtp_password_encrypted, ''),
               created_at, updated_at
        FROM studio_configs
    """)

    # Migrate voice configs
    op.execute("""
        INSERT INTO voice_configs (id, studio_config_id, voice_provider, voice_id, voice_speed,
                                   created_at, updated_at)
        SELECT gen_random_uuid()::text, id,
               COALESCE(voice_provider, '11labs'), COALESCE(voice_id, 'sarah'),
               COALESCE(voice_speed, 1.0), created_at, updated_at
        FROM studio_configs
    """)

    # Migrate AI configs
    op.execute("""
        INSERT INTO ai_configs (id, studio_config_id, ai_model, ai_temperature, ai_max_tokens,
                                created_at, updated_at)
        SELECT gen_random_uuid()::text, id,
               COALESCE(ai_model, 'gpt-4o-mini'), COALESCE(ai_temperature, 0.7),
               COALESCE(ai_max_tokens, 500), created_at, updated_at
        FROM studio_configs
    """)

    # Migrate transcriber configs
    op.execute("""
        INSERT INTO transcriber_configs (id, studio_config_id, transcriber_provider,
                                         transcriber_model, transcriber_language,
                                         created_at, updated_at)
        SELECT gen_random_uuid()::text, id,
               COALESCE(transcriber_provider, 'deepgram'), COALESCE(transcriber_model, 'nova-2'),
               COALESCE(transcriber_language, 'en'), created_at, updated_at
        FROM studio_configs
    """)

    # === STEP 6: Drop redundant columns from studio_configs ===
    # Email columns
    op.drop_column('studio_configs', 'admin_email')
    op.drop_column('studio_configs', 'fallback_email')
    op.drop_column('studio_configs', 'summary_email')
    op.drop_column('studio_configs', 'smtp_server')
    op.drop_column('studio_configs', 'smtp_port')
    op.drop_column('studio_configs', 'smtp_username')
    op.drop_column('studio_configs', 'smtp_password_encrypted')

    # Voice columns
    op.drop_column('studio_configs', 'voice_provider')
    op.drop_column('studio_configs', 'voice_id')
    op.drop_column('studio_configs', 'voice_speed')

    # AI columns
    op.drop_column('studio_configs', 'ai_model')
    op.drop_column('studio_configs', 'ai_temperature')
    op.drop_column('studio_configs', 'ai_max_tokens')

    # Transcriber columns
    op.drop_column('studio_configs', 'transcriber_provider')
    op.drop_column('studio_configs', 'transcriber_model')
    op.drop_column('studio_configs', 'transcriber_language')


def downgrade() -> None:
    # === Add back columns to studio_configs ===

    # Email columns
    op.add_column('studio_configs', sa.Column('admin_email', sa.String(255), nullable=True))
    op.add_column('studio_configs', sa.Column('fallback_email', sa.String(255), nullable=True))
    op.add_column('studio_configs', sa.Column('summary_email', sa.String(255), nullable=True))
    op.add_column('studio_configs', sa.Column('smtp_server', sa.String(255), server_default='', nullable=False))
    op.add_column('studio_configs', sa.Column('smtp_port', sa.String(10), server_default='587', nullable=False))
    op.add_column('studio_configs', sa.Column('smtp_username', sa.String(255), server_default='', nullable=False))
    op.add_column('studio_configs', sa.Column('smtp_password_encrypted', sa.Text(), server_default='', nullable=False))

    # Voice columns
    op.add_column('studio_configs', sa.Column('voice_provider', sa.String(50), server_default='11labs', nullable=False))
    op.add_column('studio_configs', sa.Column('voice_id', sa.String(255), server_default='sarah', nullable=False))
    op.add_column('studio_configs', sa.Column('voice_speed', sa.Float(), server_default='1.0', nullable=False))

    # AI columns
    op.add_column('studio_configs', sa.Column('ai_model', sa.String(100), server_default='gpt-4o-mini', nullable=False))
    op.add_column('studio_configs', sa.Column('ai_temperature', sa.Float(), server_default='0.7', nullable=False))
    op.add_column('studio_configs', sa.Column('ai_max_tokens', sa.Integer(), server_default='500', nullable=False))

    # Transcriber columns
    op.add_column('studio_configs', sa.Column('transcriber_provider', sa.String(50), server_default='deepgram', nullable=False))
    op.add_column('studio_configs', sa.Column('transcriber_model', sa.String(100), server_default='nova-2', nullable=False))
    op.add_column('studio_configs', sa.Column('transcriber_language', sa.String(10), server_default='en', nullable=False))

    # === Migrate data back ===
    op.execute("""
        UPDATE studio_configs sc SET
            admin_email = ec.admin_email,
            fallback_email = ec.fallback_email,
            summary_email = ec.summary_email,
            smtp_server = ec.smtp_server,
            smtp_port = ec.smtp_port,
            smtp_username = ec.smtp_username,
            smtp_password_encrypted = ec.smtp_password_encrypted
        FROM email_configs ec
        WHERE ec.studio_config_id = sc.id
    """)

    op.execute("""
        UPDATE studio_configs sc SET
            voice_provider = vc.voice_provider,
            voice_id = vc.voice_id,
            voice_speed = vc.voice_speed
        FROM voice_configs vc
        WHERE vc.studio_config_id = sc.id
    """)

    op.execute("""
        UPDATE studio_configs sc SET
            ai_model = ac.ai_model,
            ai_temperature = ac.ai_temperature,
            ai_max_tokens = ac.ai_max_tokens
        FROM ai_configs ac
        WHERE ac.studio_config_id = sc.id
    """)

    op.execute("""
        UPDATE studio_configs sc SET
            transcriber_provider = tc.transcriber_provider,
            transcriber_model = tc.transcriber_model,
            transcriber_language = tc.transcriber_language
        FROM transcriber_configs tc
        WHERE tc.studio_config_id = sc.id
    """)

    # === Drop new tables ===
    op.drop_table('transcriber_configs')
    op.drop_table('ai_configs')
    op.drop_table('voice_configs')
    op.drop_table('email_configs')
