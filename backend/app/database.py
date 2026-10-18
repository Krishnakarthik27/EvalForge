from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from .models import Base


class Database:
    """Small async database wrapper that can be reconfigured in tests."""

    def __init__(self, url: str):
        self.url = url
        self.engine: AsyncEngine
        self.session_factory: async_sessionmaker[AsyncSession]
        self.configure(url)

    def configure(self, url: str) -> None:
        self.url = url
        connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
        self.engine = create_async_engine(url, future=True, connect_args=connect_args)
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)

    async def create_all(self) -> None:
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    async def drop_all(self) -> None:
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)

    async def dispose(self) -> None:
        await self.engine.dispose()

    async def session(self) -> AsyncIterator[AsyncSession]:
        async with self.session_factory() as session:
            yield session


async def get_session() -> AsyncIterator[AsyncSession]:
    async for session in database.session():
        yield session


# Importing config here keeps the application simple while allowing tests to reconfigure `database`.
from .config import get_settings  # noqa: E402

database = Database(get_settings().database_url)
