# 🧪 AVA Tests - DIVINE Testing Strategy

## 📋 Overview

Tests suivent les préceptes du CODEX DIVIN : Clean, Isolated, Comprehensive.

## 🔧 Setup

### 1. Create Test Database

```bash
# Create PostgreSQL test database
/opt/homebrew/bin/psql postgres -c "CREATE DATABASE avaai_test;"

# Or use the setup script
./tests/setup_test_db.sh
```

### 2. Install Test Dependencies

```bash
pip install pytest pytest-asyncio httpx
```

### 3. Set Test Database URL (Optional)

```bash
# In api/.env (optional - defaults to avaai_test)
AVA_API_TEST_DATABASE_URL=postgresql+asyncpg://nissielberrebi@localhost:5432/avaai_test
```

## 🚀 Running Tests

```bash
# Run all tests
cd api
pytest

# Run specific test file
pytest tests/test_ava_profile_routes.py

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=api.src --cov-report=html
```

## 🏗️ Test Architecture

### Test Database Strategy

- **PostgreSQL for Tests**: Uses same DB engine as production
- **Isolated Test DB**: `avaai_test` database separate from `avaai_db`
- **Clean Slate**: Tables created before each test, dropped after
- **No SQLite**: Eliminated in-memory SQLite for consistency

### Why PostgreSQL for Tests?

✅ **Production Parity**: Same DB engine = same behavior  
✅ **UUID Support**: Native PostgreSQL UUID types work  
✅ **JSON Fields**: PostgreSQL JSON behavior matches prod  
✅ **Constraints**: Foreign keys, indexes work identically  
✅ **Confidence**: If tests pass, prod will work  

### Test Fixtures

- `event_loop`: Async test loop for pytest-asyncio
- `session`: PostgreSQL test session with cleanup
- `create_test_app()`: FastAPI app with session override

## 📝 Test Coverage Goals

- Unit Tests: 80%+ coverage
- Integration Tests: All API endpoints
- E2E Tests: Critical user flows

## 🎯 DIVINE Testing Principles

1. **Isolation**: Each test independent, no side effects
2. **Fast**: < 5 seconds total test suite
3. **Clear**: Test names describe what they test
4. **Comprehensive**: Happy path + edge cases + errors
5. **Maintainable**: Easy to update when code changes

## 📚 Test Categories

### Unit Tests
- Business logic (services, utilities)
- Domain models validation
- Pure functions

### Integration Tests
- API endpoints (routes)
- Database operations (repositories)
- External service mocks

### E2E Tests
- Full user flows
- Authentication
- Multi-step operations

## 🐛 Debugging Tests

```bash
# Run with print statements visible
pytest -s

# Run specific test
pytest tests/test_ava_profile_routes.py::test_build_system_prompt_injects_all_fields

# Stop on first failure
pytest -x

# Debug with pdb
pytest --pdb
```

## 🔄 CI/CD Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests (GitHub Actions)
- Before deployment

## 📖 Writing New Tests

```python
import pytest
from api.src.infrastructure.persistence.models import User

@pytest.mark.asyncio
async def test_user_creation(session):
    """Test user is created with correct fields."""
    user_data = {
        "email": "test@divine.ai",
        "password": "hashed_password",
        "name": "Test User"
    }
    
    user = User(**user_data)
    session.add(user)
    await session.commit()
    
    assert user.id is not None
    assert user.email == "test@divine.ai"
```

## 🎯 Best Practices

- **Arrange-Act-Assert**: Clear test structure
- **One assertion per test**: Test one thing at a time
- **Descriptive names**: `test_user_login_fails_with_invalid_password`
- **Clean fixtures**: Setup and teardown properly
- **Mock external services**: Don't call real APIs in tests

---

**STATUS**: DIVINE ✨  
**LAST UPDATE**: 2025-10-24
