from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

CRITERIA = ("correctness", "code_quality", "efficiency", "helpfulness", "safety")


class EvaluationRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=12_000)
    response_a: str = Field(min_length=1, max_length=30_000)
    response_b: str = Field(min_length=1, max_length=30_000)

    @field_validator("prompt", "response_a", "response_b")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class CriterionScore(BaseModel):
    score: int = Field(ge=1, le=10)
    explanation: str = Field(min_length=3, max_length=500)


class CandidateResult(BaseModel):
    scores: dict[str, CriterionScore]
    average: float = Field(ge=1, le=10)
    summary: str = Field(min_length=3, max_length=800)

    @field_validator("scores")
    @classmethod
    def requires_full_rubric(cls, value: dict[str, CriterionScore]) -> dict[str, CriterionScore]:
        missing = set(CRITERIA).difference(value)
        if missing:
            raise ValueError(f"Missing rubric criteria: {', '.join(sorted(missing))}")
        return value


class EvaluationResult(BaseModel):
    candidate_a: CandidateResult
    candidate_b: CandidateResult
    winner: Literal["A", "B", "tie"]
    rationale: str = Field(min_length=3, max_length=1_200)
    confidence: int = Field(ge=0, le=100)
    engine: str = Field(min_length=2, max_length=100)


class EvaluationResponse(EvaluationResult):
    id: str
    prompt: str
    response_a: str
    response_b: str
    created_at: datetime


class EvaluationHistoryItem(BaseModel):
    id: str
    prompt: str
    winner: Literal["A", "B", "tie"]
    confidence: int
    engine: str
    created_at: datetime
    candidate_a_average: float
    candidate_b_average: float


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
