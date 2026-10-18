from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .database import database, get_session
from .evaluation_engine import EvaluationService
from .models import Evaluation
from .schemas import (
    EvaluationHistoryItem,
    EvaluationRequest,
    EvaluationResponse,
    EvaluationResult,
    HealthResponse,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await database.create_all()
    yield
    await database.dispose()


def to_response(record: Evaluation) -> EvaluationResponse:
    result = EvaluationResult.model_validate(record.result)
    return EvaluationResponse(
        id=record.id,
        prompt=record.prompt,
        response_a=record.response_a,
        response_b=record.response_b,
        created_at=record.created_at,
        **result.model_dump(),
    )


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="EvalForge API",
        version="1.0.0",
        description="Compare AI responses using a five-criterion evaluation rubric.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    service = EvaluationService(settings)

    @app.get("/health", response_model=HealthResponse, tags=["system"])
    async def health() -> HealthResponse:
        return HealthResponse(status="ok", service="evalforge-api")

    @app.post(
        "/api/v1/evaluations",
        response_model=EvaluationResponse,
        status_code=201,
        tags=["evaluations"],
    )
    async def create_evaluation(
        payload: EvaluationRequest, session: AsyncSession = Depends(get_session)
    ) -> EvaluationResponse:
        result = await service.evaluate(payload)
        record = Evaluation(
            prompt=payload.prompt,
            response_a=payload.response_a,
            response_b=payload.response_b,
            result=result.model_dump(mode="json"),
        )
        session.add(record)
        await session.commit()
        await session.refresh(record)
        return to_response(record)

    @app.get(
        "/api/v1/evaluations", response_model=list[EvaluationHistoryItem], tags=["evaluations"]
    )
    async def list_evaluations(
        limit: int = Query(default=20, ge=1, le=100),
        session: AsyncSession = Depends(get_session),
    ) -> list[EvaluationHistoryItem]:
        records = (
            await session.scalars(
                select(Evaluation).order_by(Evaluation.created_at.desc()).limit(limit)
            )
        ).all()
        return [
            EvaluationHistoryItem(
                id=record.id,
                prompt=record.prompt,
                winner=record.result["winner"],
                confidence=record.result["confidence"],
                engine=record.result["engine"],
                created_at=record.created_at,
                candidate_a_average=record.result["candidate_a"]["average"],
                candidate_b_average=record.result["candidate_b"]["average"],
            )
            for record in records
        ]

    @app.get(
        "/api/v1/evaluations/{evaluation_id}",
        response_model=EvaluationResponse,
        tags=["evaluations"],
    )
    async def get_evaluation(
        evaluation_id: str, session: AsyncSession = Depends(get_session)
    ) -> EvaluationResponse:
        record = await session.get(Evaluation, evaluation_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        return to_response(record)

    return app


app = create_app()
