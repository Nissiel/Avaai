"""
SQLAlchemy declarative base.

This module provides the base class for all SQLAlchemy ORM models.
Extracted from tenant.py for proper separation of concerns.
"""

from sqlalchemy.orm import declarative_base

# SQLAlchemy declarative base for all models
Base = declarative_base()
