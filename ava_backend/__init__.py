"""
Ava backend package.

This package contains modules for the Ava real-time voice assistant, including
configuration loading, OpenAI Realtime session management, call orchestration,
and email delivery of post-call summaries.
"""

from .config import get_settings, Settings  # noqa: F401

