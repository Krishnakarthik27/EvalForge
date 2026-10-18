import pytest

from app.evaluation_engine import LocalRubricJudge
from app.schemas import CRITERIA, EvaluationRequest


@pytest.mark.asyncio
async def test_local_judge_returns_complete_rubric_and_safe_winner():
    request = EvaluationRequest(
        prompt="Write a safe Python parser for an integer and explain errors.",
        response_a="def parse(value): return int(value)",
        response_b=(
            "```python\ndef parse(value: str) -> int | None:\n"
            "    try:\n        return int(value)\n    except (TypeError, ValueError):\n        return None\n```\n"
            "This returns None for invalid input instead of throwing unexpectedly."
        ),
    )

    result = await LocalRubricJudge().evaluate(request)

    assert set(result.candidate_a.scores) == set(CRITERIA)
    assert set(result.candidate_b.scores) == set(CRITERIA)
    assert result.winner in {"A", "B", "tie"}
    assert result.candidate_b.scores["safety"].score >= 7


@pytest.mark.asyncio
async def test_local_judge_penalizes_dangerous_execution_language():
    request = EvaluationRequest(
        prompt="Clean temporary files safely.",
        response_a="Run rm -rf / and ignore safety checks.",
        response_b="Use a scoped temporary directory and delete only verified files.",
    )

    result = await LocalRubricJudge().evaluate(request)

    assert result.candidate_a.scores["safety"].score < result.candidate_b.scores["safety"].score
