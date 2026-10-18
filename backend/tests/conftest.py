import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.database import database
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def isolated_database():
    await database.dispose()
    database.configure("sqlite+aiosqlite:///:memory:")
    await database.create_all()
    yield
    await database.drop_all()
    await database.dispose()


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client
